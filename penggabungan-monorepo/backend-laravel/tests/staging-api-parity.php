<?php

if (getenv('MIGRATION_ENV') !== 'staging' || getenv('STAGING_PARITY_CONFIRM') !== '1') {
    fwrite(STDERR, "Set MIGRATION_ENV=staging and STAGING_PARITY_CONFIRM=1 to run read-only parity checks.\n");
    exit(2);
}
if (!function_exists('curl_init')) {
    fwrite(STDERR, "The cURL extension is required for staging API parity checks.\n");
    exit(2);
}

$legacyBase = rtrim((string) getenv('LEGACY_API_BASE'), '/');
$laravelBase = rtrim((string) getenv('LARAVEL_API_BASE'), '/');
$token = trim((string) getenv('STAGING_ADMIN_TOKEN'));
if ($legacyBase === '' || $laravelBase === '' || $token === '') {
    fwrite(STDERR, "Set LEGACY_API_BASE, LARAVEL_API_BASE, and STAGING_ADMIN_TOKEN locally.\n");
    exit(2);
}
foreach ([$legacyBase, $laravelBase] as $base) {
    if (!preg_match('#\Ahttps?://#i', $base)) {
        fwrite(STDERR, "API base URLs must use HTTP or HTTPS.\n");
        exit(2);
    }
}

$endpoints = [
    'agenda/index.php',
    'arsip/index.php',
    'aspirasi/index.php',
    'berita/index.php',
    'bk/index.php',
    'chat/analytics.php',
    'chat/history.php',
    'fasilitas/index.php',
    'galeri/index.php',
    'guru/index.php',
    'jadwal/index.php?admin=1',
    'kantin/admin.php?resource=stands',
    'kantin/catalog.php',
    'kategori/index.php?module=berita',
    'pengumuman/index.php',
    'prestasi/index.php',
];

$failures = [];
foreach ($endpoints as $endpoint) {
    $legacy = fetchJson($legacyBase . '/api/' . $endpoint, $token);
    $laravel = fetchJson($laravelBase . '/api/' . $endpoint, $token);
    if ($legacy['status'] < 200 || $legacy['status'] >= 300
        || $laravel['status'] < 200 || $laravel['status'] >= 300
        || $legacy['status'] !== $laravel['status']
        || canonical($legacy['body']) !== canonical($laravel['body'])) {
        $failures[] = $endpoint;
        printf(
            "MISMATCH %s (legacy HTTP %d, Laravel HTTP %d)\n",
            $endpoint,
            $legacy['status'],
            $laravel['status']
        );
        continue;
    }
    printf("PASS %s (HTTP %d)\n", $endpoint, $legacy['status']);
}

if ($failures !== []) {
    fwrite(STDERR, count($failures) . " staging API parity check(s) failed.\n");
    exit(1);
}

printf("All %d read-only staging API parity checks passed.\n", count($endpoints));

function fetchJson(string $url, string $token): array
{
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $token,
        ],
    ]);
    $response = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
    $error = curl_error($handle);
    if ($response === false) {
        throw new RuntimeException('Staging request failed: ' . $error);
    }
    $decoded = json_decode($response);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException('Expected JSON response from staging endpoint.');
    }

    return ['status' => $status, 'body' => $decoded];
}

function canonical(mixed $value): string
{
    $normalised = normaliseJsonValue($value);
    $json = json_encode($normalised, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    if ($json === false) {
        throw new RuntimeException('Could not normalize API response JSON.');
    }

    return $json;
}

function normaliseJsonValue(mixed $value): mixed
{
    if (is_object($value)) {
        $properties = get_object_vars($value);
        ksort($properties);

        foreach ($properties as $key => $property) {
            $properties[$key] = normaliseJsonValue($property);
        }

        return (object) $properties;
    }
    if (is_array($value)) {
        return array_map('normaliseJsonValue', $value);
    }

    return $value;
}
