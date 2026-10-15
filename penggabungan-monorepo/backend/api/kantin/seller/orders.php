<?php
require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../helpers/canteen.php';
$claims = requireCanteenSeller();
$db = getDB();
$userQuery = $db->prepare('SELECT id, stand_id, is_active, must_change_password FROM canteen_users WHERE id = ? LIMIT 1');
$userQuery->execute([(int)$claims['sub']]);
$seller = $userQuery->fetch();
if (!$seller || !(int)$seller['is_active'] || (int)$seller['stand_id'] !== (int)$claims['stand_id']) jsonError('Akun penjual tidak aktif.', 401);
if ((int)$seller['must_change_password']) jsonError('Ganti kata sandi sementara terlebih dahulu.', 403);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $orders = $db->prepare("SELECT id, order_no, buyer_name, buyer_class, fulfillment, subtotal, delivery_fee, total, status, payment_status, paid_at, created_at FROM canteen_orders WHERE stand_id = ? AND payment_status = 'paid' AND status IN ('received','preparing','ready') ORDER BY FIELD(status,'received','preparing','ready'), paid_at ASC LIMIT 100");
    $orders->execute([(int)$seller['stand_id']]);
    $result = $orders->fetchAll();
    $items = $db->prepare('SELECT item_name AS name, unit_price AS unitPrice, quantity, line_total AS lineTotal FROM canteen_order_items WHERE order_id = ? ORDER BY id');
    foreach ($result as &$order) {
        $order['id'] = (int)$order['id'];
        foreach (['subtotal','delivery_fee','total'] as $field) $order[$field] = (int)$order[$field];
        $order['deliveryFee'] = $order['delivery_fee'];
        unset($order['delivery_fee']);
        $items->execute([$order['id']]);
        $order['items'] = $items->fetchAll();
        foreach ($order['items'] as &$item) {
            $item['unitPrice'] = (int)$item['unitPrice'];
            $item['lineTotal'] = (int)$item['lineTotal'];
            $item['quantity'] = (int)$item['quantity'];
        }
        unset($item);
    }
    unset($order);
    jsonResponse(['orders' => $result, 'polledAt' => date(DATE_ATOM)]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') jsonError('Method tidak diizinkan.', 405);
$body = getJsonBody();
$orderNo = trim((string)($body['orderNo'] ?? ''));
$nextStatus = (string)($body['status'] ?? '');
$allowed = ['received' => 'preparing', 'preparing' => 'ready', 'ready' => 'completed'];
if (!isset($allowed[$body['fromStatus'] ?? '']) || $allowed[$body['fromStatus']] !== $nextStatus) {
    jsonError('Perubahan status pesanan tidak valid.', 422);
}
$update = $db->prepare("UPDATE canteen_orders SET status = ? WHERE order_no = ? AND stand_id = ? AND payment_status = 'paid' AND status = ?");
$update->execute([$nextStatus, $orderNo, (int)$seller['stand_id'], (string)$body['fromStatus']]);
if ($update->rowCount() !== 1) jsonError('Pesanan berubah atau tidak tersedia. Segarkan daftar pesanan.', 409);
jsonResponse(['updated' => true]);
