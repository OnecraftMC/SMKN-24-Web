<?php

namespace App\Support;

use RuntimeException;

final class CanteenSellerToken
{
    public function issue(int $sellerId, int $standId): string
    {
        $key = $this->key();
        if ($key === null) {
            throw new RuntimeException('JWT_SECRET belum dikonfigurasi.');
        }
        $header = $this->encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = $this->encode([
            'sub' => $sellerId,
            'stand_id' => $standId,
            'aud' => 'smkn24-canteen-seller',
            'iat' => time(),
            'exp' => time() + 12 * 60 * 60,
        ]);
        $signed = $header . '.' . $payload;

        return $signed . '.' . $this->encode(hash_hmac('sha256', $signed, $key, true));
    }

    public function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        $key = $this->key();
        if ($key === null) {
            return null;
        }
        [$header, $body, $signature] = $parts;
        $expected = $this->encode(hash_hmac('sha256', "$header.$body", $key, true));
        $claims = json_decode($this->decode($body), true);
        if (!hash_equals($expected, $signature) || !is_array($claims)
            || ($claims['aud'] ?? '') !== 'smkn24-canteen-seller'
            || ($claims['exp'] ?? 0) < time()) {
            return null;
        }

        return $claims;
    }

    private function key(): ?string
    {
        $secret = trim((string) env('JWT_SECRET', ''));

        return $secret === '' ? null : hash_hmac('sha256', 'smkn24-canteen-seller-v1', $secret);
    }

    private function encode(string|array $value): string
    {
        $raw = is_array($value) ? json_encode($value) : $value;

        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private function decode(string $value): string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4), true);

        return is_string($decoded) ? $decoded : '';
    }
}
