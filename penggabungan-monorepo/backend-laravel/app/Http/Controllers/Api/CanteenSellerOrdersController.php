<?php

namespace App\Http\Controllers\Api;

use App\Support\CanteenSellerToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CanteenSellerOrdersController
{
    public function __invoke(Request $request, CanteenSellerToken $tokens): JsonResponse
    {
        $claims = $tokens->verify($request->bearerToken() ?? '');
        if ($claims === null) {
            return response()->json(['error' => 'Sesi penjual tidak valid atau sudah kedaluwarsa.'], 401);
        }
        $seller = DB::table('canteen_users')
            ->where('id', (int) ($claims['sub'] ?? 0))
            ->first(['id', 'stand_id', 'is_active', 'must_change_password']);
        if (!$seller || !(int) $seller->is_active || (int) $seller->stand_id !== (int) ($claims['stand_id'] ?? 0)) {
            return response()->json(['error' => 'Akun penjual tidak aktif.'], 401);
        }
        if ((int) $seller->must_change_password) {
            return response()->json(['error' => 'Ganti kata sandi sementara terlebih dahulu.'], 403);
        }

        return $request->isMethod('GET') || $request->isMethod('HEAD')
            ? $this->index((int) $seller->stand_id)
            : $this->update($request, (int) $seller->stand_id);
    }

    private function index(int $standId): JsonResponse
    {
        $orders = DB::table('canteen_orders')
            ->select('id', 'order_no', 'buyer_name', 'buyer_class', 'fulfillment', 'subtotal', 'delivery_fee',
                'total', 'status', 'payment_status', 'paid_at', 'created_at')
            ->where('stand_id', $standId)
            ->where('payment_status', 'paid')
            ->whereIn('status', ['received', 'preparing', 'ready'])
            ->orderByRaw("FIELD(status,'received','preparing','ready')")
            ->orderBy('paid_at')
            ->limit(100)
            ->get();

        foreach ($orders as $order) {
            $order->id = (int) $order->id;
            foreach (['subtotal', 'delivery_fee', 'total'] as $field) {
                $order->{$field} = (int) $order->{$field};
            }
            $order->deliveryFee = $order->delivery_fee;
            unset($order->delivery_fee);
            $order->items = DB::table('canteen_order_items')
                ->select('item_name as name', 'unit_price as unitPrice', 'quantity', 'line_total as lineTotal')
                ->where('order_id', $order->id)
                ->orderBy('id')
                ->get()
                ->map(static function (object $item): object {
                    $item->unitPrice = (int) $item->unitPrice;
                    $item->quantity = (int) $item->quantity;
                    $item->lineTotal = (int) $item->lineTotal;

                    return $item;
                });
        }

        return response()->json(['orders' => $orders, 'polledAt' => now()->toAtomString()]);
    }

    private function update(Request $request, int $standId): JsonResponse
    {
        $body = $request->json()->all();
        $from = $body['fromStatus'] ?? '';
        $to = $body['status'] ?? '';
        $allowed = ['received' => 'preparing', 'preparing' => 'ready', 'ready' => 'completed'];
        if (!is_string($from) || !is_string($to) || !isset($allowed[$from]) || $allowed[$from] !== $to) {
            return response()->json(['error' => 'Perubahan status pesanan tidak valid.'], 422);
        }
        $orderNo = is_string($body['orderNo'] ?? null) ? trim($body['orderNo']) : '';
        $updated = DB::table('canteen_orders')
            ->where('order_no', $orderNo)
            ->where('stand_id', $standId)
            ->where('payment_status', 'paid')
            ->where('status', $from)
            ->update(['status' => $to]);
        if ($updated !== 1) {
            return response()->json(['error' => 'Pesanan berubah atau tidak tersedia. Segarkan daftar pesanan.'], 409);
        }

        return response()->json(['updated' => true]);
    }
}
