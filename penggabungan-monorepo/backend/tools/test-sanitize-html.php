<?php
/**
 * Uji regresi sanitizeBeritaHtml() — CLI saja.
 *
 *   php backend/tools/test-sanitize-html.php
 *
 * Keluar 0 bila semua payload XSS bersih dan konten sah dipertahankan.
 * TIDAK menyentuh database maupun jaringan.
 */

require_once __DIR__ . '/../helpers/sanitize_html.php';

$failures = 0;

function check(string $name, string $input, callable $assert): void
{
    global $failures;
    $out = sanitizeBeritaHtml($input);
    $ok = $assert($out);
    if ($ok) {
        echo "PASS {$name}\n";
    } else {
        $failures++;
        echo "FAIL {$name}\n  input : {$input}\n  output: {$out}\n";
    }
}

function hasXss(string $out): bool
{
    $lower = strtolower($out);
    foreach (['<script', 'onerror=', 'onclick=', 'onload=', 'javascript:', 'data:text/html', '<iframe', '<object', '<embed'] as $bad) {
        if (str_contains($lower, $bad)) {
            return true;
        }
    }
    return false;
}

// 1. script dibuang beserta isinya.
check('script-dibuang', '<p>Halo</p><script>alert(1)</script>', function ($o) {
    return !hasXss($o) && str_contains($o, 'Halo') && !str_contains($o, 'alert(1)');
});

// 2. Event handler dibuang, img aman dipertahankan.
check('img-onerror-dibuang', '<img src="/backend/uploads/a.jpg" onerror="alert(1)" alt="Foto">', function ($o) {
    return !hasXss($o) && str_contains($o, '/backend/uploads/a.jpg');
});

// 3. javascript: href dibuang.
check('js-href-dibuang', '<a href="javascript:alert(1)">klik</a>', function ($o) {
    return !hasXss($o) && str_contains($o, 'klik');
});

// 4. Konten sah dipertahankan (heading, bold, list, tabel, link aman).
check('konten-sah-lolos', '<h2>Judul</h2><p><strong>Tebal</strong> teks</p><ul><li>Satu</li></ul><table><tr><td>A</td></tr></table><a href="https://sekolah.id" target="_blank">Tautan</a>', function ($o) {
    foreach (['<h2>', '<strong>', '<ul>', '<table>', 'rel="noopener noreferrer"'] as $need) {
        if (!str_contains($o, $need)) {
            return false;
        }
    }
    return !hasXss($o);
});

// 5. iframe/object dibuang beserta isinya.
check('iframe-dibuang', '<p>Sebelum</p><iframe src="https://evil.id"></iframe><p>Sesudah</p>', function ($o) {
    return !hasXss($o) && str_contains($o, 'Sebelum') && str_contains($o, 'Sesudah');
});

// 6. style berbahaya dibuang, text-align dipertahankan.
check('style-disaring', '<p style="color: red; text-align: center; position: absolute">Teks</p>', function ($o) {
    return !hasXss($o) && str_contains($o, 'text-align: center') && !str_contains(strtolower($o), 'position');
});

// 7. Bukan string -> string kosong.
$nonString = sanitizeBeritaHtml(['x']);
if ($nonString !== '') {
    $failures++;
    echo "FAIL bukan-string\n";
} else {
    echo "PASS bukan-string\n";
}

if ($failures > 0) {
    echo "\n{$failures} uji GAGAL.\n";
    exit(1);
}
echo "\nSemua uji sanitasi lolos.\n";
