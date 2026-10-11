<?php
/**
 * Uji konteks chatbot dari situs langsung (SELECT-only, tidak panggil AI).
 *
 * Pakai:
 *   php backend/tools/test-website-fetch.php            -> cetak panjang + cuplikan
 *   php backend/tools/test-website-fetch.php --full     -> cetak seluruh konteks
 *
 * Berguna untuk memastikan cURL server bisa menjangkau WEBSITE_URL dan bahwa
 * ekstraksi teks menghasilkan konten nyata (bukan HTML kosong / halaman JS saja).
 */

require_once __DIR__ . '/../bootstrap.php';

$full = in_array('--full', $argv, true);

if (!WEBSITE_FETCH_ENABLED) {
    echo "WEBSITE_FETCH_ENABLED = false (fitur dinonaktifkan)\n";
    exit(0);
}

echo "WEBSITE_URL       : " . WEBSITE_URL . "\n";
echo "WEBSITE_PAGES     : " . (is_array(WEBSITE_PAGES) ? implode(',', WEBSITE_PAGES) : (string) WEBSITE_PAGES) . "\n";
echo "Cache path        : " . websiteCachePath() . "\n";
echo "TTL cache (detik) : " . WEBSITE_CACHE_TTL . "\n\n";

$ctx = buildWebsiteContext();

if ($ctx === '') {
    echo "HASIL: konteks kosong.\n";
    echo "Kemungkinan: cURL tidak bisa menjangkau situs, halaman mengembalikan\n";
    echo "non-2xx, atau ekstraksi tidak menghasilkan teks. Cek error_log server.\n";
    exit(1);
}

echo "Panjang konteks   : " . strlen($ctx) . " karakter\n";
echo str_repeat('=', 70) . "\n";
if ($full) {
    echo $ctx . "\n";
} else {
    echo substr($ctx, 0, 1500) . (strlen($ctx) > 1500 ? "\n...\n[gunakan --full untuk melihat seluruhnya]" : '') . "\n";
}
