<?php

namespace App\Support;

use RuntimeException;

final class MidtransClient
{
    public function createSnap(array $payload): array
    {
        $serverKey = (string) env('MIDTRANS_SERVER_KEY', '');
        if ($serverKey === '') {
            throw new RuntimeException('Pembayaran online belum dikonfigurasi.');
        }
        if (!function_exists('curl_init')) {
            throw new RuntimeException('Layanan pembayaran tidak tersedia di server.');
        }

        $production = filter_var(env('MIDTRANS_IS_PRODUCTION', 'false'), FILTER_VALIDATE_BOOLEAN);
        $url = $production
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
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
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error = curl_error($handle);
        $result = json_decode((string) $raw, true);
        if ($status < 200 || $status >= 300 || !is_array($result)
            || empty($result['token']) || empty($result['redirect_url'])) {
            error_log('[Kantin] Midtrans Snap request failed (' . $status . '): ' . ($error ?: (string) $raw));
            throw new RuntimeException('Pembayaran belum dapat dibuat. Coba lagi beberapa saat.');
        }

        return $result;
    }
}
