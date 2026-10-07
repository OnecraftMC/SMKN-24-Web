<?php
/**
 * Import dataset knowledge untuk chatbot: Markdown ATAU CSV.
 *
 * Tabel: knowledge (backend/database.sql). Import mengubah, bukan menambah
 * duplikat - judul dipakai kunci (INSERT ... ON DUPLICATE KEY UPDATE).
 *
 * Pakai:
 *   php backend/tools/import-chat-knowledge.php <file.md|file.csv>
 *
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
 * Format CSV - header wajib: judul,kategori,konten,tags,sumber
 *
 * Kategori yang diterima (sesuai enum database):
 *   PPDB | Jurusan | Jadwal | Fasilitas | Umum
 *
 * Sengaja CLI dan offline: tidak ada endpoint publik yang mengubah knowledge
 * sehingga tidak ada jalur tulis baru yang perlu dijaga.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

const KATEGORI_DIIZINKAN = ['PPDB', 'Jurusan', 'Jadwal', 'Fasilitas', 'Umum'];
const KATEGORI_TEBAKAN = [
    'PPDB' => ['ppdb', 'spmb', 'pendaftaran', 'daftar siswa', 'registrasi'],
    'Jurusan' => ['jurusan', 'kompetensi keahlian', 'keahlian', 'pplg', 'pariwisata', 'perhotelan', 'tata boga', 'tata busana'],
    'Jadwal' => ['jadwal', 'jam masuk', 'jam pelajaran', 'jam sekolah'],
    'Fasilitas' => ['fasilitas', 'lab', 'laboratorium', 'gedung', 'ruang kelas', 'lapangan', 'perpustakaan'],
];

// ---------------------------------------------------------------------------
// 1. Baca file
// ---------------------------------------------------------------------------
$path = $argv[1] ?? '';
if ($path === '') {
    fwrite(STDERR, "Pakai: php backend/tools/import-chat-knowledge.php <file.md|file.csv>\n");
    exit(1);
}
if (!is_readable($path)) {
    fwrite(STDERR, "File tidak terbaca: {$path}\n");
    exit(1);
}
$raw = file_get_contents($path);
if ($raw === false || trim($raw) === '') {
    fwrite(STDERR, "File kosong atau gagal dibaca: {$path}\n");
    exit(1);
}
// BOM UTF-8 dibuang; CSV/MD dari Excel sering menyisakan BOM.
if (str_starts_with($raw, "\xEF\xBB\xBF")) {
    $raw = substr($raw, 3);
}

$rows = str_ends_with(strtolower($path), '.csv') ? parseCsv($raw) : parseMarkdown($raw);

if ($rows === []) {
    fwrite(STDERR, "Tidak ada dokumen terbaca dari {$path}. "
        . "Untuk Markdown, pastikan ada heading '#' atau blok frontmatter '---'.\n");
    exit(1);
}

// ---------------------------------------------------------------------------
// 2. Validasi (gerbang kualitas: format sama, validasi sama)
// ---------------------------------------------------------------------------
$valid = [];
$gagal = [];
foreach ($rows as $i => $row) {
    $no = $i + 1;
    $judul = trim($row['judul'] ?? '');
    $konten = trim($row['konten'] ?? '');
    $kategori = trim($row['kategori'] ?? '') ?: 'Umum';
    $tags = trim($row['tags'] ?? '');
    $sumber = trim($row['sumber'] ?? '');

    if ($judul === '' || $konten === '') {
        $gagal[] = "baris {$no}: judul/konten kosong - dilewati";
        continue;
    }
    if (!in_array($kategori, KATEGORI_DIIZINKAN, true)) {
        // Tebakan dari konten lebih baik daripada gagal total, tapi dicatat.
        $tebak = tebakKategori($judul . ' ' . $konten);
        $gagal[] = "baris {$no} \"{$judul}\": kategori '{$kategori}' tidak dikenali -> dipakai '{$tebak}'";
        $kategori = $tebak;
    }
    if (utf8Len($judul) > 255 || utf8Len($tags) > 255 || utf8Len($sumber) > 255) {
        $gagal[] = "baris {$no} \"{$judul}\": judul/tags/sumber melebihi 255 karakter - dilewati";
        continue;
    }
    if (utf8Len($konten) > 65000) {
        $gagal[] = "baris {$no} \"{$judul}\": konten melebihi batas TEXT - dilewati";
        continue;
    }
    $valid[] = ['judul' => $judul, 'kategori' => $kategori, 'konten' => $konten, 'tags' => $tags, 'sumber' => $sumber];
}

// ---------------------------------------------------------------------------
// 3. Upsert - judul sebagai kunci, jadi import ulang = update bukan duplikat
// ---------------------------------------------------------------------------
echo "Dibaca      : " . count($rows) . " dokumen\n";
echo "Valid       : " . count($valid) . "\n";
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

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------
/** Markdown -> baris. Dua pola: frontmatter '---' atau heading '#'. */
function parseMarkdown(string $raw): array
{
    $rows = [];

    // Pola A: heading '#' sebagai pemisah dokumen.
    if (preg_match_all('/^#\s+(.+?)\s*$(.*?)(?=^#\s+|\z)/ms', $raw, $m, PREG_SET_ORDER)) {
        foreach ($m as $block) {
            $judul = trim($block[1]);
            // Lewati header sampul dari convert-dataset.php (bukan dokumen knowledge).
            if ($judul === 'Knowledge base chatbot SMK Negeri 24 Jakarta') {
                continue;
            }
            $rows[] = [
                'judul' => $judul,
                'kategori' => '',
                'tags' => '',
                'sumber' => '',
                'konten' => trim(stripHeading($block[2])),
            ];
        }
        if ($rows !== []) {
            return $rows;
        }
    }

    // Pola B: blok frontmatter '--- ... ---' lalu body.
    if (preg_match_all('/^---[ \t]*\n(.*?)\n---[ \t]*\n(.+?)(?=\n---[ \t]*\n|\z)/ms', $raw, $m, PREG_SET_ORDER)) {
        foreach ($m as $block) {
            $meta = [];
            foreach (preg_split('/\r?\n/', $block[1]) as $line) {
                if (preg_match('/^\s*([A-Za-z_]+)\s*:\s*(.*)$/', $line, $kv)) {
                    $meta[strtolower(trim($kv[1]))] = trim($kv[2], " \t\"'");
                }
            }
            $rows[] = [
                'judul' => $meta['judul'] ?? '',
                'kategori' => $meta['kategori'] ?? '',
                'tags' => $meta['tags'] ?? '',
                'sumber' => $meta['sumber'] ?? '',
                'konten' => trim(stripHeading($block[2])),
            ];
        }
    }

    return $rows;
}

