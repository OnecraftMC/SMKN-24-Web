<?php
/**
 * Normalisasi dataset chatbot ke format Pola A (heading '#' = pemisah dokumen)
 * untuk import-chat-knowledge.php.
 *
 * Input : dataset asli (memuat Bagian 1..5).
 * Output: hanya BAGIAN 3 (KB) dan BAGIAN 4 (QA) - fakta siap pakai.
 *   - Bagian 1 = materi system prompt -> diwakili AI_SYSTEM_PROMPT, tidak diimpor.
 *   - Bagian 2 = router instruksi internal, bukan pengetahuan.
 *   - Bagian 5 = glosarium pemetaan istilah -> noise pencocokan tanpa normalisasi query.
 *
 * Pakai:
 *   php backend/tools/convert-dataset.php <dataset.md> <keluaran.md>
 */

$sumber = $argv[1] ?? null;
$keluaran = $argv[2] ?? null;
if (!is_string($sumber) || !is_string($keluaran)) {
    fwrite(STDERR, "Pakai: php backend/tools/convert-dataset.php <dataset.md> <keluaran.md>\n");
    exit(1);
}
if (!is_readable($sumber)) {
    fwrite(STDERR, "Sumber tidak terbaca: {$sumber}\n");
    exit(1);
}
$raw = file_get_contents($sumber);
if (!is_string($raw) || $raw === '') {
    fwrite(STDERR, "Sumber kosong/gagal dibaca.\n");
    exit(1);
}

$posKb = strpos($raw, '# BAGIAN 3');
$posQa = strpos($raw, '# BAGIAN 4');
$posQaEnd = strpos($raw, '# BAGIAN 5');
if ($posKb === false || $posQa === false || $posQaEnd === false) {
    fwrite(STDERR, "Struktur dataset tidak sesuai harapan: butuh penanda '# BAGIAN 3', '# BAGIAN 4', '# BAGIAN 5'.\n");
    exit(1);
}

$dokumen = [];

// Bagian 3: penanda "### KB-xx Judul".
$bagianKb = substr($raw, $posKb, $posQa - $posKb);
preg_match_all('/^### (KB-[0-9]+[A-Z]? .+?)\s*$\n(.*?)(?=^### |^## |^# |\z)/ms', $bagianKb, $m, PREG_SET_ORDER);
foreach ($m as $blok) {
    $judul = normalizeJudul($blok[1]);
    $konten = normalizeKonten($blok[2]);
    if ($judul !== '' && $konten !== '') {
        $dokumen[] = ['judul' => $judul, 'konten' => $konten];
    }
}

// Bagian 4: penanda "**QA-xx | Iyy**" diikuti pertanyaan dalam tanda miring.
$bagianQa = substr($raw, $posQa, $posQaEnd - $posQa);
preg_match_all('/^\*\*QA-[0-9]+\s*\|\s*I[0-9]+(?:\/I[0-9]+)*\*\*\s*(?:—|--)?\s*([^\n]+?)\*?\s*\n(.*?)(?=^\*\*QA-|^### |^# |\z)/ms', $bagianQa, $m, PREG_SET_ORDER);
foreach ($m as $blok) {
    $judul = normalizeJudul(trim($blok[1], " \t\"\xE2\x80\x9C\xE2\x80\x9D*"));
    // Buang penanda ujung ("| KB-27", "| 2.5", "| —").
    $konten = preg_replace('/\s*\|\s*(?:KB-[0-9]+(?:,\s*KB-[0-9]+)*|[0-9]+(?:\.[0-9]+)?|—)\s*$/', '', trim($blok[2]));
    $konten = normalizeKonten((string) $konten);
    if ($judul !== '' && $konten !== '') {
        $dokumen[] = ['judul' => $judul, 'konten' => $konten];
    }
}

if ($dokumen === []) {
    fwrite(STDERR, "Tidak ada dokumen diekstrak - cek format sumber.\n");
    exit(1);
}

$out = "# Knowledge base chatbot SMK Negeri 24 Jakarta\n\n"
    . "Dikonversi dari dataset sumber oleh convert-dataset.php.\n"
    . "Hanya Bagian 3 (KB) dan Bagian 4 (QA).\n\n";
foreach ($dokumen as $d) {
    $out .= '# ' . $d['judul'] . "\n\n" . $d['konten'] . "\n\n";
}

if (file_put_contents($keluaran, $out) === false) {
    fwrite(STDERR, "Gagal menulis: {$keluaran}\n");
    exit(1);
}

$jumlahKb = count(array_filter($dokumen, fn($d) => str_starts_with($d['judul'], 'KB-')));
echo "Sumber    : {$sumber}\n";
echo "Keluaran  : {$keluaran}\n";
echo "Dokumen   : " . count($dokumen) . " (KB: {$jumlahKb}, QA: " . (count($dokumen) - $jumlahKb) . ")\n";
echo "Ukuran    : " . strlen($out) . " byte\n";

function normalizeJudul(string $s): string
{
    $s = preg_replace('/[*\"]/', '', $s) ?? $s;
    $s = preg_replace('/\s+/', ' ', $s) ?? $s;
    return trim($s);
}

function normalizeKonten(string $s): string
{
    $s = preg_replace('/^\s*\n{3,}/m', "\n\n", $s) ?? $s;
    return trim($s);
}