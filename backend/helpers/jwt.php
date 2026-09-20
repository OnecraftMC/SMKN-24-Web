<?php
/**
 * Implementasi JWT (HS256) sederhana tanpa dependency composer.
 * Untuk kebutuhan produksi skala besar, pertimbangkan firebase/php-jwt.
 */

require_once __DIR__ . '/../config/config.php';

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJwt(array $payload): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;

    $segments = [
        base64UrlEncode(json_encode($header)),
        base64UrlEncode(json_encode($payload)),
    ];

    $signature = hash_hmac('sha256', implode('.', $segments), JWT_SECRET, true);
    $segments[] = base64UrlEncode($signature);

    return implode('.', $segments);
}

function verifyJwt(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $validSignature = base64UrlEncode(
        hash_hmac('sha256', "$headerB64.$payloadB64", JWT_SECRET, true)
    );

    if (!hash_equals($validSignature, $signatureB64)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($payloadB64), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) {
        return null;
    }

    return $payload;
}

function getBearerToken(): ?string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Panggil di awal endpoint yang butuh login admin.
 * Return payload token jika valid, atau langsung 401 jika tidak.
 */
function requireAuth(): array
{
    $token = getBearerToken();
    if (!$token) {
        jsonError('Token tidak ditemukan. Silakan login.', 401);
    }

    $payload = verifyJwt($token);
    if (!$payload) {
        jsonError('Token tidak valid atau sudah kedaluwarsa.', 401);
    }

    return $payload;
}
