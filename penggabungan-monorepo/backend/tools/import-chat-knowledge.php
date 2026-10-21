<?php
/**
 * Import dataset knowledge untuk chatbot — jalur CLI.
 *
 * Parser kini satu dengan jalur dashboard: MD, TXT, CSV, DOCX, XLSX — semua
 * lewat backend/helpers/knowledge_parser.php. Endpoint admin
 * (backend/api/knowledge/index.php) memakai modul sama, jadi aturan validasi
 * tidak berbeda antar pintu.
 *
 * Tabel: knowledge (backend/migrations/20261006_add_chat_knowledge.sql).
 * Import mengubah, bukan menambah duplikat — judul dipakai kunci
 * (INSERT ... ON DUPLICATE KEY UPDATE; judul yang sudah ada diganti isinya).
 * Format Markdown - didukung dua pola, boleh dicampur dalam satu file.
 *
 * Pola A (heading sebagai judul, kategori ditebak dari judul/konten):
 *   # Judul pengetahuan
 *
 *   Isi pengetahuan (boleh paragraf, daftar, sub-heading `##`).
 *
 * Pola B (frontmatter eksplisit, disarankan supaya kategori/tags akurat):
 *   ---
 *   judul: Cara mendaftar PPDB
 *   kategori: PPDB
 *   tags: ppdb; spmb; pendaftaran
 *   sumber: Tata Usaha SMKN 24 Jakarta
 *   ---
 *
 *   Isi pengetahuan.
 *
 * Format CSV - header wajib: judul,kategori,konten,tags,sumber (delimiter ; atau ,).
 *
 * Kategori yang diterima (sesuai enum database):
 *   PPDB | Jurusan | Jadwal | Fasilitas | Umum
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/knowledge_parser.php';

$path = $argv[1] ?? '';
if ($path === '') {
    fwrite(STDERR, 'Pakai: php backend/tools/import-chat-knowledge.php <file.md|file.csv|file.docx|file.xlsx>' . PHP_EOL);
    exit(1);
}
if (!is_readable($path)) {
    fwrite(STDERR, "File tidak terbaca: {$path}\n");
    exit(1);
}

// ---------------------------------------------------------------------------
// 1. Baca file (parser dari helpers/knowledge_parser.php — jalur UI pakai ini)
// ---------------------------------------------------------------------------
[$rows, $notes] = knowledge_parseFile($path, basename($path));

// ---------------------------------------------------------------------------
// 2. Validasi (gerbang kualitas: format sama, validasi sama di semua pintu)
// ---------------------------------------------------------------------------
$hasil = knowledge_validasi($rows);
$valid = $hasil['valid'];
$gagal = $hasil['catatan'];
$gagal = array_merge($notes, $gagal);

// ---------------------------------------------------------------------------
// 3. Upsert - judul sebagai kunci, jadi import ulang = update bukan duplikat
// ---------------------------------------------------------------------------
echo 'Dibaca      : ' . count($rows) . " dokumen\n";
echo 'Valid       : ' . count($valid) . "\n";
foreach ($gagal as $g) {
    echo "  CATATAN: {$g}\n";
}
if ($valid === []) {
    fwrite(STDERR, "Tidak ada baris valid - tidak ada yang disimpan.\n");
    exit(1);
}

try {
    $db = getDB();
    // Cek dulu supaya pesannya jelas, bukan stack trace PDO.
    $db->query('SELECT 1 FROM knowledge LIMIT 1');
    $upsert = $db->prepare(
        'INSERT INTO knowledge (judul, kategori, konten, tags, sumber) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE kategori = VALUES(kategori), konten = VALUES(konten),
                                 tags = VALUES(tags), sumber = VALUES(sumber)'
    );
} catch (PDOException $e) {
    $msg = $e->getMessage();
    fwrite(STDERR, "Tabel knowledge tidak siap: {$msg}\n");
    fwrite(STDERR, "Jalankan dulu backend/migrations/20261006_add_chat_knowledge.sql "
        . "lewat phpMyAdmin (setelah backup), lalu ulangi perintah ini.\n");
    exit(1);
}

$ok = 0;
$writeFail = 0;
foreach ($valid as $row) {
    try {
        $upsert->execute([$row['judul'], $row['kategori'], $row['konten'], $row['tags'], $row['sumber']]);
        $ok++;
    } catch (PDOException $e) {
        $writeFail++;
        fwrite(STDERR, 'Gagal simpan "' . $row['judul'] . '": ' . $e->getMessage() . "\n");
    }
}

$total = $db->query('SELECT COUNT(*) FROM knowledge')->fetchColumn();
echo "Tersimpan   : {$ok} (total di knowledge: {$total})\n";
if ($writeFail > 0) {
    fwrite(STDERR, "GAGAL tulis: {$writeFail}\n");
    exit(1);
}
