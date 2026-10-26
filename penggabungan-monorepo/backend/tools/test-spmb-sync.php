<?php
/** Jalankan sinkronisasi sekali lalu tampilkan ringkasan cache yang dihasilkan. */
require_once __DIR__ . '/sync-spmb.php';

$status = syncSpmbCache();
if ($status !== 0) {
    exit($status);
}
$path = spmbCachePath();
$cache = spmbBacaCache();
if ($cache === null) {
    fwrite(STDERR, "Cache SPMB tidak dapat dibaca setelah sinkronisasi.\n");
    exit(1);
}
echo 'path: ' . $path . PHP_EOL;
echo 'ukuran: ' . (string) filesize($path) . ' byte' . PHP_EOL;
echo 'fetched_at: ' . $cache['fetched_at'] . PHP_EOL;
echo 'jumlah item: ' . count($cache['items']) . PHP_EOL;
