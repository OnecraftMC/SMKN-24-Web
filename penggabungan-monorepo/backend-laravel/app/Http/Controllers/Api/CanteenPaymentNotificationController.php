<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CanteenPaymentNotificationController
{
    public function __invoke(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $serverKey = (string) env('MIDTRANS_SERVER_KEY', '');
        if ($serverKey === '') {
            return response()->json(['error' => 'Payment gateway is not configured.'], 503);
        }

        $orderNo = is_string($body['order_id'] ?? null) ? $body['order_id'] : '';
        $statusCode = is_string($body['status_code'] ?? null) ? $body['status_code'] : '';
        $grossAmount = is_string($body['gross_amount'] ?? null)
            ? $body['gross_amount']
            : (is_numeric($body['gross_amount'] ?? null) ? (string) $body['gross_amount'] : '');
        $signature = is_string($body['signature_key'] ?? null) ? $body['signature_key'] : '';
        $expected = hash('sha512', $orderNo . $statusCode . $grossAmount . $serverKey);
        if ($orderNo === '' || !hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Signature pembayaran tidak valid.'], 401);
        }

        try {
            DB::transaction(function () use ($body, $orderNo, $grossAmount): void {
                $order = DB::table('canteen_orders as o')
                    ->join('canteen_payments as p', 'p.order_id', '=', 'o.id')
                    ->where('o.order_no', $orderNo)
                    ->lockForUpdate()
                    ->select('o.*', 'p.id as payment_id')
                    ->first();
                if (!$order || (int) round((float) $grossAmount) !== (int) $order->total) {
                    throw new PaymentNotificationException('Transaksi tidak cocok dengan pesanan.', 422);
                }

                $transactionStatus = is_string($body['transaction_status'] ?? null)
                    ? $body['transaction_status']
                    : '';
                $fraudStatus = is_string($body['fraud_status'] ?? null) ? $body['fraud_status'] : '';
                $transactionId = is_string($body['transaction_id'] ?? null)
                    ? $body['transaction_id']
                    : $orderNo;
                $statusCode = is_string($body['status_code'] ?? null) ? $body['status_code'] : '';
                $eventKey = $transactionId . ':' . $transactionStatus . ':' . $statusCode;
                DB::table('canteen_payment_events')->insertOrIgnore([
                    'order_id' => $order->id,
                    'event_key' => $eventKey,
                    'provider_status' => $transactionStatus,
                ]);
                DB::table('canteen_payments')->where('id', $order->payment_id)->update([
                    'transaction_id' => is_string($body['transaction_id'] ?? null) ? $body['transaction_id'] : null,
                    'provider_status' => $transactionStatus,
                    'raw_notification' => json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                ]);

                if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && ($fraudStatus === '' || $fraudStatus === 'accept'))) {
                    DB::table('canteen_orders')->where('id', $order->id)->update([
                        'payment_status' => 'paid',
                        'status' => DB::raw("IF(status = 'awaiting_payment', 'received', status)"),
                        'paid_at' => DB::raw('COALESCE(paid_at, NOW())'),
                    ]);
                } elseif ($transactionStatus === 'expire') {
                    DB::table('canteen_orders')
                        ->where('id', $order->id)
                        ->where('payment_status', 'pending')
                        ->update([
                            'payment_status' => 'expired',
                            'status' => DB::raw("IF(status = 'awaiting_payment', 'cancelled', status)"),
                        ]);
                } elseif (in_array($transactionStatus, ['deny', 'cancel'], true)) {
                    DB::table('canteen_orders')
                        ->where('id', $order->id)
                        ->where('payment_status', 'pending')
                        ->update([
                            'payment_status' => 'failed',
                            'status' => DB::raw("IF(status = 'awaiting_payment', 'cancelled', status)"),
                        ]);
                } elseif (in_array($transactionStatus, ['refund', 'partial_refund'], true)) {
                    DB::table('canteen_orders')->where('id', $order->id)->update(['payment_status' => 'refunded']);
                }
            });
        } catch (PaymentNotificationException $error) {
            return response()->json(['error' => $error->getMessage()], $error->status);
        }

        return response()->json(['received' => true]);
    }
}

final class PaymentNotificationException extends \RuntimeException
{
    public function __construct(string $message, public readonly int $status)
    {
        parent::__construct($message);
    }
}
