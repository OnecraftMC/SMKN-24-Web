<?php

namespace App\Http\Controllers\Api;

use App\Support\MidtransClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class CanteenOrdersController
{
    public function __invoke(Request $request, MidtransClient $midtrans): JsonResponse
    {
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return $this->track($request);
        }

        return $this->create($request, $midtrans);
    }

    private function track(Request $request): JsonResponse
    {
        $orderNo = trim((string) $request->query('order', ''));
        $token = $request->bearerToken();
        if ($orderNo === '' || !$token) {
            return response()->json(['error' => 'Nomor pesanan dan token pelacakan diperlukan.'], 400);
        }
        $order = DB::table('canteen_orders as o')
            ->join('canteen_stands as s', 's.id', '=', 'o.stand_id')
            ->where('o.order_no', $orderNo)
            ->select('o.*', 's.name as stand_name')
            ->first();
        if (!$order || !hash_equals($order->buyer_token_hash, hash('sha256', $token))) {
            return response()->json(['error' => 'Pesanan tidak ditemukan.'], 404);
        }
        $items = DB::table('canteen_order_items')
            ->where('order_id', $order->id)
            ->orderBy('id')
            ->get(['item_name', 'unit_price', 'quantity', 'line_total'])
            ->map(static function (object $item): object {
                $item->unit_price = (int) $item->unit_price;
                $item->quantity = (int) $item->quantity;
                $item->line_total = (int) $item->line_total;

                return $item;
            });

        return response()->json([
            'orderNo' => $order->order_no,
            'standName' => $order->stand_name,
            'buyerName' => $order->buyer_name,
            'buyerClass' => $order->buyer_class,
            'fulfillment' => $order->fulfillment,
            'items' => $items,
            'subtotal' => (int) $order->subtotal,
            'deliveryFee' => (int) $order->delivery_fee,
            'total' => (int) $order->total,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'paidAt' => $order->paid_at,
            'createdAt' => $order->created_at,
        ]);
    }

    private function create(Request $request, MidtransClient $midtrans): JsonResponse
    {
        $body = $request->json()->all();
        try {
            $buyerName = $this->requiredString($body, 'buyerName', 120);
            $buyerClass = $this->requiredString($body, 'buyerClass', 60);
        } catch (CheckoutException $error) {
            return response()->json(['error' => $error->getMessage()], $error->status);
        }
        $fulfillment = $body['fulfillment'] ?? '';
        if (!in_array($fulfillment, ['delivery', 'pickup'], true)) {
            return response()->json(['error' => 'Pilih Diantar atau Ambil Sendiri.'], 422);
        }
        $standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
        $requested = $body['items'] ?? [];
        if (!$standId || !is_array($requested) || count($requested) < 1 || count($requested) > 40) {
            return response()->json(['error' => 'Keranjang tidak valid.'], 422);
        }

        $quantities = [];
        foreach ($requested as $item) {
            if (!is_array($item)) {
                return response()->json(['error' => 'Jumlah menu tidak valid.'], 422);
            }
            $id = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
            if (!$id || !$quantity || $quantity < 1 || $quantity > 20) {
                return response()->json(['error' => 'Jumlah menu tidak valid.'], 422);
            }
            $quantities[$id] = ($quantities[$id] ?? 0) + $quantity;
            if ($quantities[$id] > 20) {
                return response()->json(['error' => 'Maksimal 20 untuk setiap menu.'], 422);
            }
        }
        if ((string) env('MIDTRANS_SERVER_KEY', '') === '') {
            return response()->json(['error' => 'Pembayaran online belum dikonfigurasi. Hubungi administrator kantin.'], 503);
        }
        if (!function_exists('curl_init')) {
            return response()->json(['error' => 'Layanan pembayaran tidak tersedia di server.'], 503);
        }

        $token = bin2hex(random_bytes(32));
        $orderNo = 'KNT-' . now()->format('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
        $deliveryFee = $fulfillment === 'delivery' ? 4000 : 0;

        try {
            [$orderId, $total, $snapItems] = DB::transaction(function () use (
                $standId,
                $quantities,
                $buyerName,
                $buyerClass,
                $fulfillment,
                $deliveryFee,
                $token,
                $orderNo
            ): array {
                $standAvailable = DB::table('canteen_stands')
                    ->where('id', $standId)
                    ->where('is_active', 1)
                    ->lockForUpdate()
                    ->first(['id']);
                if (!$standAvailable) {
                    throw new CheckoutException('Stand tidak tersedia.', 404);
                }

                $ids = array_keys($quantities);
                $menus = DB::table('canteen_menu_items')
                    ->whereIn('id', $ids)
                    ->where('stand_id', $standId)
                    ->where('is_available', 1)
                    ->lockForUpdate()
                    ->get(['id', 'stand_id', 'name', 'price']);
                if ($menus->count() !== count($ids)) {
                    throw new CheckoutException('Ada menu yang sudah tidak tersedia. Segarkan halaman dan coba lagi.', 409);
                }

                $subtotal = 0;
                foreach ($menus as $menu) {
                    $subtotal += (int) $menu->price * $quantities[(int) $menu->id];
                }
                $total = $subtotal + $deliveryFee;
                $orderId = DB::table('canteen_orders')->insertGetId([
                    'order_no' => $orderNo,
                    'stand_id' => $standId,
                    'buyer_name' => $buyerName,
                    'buyer_class' => $buyerClass,
                    'fulfillment' => $fulfillment,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total' => $total,
                    'buyer_token_hash' => hash('sha256', $token),
                ]);

                $snapItems = [];
                foreach ($menus as $menu) {
                    $quantity = $quantities[(int) $menu->id];
                    $lineTotal = (int) $menu->price * $quantity;
                    DB::table('canteen_order_items')->insert([
                        'order_id' => $orderId,
                        'menu_item_id' => $menu->id,
                        'item_name' => $menu->name,
                        'unit_price' => $menu->price,
                        'quantity' => $quantity,
                        'line_total' => $lineTotal,
                    ]);
                    $snapItems[] = [
                        'id' => (string) $menu->id,
                        'price' => (int) $menu->price,
                        'quantity' => $quantity,
                        'name' => mb_substr($menu->name, 0, 50, 'UTF-8'),
                    ];
                }
                if ($deliveryFee > 0) {
                    $snapItems[] = ['id' => 'delivery', 'price' => $deliveryFee, 'quantity' => 1, 'name' => 'Biaya antar'];
                }
                DB::table('canteen_payments')->insert(['order_id' => $orderId, 'amount' => $total]);

                return [$orderId, $total, $snapItems];
            });
        } catch (CheckoutException $error) {
            return response()->json(['error' => $error->getMessage()], $error->status);
        }

        $baseUrl = rtrim((string) env('CANTEEN_PUBLIC_URL', ''), '/');
        $returnUrl = $baseUrl !== '' ? $baseUrl . '/kantin?order=' . rawurlencode($orderNo) : '';
        $payload = [
            'transaction_details' => ['order_id' => $orderNo, 'gross_amount' => $total],
            'item_details' => $snapItems,
            'customer_details' => ['first_name' => $buyerName],
            'enabled_payments' => ['gopay', 'qris'],
            'custom_field1' => $buyerClass,
            'custom_field2' => $fulfillment,
        ];
        if ($returnUrl !== '') {
            $payload['callbacks'] = ['finish' => $returnUrl];
        }

        try {
            $payment = $midtrans->createSnap($payload);
        } catch (RuntimeException $error) {
            return response()->json(['error' => $error->getMessage()], 502);
        }
        DB::table('canteen_payments')->where('order_id', $orderId)->update([
            'snap_token' => $payment['token'],
            'redirect_url' => $payment['redirect_url'],
            'provider_status' => 'pending',
        ]);

        return response()->json([
            'orderNo' => $orderNo,
            'buyerToken' => $token,
            'snapToken' => $payment['token'],
            'redirectUrl' => $payment['redirect_url'],
            'statusUrl' => '/kantin?order=' . rawurlencode($orderNo),
        ]);
    }

    private function requiredString(array $body, string $key, int $max): string
    {
        $value = is_string($body[$key] ?? null) ? trim($body[$key]) : '';
        if ($value === '' || mb_strlen($value, 'UTF-8') > $max) {
            throw new CheckoutException("Kolom $key wajib diisi (maksimal $max karakter).", 422);
        }

        return $value;
    }
}

final class CheckoutException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status)
    {
        parent::__construct($message);
    }
}
