<?php
/**
 * Konteks chatbot dari SITUS LANGSUNG (bukan tabel `knowledge`).
 *
 * Latar belakang: pencocokan kata (FULLTEXT/LIKE) terhadap tabel knowledge rawan
 * mengembalikan dokumen tak relevan sehingga model cenderung mengarang. Sebagai
 * gantinya, endpoint chat mengambil teks nyata dari halaman publik situs
 * (server-rendered Next.js, jadi HTML berisi konten asli), mengekstrak teksnya,
 * lalu membiarkan model memutuskan bagian mana yang relevan. Model tetap diikat
 * system prompt: hanya boleh menjawab dari blok sumber; tidak ada isinya = jujur
 * "belum tersedia".
 *
 * Hasil pengambilan semua halaman di-cache ke file (TTL) supaya satu request
 * chat tidak mengunduh belasan halaman berulang kali. Pengambilan antar-halaman
 * dilakukan paralel (curl_multi) agar tetap responsif.
 *
 * Semua fungsi di sini TIDAK pernah melempar exception: kegagalan jaringan/
 * parse dikembalikan sebagai string kosong agar chatbot tidak mati.
 */

/** Potong teks UTF-8 tanpa memotong di tengah karakter (mandiri dari chat). */
function wbTruncate(string $s, int $max): string
{
    $s = trim($s);
    if (function_exists('mb_substr')) {
        return mb_substr($s, 0, $max);
    }
    if (preg_match('/^.{0,' . $max . '}/us', $s, $m)) {
        return $m[0];
    }
    return substr($s, 0, $max);
}

/**
 * Ambil banyak URL secara paralel dengan curl_multi.
 *
 * @param string[] $urls
 * @return array<string,string> map url => HTML (hanya yang status 2xx; sisanya '')
 */
function fetchWebsiteUrls(array $urls, int $timeout = 8): array
{
    $out = array_fill_keys($urls, '');
    if ($urls === [] || !function_exists('curl_init')) {
        return $out;
    }

    $mh = curl_multi_init();
    $handles = [];
    foreach ($urls as $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => max(1, $timeout),
            CURLOPT_CONNECTTIMEOUT => min(max(1, $timeout), 5),
            CURLOPT_USERAGENT => 'SMKN24-Chatbot/1.0 (+konteks situs sekolah)',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_ENCODING => '', // terima gzip bila server mengirimnya
        ]);
        curl_multi_add_handle($mh, $ch);
        $handles[$url] = $ch;
    }

    do {
        $status = curl_multi_exec($mh, $active);
        if ($status !== CURLM_OK) {
            break;
        }
        // Tunggu aktivitas socket, lalu lanjut. Tanpa ini loop sibak (busy).
        curl_multi_select($mh, 1.0);
    } while ($active > 0);

    foreach ($handles as $url => $ch) {
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        if ($code >= 200 && $code < 300) {
            $body = curl_multi_getcontent($ch);
            if (is_string($body) && $body !== '') {
                $out[$url] = $body;
            }
        }
        curl_multi_remove_handle($mh, $ch);
    }
    curl_multi_close($mh);

    return $out;
}

/**
 * Ekstrak teks terbaca dari HTML.
 *
 * Membuang <script>, <style>, <noscript>, dan komentar, lalu membuang semua tag
 * sisanya, mendekode entitas HTML, dan merapatkan spasi/baris. Sederhana tanpa
 * library — cukup untuk memberi model konten naratif halaman, bukan markup.
 */
function extractWebsiteText(string $html): string
{
    if (trim($html) === '') {
        return '';
    }

    // Buang blok non-konten (case-insensitive, termasuk isinya).
    $html = preg_replace('#<(script|style|noscript|template|svg)\b[^>]*>.*?</\1>#is', ' ', $html) ?? $html;
    // Buang komentar HTML.
    $html = preg_replace('#<!--.*?-->#s', ' ', $html) ?? $html;
    // Beri spasi pada batas blok agar kata tidak menempel saat tag dibuang.
    $html = preg_replace('#</(p|div|li|h[1-6]|section|article|tr|td|th|br)>#i', ' $0 ', $html) ?? $html;
    $html = preg_replace('#<br\s*/?>#i', ' ', $html) ?? $html;
    // Buang semua tag sisanya.
    $text = strip_tags($html);
    // Decode entitas (&amp;, &nbsp;, &#8212;, ...).
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Rapatkan whitespace (termasuk newline) jadi satu spasi.
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

    return trim($text);
}