/** CSV dengan header wajib judul,kategori,konten,tags,sumber. */
function parseCsv(string $raw): array
{
    $lines = preg_split('/\r?\n/', trim($raw));
    $header = array_map(fn($h) => strtolower(trim((string) $h)), (array) str_getcsv((string) array_shift($lines)));
    $rows = [];
    foreach ($lines as $line) {
        if (trim($line) === '') {
            continue;
        }
        $cols = str_getcsv($line);
        $row = [];
        foreach ($header as $i => $h) {
            $row[$h] = trim((string) ($cols[$i] ?? ''));
        }
        $rows[] = $row;
    }
    return $rows;
}

/** Hitung panjang karakter UTF-8 tanpa bergantung ext-mbstring (bisa kosong). */
function utf8Len(string $s): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($s);
    }
    return (int) preg_match_all('/./u', $s);
}

/** Buang komentar HTML/Markdown dan heading dari isi konten. */
function stripHeading(string $text): string
{
    // Komentar contoh/keterangan penulis tidak boleh ikut jadi konteks AI.
    $text = preg_replace('/<!--.*?-->/s', '', $text) ?? $text;
    $text = preg_replace('/\{#.*?\}/', '', $text) ?? $text;
    $text = preg_replace('/^#+[ \t]+.+$/m', '', $text) ?? $text;
    return trim(preg_replace('/\n{3,}/', "\n\n", $text) ?? $text);
}

/** Tebak kategori dari judul+konten bila kolom tidak diisi/tidak dikenali. */
function tebakKategori(string $haystack): string
{
    $t = strtolower($haystack);
    foreach (KATEGORI_TEBAKAN as $kategori => $kata) {
        foreach ($kata as $k) {
            if (str_contains($t, $k)) {
                return $kategori;
            }
        }
    }
    return 'Umum';
}