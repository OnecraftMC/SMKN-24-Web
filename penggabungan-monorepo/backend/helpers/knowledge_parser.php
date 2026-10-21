<?php
/**
 * knowledge_parser.php — satu parser untuk semua pintu masuk dataset.
 *
 * Dipakai dua tempat dengan kontrak identik:
 *   1. CLI  (backend/tools/import-chat-knowledge.php) — jalur engineer.
 *   2. POST multipart (backend/api/knowledge/index.php) — jalur dashboard.
 *
 * Format yang didukung: MD, TXT, CSV, DOCX, XLSX.
 * Keluaran validasi selalu: { judul, kategori, konten, tags, sumber }.
 *
 * Kategori ditebak dari judul+konten bila kolom kosong/tidak dikenali;
 * yang tak terpetakan jatuh ke 'Umum'. Tidak ada kategori baru di sini.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../vendor/SimpleXlsxReader.php';
require_once __DIR__ . '/../vendor/DocxReader.php';

const KATEGORI_KNOWLEDGE = ['PPDB', 'Jurusan', 'Jadwal', 'Fasilitas', 'Umum'];
const KATEGORI_TEBAKAN = [
    'PPDB' => ['ppdb', 'spmb', 'pendaftaran', 'daftar siswa', 'registrasi'],
    'Jurusan' => ['jurusan', 'kompetensi keahlian', 'keahlian', 'pplg', 'pariwisata', 'perhotelan', 'tata boga', 'tata busana'],
    'Jadwal' => ['jadwal', 'jam masuk', 'jam pelajaran', 'jam sekolah'],
    'Fasilitas' => ['fasilitas', 'lab', 'laboratorium', 'gedung', 'ruang kelas', 'lapangan', 'perpustakaan'],
];
const EKSTENSI_DATASET = ['md', 'txt', 'csv', 'docx', 'xlsx'];

/**
 * Baca file -> baris mentah (belum divalidasi). Judul cadangan dipakai bila
 * format tidak punya pembagi judul (TXT tanpa heading).
 * Return [$rows, $catatan]; $rows = [] dengan $catatan berisi pesan bila gagal.
 */
function knowledge_parseFile(string $path, string $namaAsli): array
{
    $ekstensi = strtolower(pathinfo($namaAsli, PATHINFO_EXTENSION));
    $judulCadangan = preg_replace('/\\.[^.]+$/u', '', basename($namaAsli)) ?: 'Dokumen';
    $catatan = [];

    $raw = @file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return [[], ['File kosong atau tidak terbaca.']];
    }
    // BOM UTF-8 dibuang; file dari Excel/Word sering menyisakan BOM.
    if (str_starts_with($raw, "\xEF\xBB\xBF")) {
        $raw = substr($raw, 3);
    }

    switch ($ekstensi) {
        case 'md':
        case 'txt':
            $rows = knowledge_parseMarkdown($raw);
            if ($rows === []) {
                // TXT/MD tanpa heading '#': satu dokumen = satu file.
                $rows[] = [
                    'judul' => $judulCadangan,
                    'kategori' => '',
                    'tags' => '',
                    'sumber' => '',
                    'konten' => knowledge_stripHeading($raw),
                ];
            }
            if ($ekstensi === 'txt' && count($rows) === 1) {
                $catatan[] = 'TXT dibaca sebagai satu dokumen dengan judul "' . $rows[0]['judul'] . '".';
            }
            break;

        case 'csv':
            $rows = knowledge_parseCsv($raw);
            if ($rows === []) {
                $catatan[] = 'CSV tidak punya baris data (header wajib: judul,kategori,konten,tags,sumber).';
            }
            break;

        case 'docx':
            $rows = DocxReader::documents($path, $judulCadangan);
            if ($rows === null) {
                $rows = [];
                $catatan[] = 'DOCX tidak dapat dibaca (file rusak atau bukan dokumen Word).';
            } elseif ($rows === []) {
                $catatan[] = 'DOCX berisi dokumen kosong.';
            }
            break;

        case 'xlsx':
            [$rows, $catatanXlsx] = knowledge_parseXlsx($path);
            $catatan = array_merge($catatan, $catatanXlsx);
            break;

        default:
            $rows = [];
            $catatan[] = 'Format ' . $ekstensi . ' tidak didukung (md, txt, csv, docx, xlsx).';
    }

    return [$rows, $catatan];
}

