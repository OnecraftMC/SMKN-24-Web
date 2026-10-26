<?php
/**
 * POST /api/knowledge/test.php
 * Body: { "kata": "pertanyaan atau kata kunci" }
 *
 * Alat bantu admin: menjalankan retrieval knowledge yang SAMA dengan chatbot
 * (`toolCariPengetahuanData`) tanpa memanggil provider AI. Admin bisa melihat
 * baris mana yang akan dibaca chatbot, skornya, dan potongan yang dikirim.
 *
 * Read-only. Hanya untuk admin yang sudah login.
 */

require_once __DIR__ . '/../../bootstrap.php';

requireMethod('POST');
requireAuth();

$body = getJsonBody();
$kata = trim((string) ($body['kata'] ?? ''));
if ($kata === '') {
    jsonError("Field 'kata' wajib diisi", 400);
}
if (mb_strlen($kata) > 500) {
    jsonError("Field 'kata' terlalu panjang (maks 500 karakter)", 400);
}

$db = getDB();
$terms = toolKnowledgeSearchTerms($kata);
$rows = toolCariPengetahuanData($db, ['kata' => $kata, 'batas' => 8]);

$hasil = [];
foreach ($rows as $r) {
    $hasil[] = [
        'judul' => (string) ($r['judul'] ?? ''),
        'kategori' => (string) ($r['kategori'] ?? 'Umum'),
        'tags' => (string) ($r['tags'] ?? ''),
        'relevansi' => (int) ($r['relevansi'] ?? 0),
        'potongan' => toolKnowledgeWindow(
            (string) ($r['konten'] ?? ''),
            $terms,
            360
        ),
    ];
}

jsonResponse([
    'kata' => $kata,
    'total' => count($hasil),
    'hasil' => $hasil,
]);
