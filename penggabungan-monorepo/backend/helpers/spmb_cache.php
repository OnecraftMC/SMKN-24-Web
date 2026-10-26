<?php
/** Path cache SPMB; dapat ditimpa untuk deployment/tes. */
function spmbCachePath(): string
{
    $configured = getenv('SPMB_CACHE_FILE');
    if (is_string($configured) && trim($configured) !== '') {
        return trim($configured);
    }
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'smkn24_spmb_cache.json';
}

/** Baca cache valid, atau null bila belum ada/rusak. */
function spmbBacaCache(): ?array
{
    $path = spmbCachePath();
    if (!is_file($path)) {
        return null;
    }
    $raw = @file_get_contents($path);
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['fetched_at'], $data['items']) || !is_array($data['items'])) {
        return null;
    }
    return $data;
}

/** Tulis cache melalui file sementara dan rename agar pembaca tidak melihat JSON setengah jadi. */
function spmbTulisCache(array $data): bool
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($json)) {
        return false;
    }
    $path = spmbCachePath();
    $tmp = $path . '.tmp';
    if (@file_put_contents($tmp, $json . PHP_EOL, LOCK_EX) === false) {
        return false;
    }
    if (@rename($tmp, $path)) {
        return true;
    }
    @unlink($tmp);
    return false;
}