/** Baris mentah -> ['valid' => [...], 'catatan' => [...]] — kontrak import & UI. */
function knowledge_validasi(array $rows): array
{
    $valid = [];
    $catatan = [];
    /** judul sudah dipakai dalam file ini (duplikat = catat, lewati). */
    $judulTerpakai = [];

    foreach ($rows as $i => $row) {
        $no = $i + 1;
        $judul = trim((string) ($row['judul'] ?? ''));
        $konten = trim((string) ($row['konten'] ?? ''));
        // Kategori kosong TIDAK langsung 'Umum' — dicoba ditebak dari judul+
        // konten (kontrak pola-A markdown/DOCX). Tebakan yang gagal tetap Umum.
        $kategoriInput = trim((string) ($row['kategori'] ?? ''));
        $tags = trim((string) ($row['tags'] ?? ''));
        $sumber = trim((string) ($row['sumber'] ?? ''));

        if ($judul === '' || $konten === '') {
            $catatan[] = "Baris {$no}: judul/konten kosong - dilewati";
            continue;
        }
        if (isset($judulTerpakai[strtolower($judul)])) {
            $catatan[] = "Baris {$no} \"{$judul}\": judul sama - dibaca sebagai update";
        }
        $judulTerpakai[strtolower($judul)] = true;

        if ($kategoriInput === '' || !in_array($kategoriInput, KATEGORI_KNOWLEDGE, true)) {
            $tebak = knowledge_tebakKategori($judul . ' ' . $konten);
            if ($kategoriInput === '') {
                $catatan[] = "Baris {$no} \"{$judul}\": kategori kosong -> ditebak '{$tebak}'";
            } else {
                $catatan[] = "Baris {$no} \"{$judul}\": kategori '{$kategoriInput}' tidak dikenali -> dipakai '{$tebak}'";
            }
            $kategori = $tebak;
        } else {
            $kategori = $kategoriInput;
        }
        if (knowledge_utf8Len($judul) > 255 || knowledge_utf8Len($tags) > 255 || knowledge_utf8Len($sumber) > 255) {
            $catatan[] = "Baris {$no} \"{$judul}\": judul/tags/sumber melebihi 255 karakter - dilewati";
            continue;
        }
        if (knowledge_utf8Len($konten) > 65000) {
            $catatan[] = "Baris {$no} \"{$judul}\": konten melebihi batas TEXT (65.000) - dilewati";
            continue;
        }
        $valid[] = ['judul' => $judul, 'kategori' => $kategori, 'konten' => $konten, 'tags' => $tags, 'sumber' => $sumber];
    }

    return ['valid' => $valid, 'catatan' => $catatan];
}

/** Markdown/TXT -> baris. Dua pola boleh dicampur: frontmatter '---' + heading '#'. */
function knowledge_parseMarkdown(string $raw): array
{
    $rows = [];

    // Pola B dulu: blok frontmatter '--- ... ---' diekstrak lalu DIBUANG dari
    // teks, supaya pola A di bawah hanya membaca bagian berpola heading.
    $regexFrontmatter = '/^---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\n(.+?)(?=\r?\n---[ \t]*\n|\z)/ms';
    if (preg_match_all($regexFrontmatter, $raw, $fm, PREG_SET_ORDER)) {
        $raw = preg_replace($regexFrontmatter, '', $raw) ?? $raw;
        foreach ($fm as $block) {
            $meta = [];
            foreach (preg_split('/\\r?\\n/', $block[1]) as $line) {
                if (preg_match('/^\\s*([A-Za-z_]+)\\s*:\\s*(.*)$/', $line, $kv)) {
                    $meta[strtolower(trim($kv[1]))] = trim($kv[2], " \t\"'");
                }
            }
            $rows[] = [
                'judul' => $meta['judul'] ?? '',
                'kategori' => $meta['kategori'] ?? '',
                'tags' => $meta['tags'] ?? '',
                'sumber' => $meta['sumber'] ?? '',
                'konten' => trim(knowledge_stripHeading($block[2])),
            ];
        }
    }

    // Pola A: heading '#' (level 1) sebagai pemisah dokumen; sub-heading '##'
    // tetap ikut konten sebagai struktur berharga bagi konteks chatbot.
    if (preg_match_all('/^#\s+(.+?)\s*$(.*?)(?=^#\s+|\z)/ms', $raw, $m, PREG_SET_ORDER)) {
        foreach ($m as $block) {
            $judul = trim($block[1]);
            // Header sampul dari convert-dataset.php bukan dokumen knowledge.
            if ($judul === 'Knowledge base chatbot SMK Negeri 24 Jakarta') {
                continue;
            }
            $rows[] = [
                'judul' => $judul,
                'kategori' => '',
                'tags' => '',
                'sumber' => '',
                'konten' => trim(knowledge_stripHeading($block[2])),
            ];
        }
    }

    return $rows;
}

