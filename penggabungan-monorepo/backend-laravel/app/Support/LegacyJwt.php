<?php

namespace App\Support;

final class LegacyJwt
{
    public function __construct(
        private readonly string $secret,
        private readonly int $expirySeconds = 28800,
    ) {
    }

    public function issue(array $payload, ?int $now = null): string
    {
        $now ??= time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $this->expirySeconds;
        $header = $this->encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_THROW_ON_ERROR));
        $body = $this->encode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = $this->encode(hash_hmac('sha256', "$header.$body", $this->secret, true));

        return "$header.$body.$signature";
    }

    public function verify(string $token, ?int $now = null): ?array
    {
        if ($this->secret === '') {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;
        $expected = $this->encode(hash_hmac('sha256', "$header.$body", $this->secret, true));
        if (!hash_equals($expected, $signature)) {
            return null;
        }

        try {
            $payload = json_decode($this->decode($body), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        $now ??= time();

        return is_array($payload) && ($payload['exp'] ?? 0) >= $now ? $payload : null;
    }

    private function encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? '' : $decoded;
    }
}
