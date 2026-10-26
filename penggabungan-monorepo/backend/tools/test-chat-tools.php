<?php
/**
 * Uji eksekutor tool chatbot D18 (READ-ONLY) — backend/tools/test-chat-tools.php
 *
 * Jalankan dari folder backend:
 *   php tools/test-chat-tools.php
 *
 * Yang diuji:
 *   1. Guard keamanan: allowlist tabel, blokir tabel privat, tolak SQL non-SELECT.
 *   2. Setiap tool database terpanggil tanpa exception (butuh DB aktif).
 *   3. Tool `baca_halaman_situs`: path whitelist diterima, path asing ditolak
 *      (fetch halaman live sendiri diuji terpisah bila jaringan tersedia).
 *
 * Tanpa API key provider — file ini TIDAK memanggil layanan AI sama sekali.
 */

require_once __DIR__ . '/../bootstrap.php';

$lulus = 0;
$gagal = 0;

function cek(string $nama, bool $ok, string $detail = ''): void
{
    global $lulus, $gagal;
    if ($ok) {
        $lulus++;
        echo "PASS  $nama" . ($detail !== '' ? " — $detail" : '') . "\n";
    } else {
        $gagal++;
        echo "FAIL  $nama" . ($detail !== '' ? " — $detail" : '') . "\n";
    }
}

// --- 1. Guard keamanan (tanpa DB) -------------------------------------------
try {
    toolAssertQuery('pesan_bk', 'SELECT nama FROM pesan_bk');
    cek('guard: pesan_bk diblokir', false, 'tidak ada exception');
} catch (RuntimeException $e) {
    cek('guard: pesan_bk diblokir', true, $e->getMessage());
}

try {
    toolAssertQuery('prestasi', 'SELECT nisn FROM prestasi');
    cek('guard: prestasi diblokir', false, 'tidak ada exception');
} catch (RuntimeException $e) {
    cek('guard: prestasi diblokir', true, $e->getMessage());
}

try {
    toolAssertQuery('berita', "SELECT judul FROM berita; DROP TABLE berita");
    cek('guard: SQL berbahaya ditolak', false, 'tidak ada exception');
} catch (RuntimeException $e) {
    cek('guard: SQL berbahaya ditolak', true, $e->getMessage());
}

try {
    toolAssertQuery('berita', 'UPDATE berita SET judul = 1');
    cek('guard: non-SELECT ditolak', false, 'tidak ada exception');
} catch (RuntimeException $e) {
    cek('guard: non-SELECT ditolak', true, $e->getMessage());
}

$daftarAlat = array_keys(chatToolRegistry());
$adaTabelPrivat = false;
foreach (['pesan_bk', 'prestasi', 'admin_users', 'chat_sessions', 'chat_messages', 'aspirasi', 'arsip'] as $t) {
    if (in_array($t, CHAT_TOOL_TABLES, true)) {
        $adaTabelPrivat = true;
    }
}
cek('allowlist tidak memuat tabel privat', !$adaTabelPrivat);
cek('registry memuat 10 alat', count($daftarAlat) === 10, implode(', ', $daftarAlat));

$kataLulusan = toolKnowledgeSearchTerms('Siapa lulusan dari SMKN 24?');
$kelompokLulusan = toolKnowledgeSearchGroups('Siapa lulusan dari SMKN 24?');
$sinonimLulusan = $kelompokLulusan[0] ?? [];
cek(
    'stopword dan nama sekolah dibersihkan dari kueri',
    $kataLulusan === ['lulusan'],
    implode(', ', $kataLulusan)
);
cek(
    'pencarian memori mengenali sinonim lulusan',
    in_array('alumni', $sinonimLulusan, true)
        && in_array('tamatan', $sinonimLulusan, true)
        && count($kelompokLulusan) === 1,
    implode(', ', $sinonimLulusan)
);
$kelompokJurusan = toolKnowledgeSearchGroups('informasi jurusan');
cek(
    'stopword dihapus dan sinonim jurusan diperluas',
    count($kelompokJurusan) === 1
        && in_array('program keahlian', $kelompokJurusan[0], true)
);

// --- 2. Tool database (butuh koneksi DB aktif) -------------------------------
try {
    $db = getDB();
} catch (Throwable $e) {
    echo "NOT RUN — koneksi database gagal: " . $e->getMessage() . "\n";
    echo "Jalankan lagi dengan backend/.env yang menunjuk DB berisi skema lengkap.\n";
    exit(1);
}

$namaAneh = executeChatTool($db, 'hapus_semua_data', []);
cek('guard: nama alat asing ditolak', str_contains($namaAneh, 'tidak dikenal'), $namaAneh);

$skenario = [
    'cari_berita' => ['kata' => 'sekolah'],
    'cari_pengumuman' => [],
    'cari_agenda' => [],
    'cari_guru' => ['kata' => 'kepala'],
    'cari_jadwal' => ['jurusan' => 'pplg'],
    'cari_fasilitas' => [],
    'cari_galeri' => [],
    'cari_kategori' => [],
    'cari_pengetahuan' => ['kata' => 'ppdb'],
];
foreach ($skenario as $alat => $args) {
    $hasil = executeChatTool($db, $alat, $args);
    $ok = is_string($hasil) && $hasil !== ''
        && !str_contains($hasil, 'alat gagal dijalankan');
    cek("tool $alat berjalan", $ok, toolCut($hasil, 90));
}

// Argumen kosong pada cari_pengetahuan wajib diminta, bukan asal query.
$kosong = executeChatTool($db, 'cari_pengetahuan', []);
cek('cari_pengetahuan tanpa kata ditolak', str_contains($kosong, 'wajib diisi'), $kosong);

// --- 3. baca_halaman_situs (whitelist path; fetch live opsional) -------------
$tertolak = toolBacaHalamanSitus(['path' => '/admin/dashboard']);
cek('halaman asing ditolak', str_contains($tertolak, 'di luar daftar'), $tertolak);

$pathSah = defined('WEBSITE_PAGES')
    ? trim((string) strtok((string) WEBSITE_PAGES, ','), ' ')
    : '/';
$hasilSitus = toolBacaHalamanSitus(['path' => $pathSah]);
// Tanpa jaringan/CA lokal, fetch bisa gagal — itu bukan kegagalan guard.
$okSitus = str_contains($hasilSitus, 'Hasil alat baca_halaman_situs')
    || str_contains($hasilSitus, 'tidak dapat diambil')
    || str_contains($hasilSitus, 'kosong');
cek("halaman sah '$pathSah' diterima whitelist", $okSitus, toolCut($hasilSitus, 90));

// --- Ringkasan ----------------------------------------------------------------
echo "\nRingkasan: $lulus lulus, $gagal gagal.\n";
exit($gagal > 0 ? 1 : 0);