/** CSV dengan header wajib judul,kategori,konten,tags,sumber (delimiter ; atau ,). */
function knowledge_parseCsv(string $raw): array
{
    // fgetcsv menangani sel bertanda kutip multi-baris — aman daripada split \n.
    $stream = fopen('php://temp', 'r+');
    if ($stream === false) {
        return [];
    }
    fwrite($stream, $raw);
    rewind($stream);

    $delimiter = knowledge_cariDelimiter($raw);

    // $escape disertai eksplisit (nilai default PHP <= 8.5) untuk menahan
    // deprecation PHP 8.5 dan perilaku stabil antar versi.
    $headerLine = fgetcsv($stream, 0, $delimiter, '"', '\\');
    if (!$headerLine) {
        fclose($stream);
        return [];
    }
    $header = array_map(fn ($h) => strtolower(trim((string) $h)), $headerLine);
    $peta = knowledge_petaKolom($header);
    if ($peta['judul'] === null || $peta['konten'] === null) {
        fclose($stream);
        // Kontrak CSV tetap satu: judul & konten wajib ada di header.
        return [];
    }

    $rows = [];
    while (($cols = fgetcsv($stream, 0, $delimiter, '"', '\\')) !== false) {
        if (count($cols) === 1 && trim((string) $cols[0]) === '') {
            continue;
        }
        $row = [];
        foreach ($peta as $namaField => $idx) {
            if ($idx === null) {
                $row[$namaField] = '';
                continue;
            }
            $row[$namaField] = trim((string) ($cols[$idx] ?? ''));
        }
        // Kolom di luar peta diabaikan; kolom resultan bisa mandiri.
        $rows[] = $row;
    }
    fclose($stream);
    return $rows;
}

/** XLSX -> baris; setiap sheet punya header sendiri. */
function knowledge_parseXlsx(string $path): array
{
    $catatan = [];
    $sheets = SimpleXlsxReader::load($path);
    if ($sheets === null) {
        return [[], ['XLSX tidak dapat dibaca (file rusak atau ekstensi ZIP server mati).']];
    }

    $rows = [];
    foreach ($sheets as $nama => $table) {
        if ($table === [] || !is_array($table)) {
            continue;
        }
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $table[0]);
        $peta = knowledge_petaKolom($header);
        if ($peta['judul'] === null || $peta['konten'] === null) {
            $catatan[] = "Sheet \"{$nama}\": header wajib judul & konten tidak ada - dilewati";
            continue;
        }
        foreach (array_slice($table, 1) as $cols) {
            $row = [];
            foreach ($peta as $namaField => $idx) {
                $row[$namaField] = $idx === null ? '' : trim((string) ($cols[$idx] ?? ''));
            }
            $rows[] = $row;
        }
    }
    return [$rows, $catatan];
}

/** Peta header -> nama field wajib; judul & konten bila tidak ada = CSV dianggap bukan dataset. */
function knowledge_petaKolom(array $header): array
{
    $peta = ['judul' => null, 'kategori' => null, 'konten' => null, 'tags' => null, 'sumber' => null];
    foreach ($header as $idx => $h) {
        // isset() keliru di sini: key bervalue NULL dianggap tidak ada —
        // pakai array_key_exists supaya peta bisa terisi.
        if ($h !== '' && array_key_exists($h, $peta)) {
            $peta[$h] = $idx;
        }
    }
    return $peta;
}

/** Cari delimiter dominan pada baris header; Excel Indonesia pakai ';'. */
function knowledge_cariDelimiter(string $raw): string
{
    $line = strtok($raw, "\r\n") ?: '';
    if (substr_count($line, ';') > substr_count($line, ',')) {
        return ';';
    }
    return ',';
}

/** Panjang karakter UTF-8 tanpa ext-mbstring (ekstensi bisa kosong). */
function knowledge_utf8Len(string $s): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($s);
    }
    return (int) preg_match_all('/./u', $s);
}

/** Buang komentar penulis dari isi konten; baris heading TETAP dipertahankan. */
function knowledge_stripHeading(string $text): string
{
    // Komentar contoh/keterangan penulis tidak boleh ikut jadi konteks AI.
    $text = preg_replace('/<!--.*?-->/s', '', $text) ?? $text;
    $text = preg_replace('/\\{#.*?\\}/', '', $text) ?? $text;
    // Sub-heading '##' sengaja TIDAK dibuang: itu struktur yang membantu
    // chatbot menjawab (mis. "## Dokumen yang diperlukan PPDB"). Yang hanya
    // diburunkan cukup kerapatan baris kosong.
    return trim(preg_replace('/\\n{3,}/', "\\n\\n", $text) ?? $text);
}

/** Tebak kategori dari judul+konten bila kolom tidak diisi/tidak dikenali. */
function knowledge_tebakKategori(string $haystack): string
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
