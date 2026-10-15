<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../helpers/canteen.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $orderNo = trim((string)($_GET['order'] ?? ''));
    $token = getBearerToken();
    if ($orderNo === '' || !$token) jsonError('Nomor pesanan dan token pelacakan diperlukan.', 400);
    $query = $db->prepare('SELECT o.*, s.name AS stand_name FROM canteen_orders o JOIN canteen_stands s ON s.id = o.stand_id WHERE o.order_no = ? LIMIT 1');
    $query->execute([$orderNo]);
    $order = $query->fetch();
    if (!$order || !hash_equals($order['buyer_token_hash'], hash('sha256', $token))) jsonError('Pesanan tidak ditemukan.', 404);
    jsonResponse(canteenPublicOrder($db, $order));
}

if ($method !== 'POST') jsonError('Method tidak diizinkan.', 405);
$body = getJsonBody();
$buyerName = canteenString($body, 'buyerName', 120);
$buyerClass = canteenString($body, 'buyerClass', 60);
$fulfillment = $body['fulfillment'] ?? '';
if (!in_array($fulfillment, ['delivery', 'pickup'], true)) jsonError('Pilih Diantar atau Ambil Sendiri.', 422);
$standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
$requestedItems = $body['items'] ?? [];
if (!$standId || !is_array($requestedItems) || count($requestedItems) < 1 || count($requestedItems) > 40) {
    jsonError('Keranjang tidak valid.', 422);
}

$quantities = [];
foreach ($requestedItems as $item) {
    $id = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || !$quantity || $quantity < 1 || $quantity > 20) jsonError('Jumlah menu tidak valid.', 422);
    $quantities[$id] = ($quantities[$id] ?? 0) + $quantity;
    if ($quantities[$id] > 20) jsonError('Maksimal 20 untuk setiap menu.', 422);
}

if ((string)env('MIDTRANS_SERVER_KEY', '') === '') {
    jsonError('Pembayaran online belum dikonfigurasi. Hubungi administrator kantin.', 503);
}
if (!function_exists('curl_init')) jsonError('Layanan pembayaran tidak tersedia di server.', 503);

$token = bin2hex(random_bytes(32));
$orderNo = 'KNT-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
$deliveryFee = $fulfillment === 'delivery' ? 4000 : 0;
$db->beginTransaction();
try {
    $standQuery = $db->prepare('SELECT id FROM canteen_stands WHERE id = ? AND is_active = 1 FOR UPDATE');
    $standQuery->execute([$standId]);
    if (!$standQuery->fetch()) jsonError('Stand tidak tersedia.', 404);
    $ids = array_keys($quantities);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $menuQuery = $db->prepare("SELECT id, stand_id, name, price FROM canteen_menu_items WHERE id IN ($placeholders) AND stand_id = ? AND is_available = 1 FOR UPDATE");
    $menuQuery->execute([...$ids, $standId]);
    $menus = $menuQuery->fetchAll();
    if (count($menus) !== count($ids)) jsonError('Ada menu yang sudah tidak tersedia. Segarkan halaman dan coba lagi.', 409);
    $subtotal = 0;
    foreach ($menus as $menu) $subtotal += (int)$menu['price'] * $quantities[(int)$menu['id']];
    $total = $subtotal + $deliveryFee;
    $insert = $db->prepare("INSERT INTO canteen_orders (order_no, stand_id, buyer_name, buyer_class, fulfillment, subtotal, delivery_fee, total, buyer_token_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $insert->execute([$orderNo, $standId, $buyerName, $buyerClass, $fulfillment, $subtotal, $deliveryFee, $total, hash('sha256', $token)]);
    $orderId = (int)$db->lastInsertId();
    $insertItem = $db->prepare('INSERT INTO canteen_order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)');
    $snapItems = [];
    foreach ($menus as $menu) {
        $quantity = $quantities[(int)$menu['id']];
        $lineTotal = (int)$menu['price'] * $quantity;
        $insertItem->execute([$orderId, (int)$menu['id'], $menu['name'], (int)$menu['price'], $quantity, $lineTotal]);
        $paymentName = canteenTruncate($menu['name'], 50);
        $snapItems[] = ['id' => (string)$menu['id'], 'price' => (int)$menu['price'], 'quantity' => $quantity, 'name' => $paymentName];
    }
    if ($deliveryFee > 0) $snapItems[] = ['id' => 'delivery', 'price' => $deliveryFee, 'quantity' => 1, 'name' => 'Biaya antar'];
    $db->prepare("INSERT INTO canteen_payments (order_id, amount) VALUES (?, ?)")->execute([$orderId, $total]);
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    throw $e;
}

$baseUrl = rtrim((string)env('CANTEEN_PUBLIC_URL', ''), '/');
$returnUrl = $baseUrl !== '' ? $baseUrl . '/kantin?order=' . rawurlencode($orderNo) : '';
$snapPayload = [
    'transaction_details' => ['order_id' => $orderNo, 'gross_amount' => $total],
    'item_details' => $snapItems,
    'customer_details' => ['first_name' => $buyerName],
    'enabled_payments' => ['gopay', 'qris'],
    'custom_field1' => $buyerClass,
    'custom_field2' => $fulfillment,
];
if ($returnUrl !== '') $snapPayload['callbacks'] = ['finish' => $returnUrl];
$payment = midtransSnapRequest($snapPayload);

$db->prepare('UPDATE canteen_payments SET snap_token = ?, redirect_url = ?, provider_status = ? WHERE order_id = ?')
    ->execute([$payment['token'], $payment['redirect_url'], 'pending', $orderId]);
jsonResponse([
    'orderNo' => $orderNo,
    'buyerToken' => $token,
    'snapToken' => $payment['token'],
    'redirectUrl' => $payment['redirect_url'],
    'statusUrl' => '/kantin?order=' . rawurlencode($orderNo),
]);
