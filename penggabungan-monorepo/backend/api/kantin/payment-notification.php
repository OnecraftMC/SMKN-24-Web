<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../helpers/canteen.php';
requireMethod('POST');

$body = getJsonBody();
$serverKey = (string)env('MIDTRANS_SERVER_KEY', '');
if ($serverKey === '') jsonError('Payment gateway is not configured.', 503);
$orderNo = (string)($body['order_id'] ?? '');
$statusCode = (string)($body['status_code'] ?? '');
$grossAmount = (string)($body['gross_amount'] ?? '');
$signature = (string)($body['signature_key'] ?? '');
$expected = hash('sha512', $orderNo . $statusCode . $grossAmount . $serverKey);
if ($orderNo === '' || !hash_equals($expected, $signature)) jsonError('Signature pembayaran tidak valid.', 401);

$db = getDB();
$db->beginTransaction();
try {
    $find = $db->prepare('SELECT o.*, p.id AS payment_id FROM canteen_orders o JOIN canteen_payments p ON p.order_id = o.id WHERE o.order_no = ? FOR UPDATE');
    $find->execute([$orderNo]);
    $order = $find->fetch();
    if (!$order || (int)round((float)$grossAmount) !== (int)$order['total']) {
        $db->rollBack();
        jsonError('Transaksi tidak cocok dengan pesanan.', 422);
    }
    $transactionStatus = (string)($body['transaction_status'] ?? '');
    $fraudStatus = (string)($body['fraud_status'] ?? '');
    $eventKey = (string)($body['transaction_id'] ?? $orderNo) . ':' . $transactionStatus . ':' . ($body['status_code'] ?? '');
    $db->prepare('INSERT IGNORE INTO canteen_payment_events (order_id, event_key, provider_status) VALUES (?, ?, ?)')
        ->execute([(int)$order['id'], $eventKey, $transactionStatus]);
    $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $db->prepare('UPDATE canteen_payments SET transaction_id = ?, provider_status = ?, raw_notification = ? WHERE id = ?')
        ->execute([$body['transaction_id'] ?? null, $transactionStatus, $json, (int)$order['payment_id']]);

    if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && ($fraudStatus === '' || $fraudStatus === 'accept'))) {
        $db->prepare("UPDATE canteen_orders SET payment_status = 'paid', status = IF(status = 'awaiting_payment', 'received', status), paid_at = COALESCE(paid_at, NOW()) WHERE id = ?")
            ->execute([(int)$order['id']]);
    } elseif ($transactionStatus === 'expire') {
        $db->prepare("UPDATE canteen_orders SET payment_status = 'expired', status = IF(status = 'awaiting_payment', 'cancelled', status) WHERE id = ? AND payment_status = 'pending'")
            ->execute([(int)$order['id']]);
    } elseif (in_array($transactionStatus, ['deny', 'cancel'], true)) {
        $db->prepare("UPDATE canteen_orders SET payment_status = 'failed', status = IF(status = 'awaiting_payment', 'cancelled', status) WHERE id = ? AND payment_status = 'pending'")
            ->execute([(int)$order['id']]);
    } elseif ($transactionStatus === 'refund' || $transactionStatus === 'partial_refund') {
        $db->prepare("UPDATE canteen_orders SET payment_status = 'refunded' WHERE id = ?")
            ->execute([(int)$order['id']]);
    }
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    throw $e;
}
jsonResponse(['received' => true]);