/** Path file cache untuk konteks situs (dibuat sekali, dipakai bersama). */
function websiteCachePath(): string
{
    $dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
    return $dir . DIRECTORY_SEPARATOR . 'smkn24_site_context.txt';
}

/**
 * Bangun blok konteks dari halaman situs, dengan cache berbasis file (TTL).
 *
 * - Mengambil daftar halaman dari WEBSITE_PAGES (path relatif, tanpa galeri).
 * - Menyusun URL absolut dari WEBSITE_URL.
 * - Mengunduh paralel, mengekstrak teks tiap halaman, memberi label path.
 * - Menggabungkan dan memotong total ke WEBSITE_CONTEXT_MAX_CHARS.
 * - Menyimpan hasil ke file cache selama WEBSITE_CACHE_TTL detik.
 * - Bila fetch dinyalakan tapi gagal total, mengembalikan '' (bukan melempar).
 *
 * @return string '' bila dinonaktifkan / gagal / tidak ada konten.
 */
function buildWebsiteContext(): string
{
    if (!defined('WEBSITE_FETCH_ENABLED') || !WEBSITE_FETCH_ENABLED) {
        return '';
    }
    $base = defined('WEBSITE_URL') ? rtrim((string) WEBSITE_URL, '/') : '';
    if ($base === '' || empty(WEBSITE_PAGES)) {
        return '';
    }

    // WEBSITE_PAGES boleh array (default) atau string "a,b,c" dari .env.
    $rawPages = WEBSITE_PAGES;
    if (is_string($rawPages)) {
        $paths = array_values(array_filter(array_map('trim', explode(',', $rawPages)), fn($p) => $p !== ''));
    } else {
        $paths = array_values((array) $rawPages);
    }
    if ($paths === []) {
        return '';
    }

    $cachePath = websiteCachePath();
    $ttl = defined('WEBSITE_CACHE_TTL') ? (int) WEBSITE_CACHE_TTL : 900;
    if (is_file($cachePath) && ($ttl <= 0 || (time() - (int) filemtime($cachePath)) < $ttl)) {
        $cached = (string) file_get_contents($cachePath);
        return trim($cached);
    }

    $urls = [];
    foreach ($paths as $path) {
        $path = '/' . ltrim((string) $path, '/');
        $urls[$path] = $base . $path;
    }

    $timeout = defined('WEBSITE_FETCH_TIMEOUT') ? (int) WEBSITE_FETCH_TIMEOUT : 10;
    $pages = fetchWebsiteUrls(array_values($urls), $timeout);

    $perPageMax = defined('WEBSITE_PAGE_MAX_CHARS') ? (int) WEBSITE_PAGE_MAX_CHARS : 1500;
    $blocks = [];
    foreach ($urls as $path => $url) {
        $html = $pages[$url] ?? '';
        if ($html === '') {
            continue;
        }
        $text = extractWebsiteText($html);
        if ($text === '') {
            continue;
        }
        $label = $path === '/' ? 'Beranda' : $path;
        $blocks[] = '[' . $label . '] ' . wbTruncate($text, $perPageMax);
    }

    if ($blocks === []) {
        return '';
    }

    $total = implode("\n\n", $blocks);
    $totalMax = defined('WEBSITE_CONTEXT_MAX_CHARS') ? (int) WEBSITE_CONTEXT_MAX_CHARS : 12000;
    $total = wbTruncate($total, $totalMax);

    // Best-effort cache; kegagalan tulis tidak boleh mengganggu chat.
    @file_put_contents($cachePath, $total);

    return $total;
}

