<?php
/** Shared auth, validation, and payment helpers for the canteen API. */

function canteenSellerKey(): string
{
    return hash_hmac('sha256', 'smkn24-canteen-seller-v1', JWT_SECRET);
}

function generateCanteenSellerToken(array $claims): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $claims['aud'] = 'smkn24-canteen-seller';
    $claims['iat'] = time();
    $claims['exp'] = time() + (12 * 60 * 60);
    $head = base64UrlEncode(json_encode($header));
    $body = base64UrlEncode(json_encode($claims));
    $signature = base64UrlEncode(hash_hmac('sha256', "$head.$body", canteenSellerKey(), true));
    return "$head.$body.$signature";
}

function requireCanteenSeller(): array
{
    $token = getBearerToken();
    $parts = explode('.', (string)$token);
    if (count($parts) !== 3) jsonError('Sesi penjual tidak valid. Silakan masuk kembali.', 401);
    [$head, $body, $signature] = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "$head.$body", canteenSellerKey(), true));
    $payload = json_decode(base64UrlDecode($body), true);
    if (!hash_equals($expected, $signature) || !is_array($payload)
        || ($payload['aud'] ?? '') !== 'smkn24-canteen-seller'
        || ($payload['exp'] ?? 0) < time()) {
        jsonError('Sesi penjual tidak valid atau sudah kedaluwarsa.', 401);
    }
    return $payload;
}

function requireCanteenAdmin(): array
{
    $admin = requireAuth();
    if (!in_array($admin['role'] ?? '', ['admin', 'superadmin'], true)) {
        jsonError('Akses khusus administrator diperlukan.', 403);
    }
    return $admin;
}

function canteenString(array $body, string $key, int $max): string
{
    $value = trim((string)($body[$key] ?? ''));
    $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    if ($value === '' || $length > $max) jsonError("Kolom $key wajib diisi (maksimal $max karakter).", 422);
    return $value;
}

function canteenTruncate(string $value, int $length): string
{
    if (function_exists('mb_substr')) return mb_substr($value, 0, $length, 'UTF-8');
    $characters = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    return is_array($characters) ? implode('', array_slice($characters, 0, $length)) : substr($value, 0, $length);
}

function midtransSnapRequest(array $payload): array
{
    $serverKey = (string)env('MIDTRANS_SERVER_KEY', '');
    if ($serverKey === '') jsonError('Pembayaran online belum dikonfigurasi. Hubungi administrator kantin.', 503);
    if (!function_exists('curl_init')) jsonError('Layanan pembayaran tidak tersedia di server.', 503);
    $sandbox = filter_var(env('MIDTRANS_IS_PRODUCTION', 'false'), FILTER_VALIDATE_BOOLEAN) === false;
    $url = $sandbox
        ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
        : 'https://app.midtrans.com/snap/v1/transactions';
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_USERPWD => $serverKey . ':',
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 25,
    ]);
    $raw = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_HTTP_CODE);
    $error = curl_error($handle);
    curl_close($handle);
    $result = json_decode((string)$raw, true);
    if ($status < 200 || $status >= 300 || !is_array($result)
        || empty($result['token']) || empty($result['redirect_url'])) {
        error_log('[Kantin] Midtrans Snap request failed (' . $status . '): ' . ($error ?: (string)$raw));
        jsonError('Pembayaran belum dapat dibuat. Coba lagi beberapa saat.', 502);
    }
    return $result;
}

function canteenPublicOrder(PDO $db, array $order): array
{
    $items = $db->prepare('SELECT item_name, unit_price, quantity, line_total FROM canteen_order_items WHERE order_id = ? ORDER BY id');
    $items->execute([(int)$order['id']]);
    $orderItems = $items->fetchAll();
    foreach ($orderItems as &$item) {
        $item['unit_price'] = (int)$item['unit_price'];
        $item['quantity'] = (int)$item['quantity'];
        $item['line_total'] = (int)$item['line_total'];
    }
    unset($item);
    return [
        'orderNo' => $order['order_no'],
        'standName' => $order['stand_name'],
        'buyerName' => $order['buyer_name'],
        'buyerClass' => $order['buyer_class'],
        'fulfillment' => $order['fulfillment'],
        'items' => $orderItems,
        'subtotal' => (int)$order['subtotal'],
        'deliveryFee' => (int)$order['delivery_fee'],
        'total' => (int)$order['total'],
        'status' => $order['status'],
        'paymentStatus' => $order['payment_status'],
        'paidAt' => $order['paid_at'],
        'createdAt' => $order['created_at'],
    ];
}
