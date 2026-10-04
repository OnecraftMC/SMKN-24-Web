<?php
/**
 * POST /api/ai/index.php            -> susun draf berita atau agenda (admin)
 * Body: { "modul": "berita"|"agenda", "catatan": "catatan mentah dari admin" }
 *
 * Endpoint ini adalah "penulis draf" untuk dashboard admin, terpisah dari
 * /api/chat (chatbot publik) dan /api/bk/chat (triase siswa):
 *
 *   - Cuma admin yang boleh memanggilnya (requireAuth). Endpoint publik tidak
 *     pernah menyentuh system prompt penyusun konten.
 *   - Endpoint ini TIDAK PERNAH menulis ke database. Ia hanya mengembalikan draf
 *     terstruktur untuk mengisi form admin. Admin wajib membaca, memperbaiki, dan
 *     baru menekan tombol Simpan pada form yang sudah ada. Inilah yang membuat
 *     fitur ini aman: kesalahan model pada dasarnya tidak bisa terbit sebagai
 *     berita tanpa disetujui manusia.
 *   - Field tanggal (tanggal / tglMulai / tglSelesai) SENGAJA tidak dihasilkan AI.
 *     Tanggal sekolah adalah data faktual dan paling rawan dihalusinasi, jadi
 *     tetap berada di bawah kendali admin.
 *
 * Kontrak respons (gaya sama dengan /api/chat):
 *   { "draf": {...}, "aiAvailable": true }
 *   { "error": "...", "aiAvailable": false, "reason": "not_configured"|"provider_error" }
 *
 * Field `aiAvailable` wajib dihormati pemanggil: saat false, `draf` kosong dan
 * teks di `error` hanyalah pesan bantuan, bukan hasil AI.
 */

require_once __DIR__ . '/../../bootstrap.php';

/**
 * Modul yang boleh dibuatkan draf, dipetakan ke daftar field yang boleh diisi AI
 * dan ke normalizernya.
 *
 * Daftar ini adalah satu-satunya sumber kebenaran modul yang didukung: dipakai
 * untuk memvalidasi input, memilih normalizer, DAN menentukan field mana yang
 * boleh diisi AI. Menambah modul berarti menambah satu entri di sini.
 *
 * Modul dengan data faktual/terstruktur sengaja TIDAK ada: jadwal (jam, mapel),
 * arsip (metadata berkas), prestasi & BK (data siswa). Mengarang isi kolom
 * seperti jam pelajaran atau lampiran berkas akan berbahaya, bukan membantu.
 */
const AI_CONTENT_MODULES = [
    'berita' => ['normaliser' => 'normaliseBeritaDraft', 'judul' => true],
    'pengumuman' => ['normaliser' => 'normalisePengumumanDraft', 'judul' => true],
    'agenda' => ['normaliser' => 'normaliseAgendaDraft', 'judul' => true],
    'fasilitas' => ['normaliser' => 'normaliseFasilitasDraft', 'judul' => true],
    'guru' => ['normaliser' => 'normaliseGuruDraft', 'judul' => false],
    'galeri' => ['normaliser' => 'normaliseGaleriDraft', 'judul' => true],
];

requireMethod('POST');

// Admin-only. Diletakkan sebelum memanggil provider supaya request tanpa token
// tidak sekali pun menyentuh layanan AI.
requireAuth();

$body = getJsonBody();

$modul = trim((string)($body['modul'] ?? ''));
if (!array_key_exists($modul, AI_CONTENT_MODULES)) {
    jsonError(
        "Field 'modul' harus salah satu dari: " . implode(', ', array_keys(AI_CONTENT_MODULES)),
        400
    );
}

$catatan = trim((string)($body['catatan'] ?? ''));
if ($catatan === '') {
    jsonError('Tuliskan catatan singkat dulu, lalu klik buat draf.', 400);
}
// Admin menulis catatan event, bukan artikel utuh. Batas ini juga menjaga
// request dan token ke provider tetap masuk akal.
if (mb_strlen($catatan) > 2000) {
    jsonError('Catatan terlalu panjang. Maksimal 2000 karakter.', 400);
}

if (!aiProviderConfigured()) {
    error_log('[SMKN24] Draf AI dilewati: API key provider belum diisi di .env.');
    jsonError(AI_CONTENT_UNAVAILABLE_MESSAGE, 503, [
        'aiAvailable' => false,
        'reason' => 'not_configured',
    ]);
}

$messages = [
    [
        'role' => 'system',
        'content' => AI_CONTENT_SYSTEM_PROMPT
            . "\n\nModul yang diminta sekarang: '" . $modul . "'.",
    ],
    ['role' => 'user', 'content' => "Catatan admin:\n\n" . $catatan],
];

try {
    // Draf berita butuh ruang lebih panjang daripada balasan chat, jadi
    // max_tokens dinaikkan HANYA untuk endpoint ini (chat & BK tetap 400).
    $raw = callAiProvider($messages, ['max_tokens' => 1600, 'temperature' => 0.7]);
    $parsed = extractJsonObject($raw);
} catch (Throwable $e) {
    error_log('[SMKN24] Draf AI gagal: ' . $e->getMessage());
    jsonError(AI_CONTENT_UNAVAILABLE_MESSAGE, 502, [
        'aiAvailable' => false,
        'reason' => 'provider_error',
    ]);
}

if ($parsed === null) {
    // Model menjawab sesuatu yang bukan JSON. Ini kegagalan format, bukan
    // kegagalan provider, dan admin perlu tahu bedanya supaya tidak mengulang
    // permintaan yang sudah pasti menghasilkan hal sama.
    error_log('[SMKN24] Draf AI tidak mengembalikan JSON yang valid. Modul: ' . $modul);
    jsonError('Draf dari AI tidak dapat dibaca. Silakan coba lagi atau tulis manual.', 502, [
        'aiAvailable' => true,
        'reason' => 'invalid_response',
    ]);
}

$normaliser = AI_CONTENT_MODULES[$modul]['normaliser'];
$draf = $normaliser($parsed);

// Draf tanpa isi sama sekali tidak berguna. Lebih baik bilang gagal daripada
// mengisi form dengan string kosong yang terlihat seperti "berhasil".
//
// Syarat ini per modul: modul 'guru' TIDAK punya kolom judul (namanya diisi
// admin), jadi draf guru cukup dianggap gagal bila deskripsinya kosong.
$wajib = AI_CONTENT_MODULES[$modul]['judul']
    ? trim($draf['judul']) === ''
    : trim($draf['deskripsi']) === '';
if ($wajib) {
    jsonError('Draf dari AI tidak memuat isi yang cukup. Silakan coba lagi atau tulis manual.', 502, [
        'aiAvailable' => true,
        'reason' => 'invalid_response',
    ]);
}

jsonResponse([
    'draf' => $draf,
    'aiAvailable' => true,
    'reason' => null,
]);

// -----------------------------------------------------------------------------
// Normalisasi hasil AI.
//
// Model sering mengembalikan JSON dengan nilai null, angka, atau teks yang lebih
// panjang dari batas kolom. Semua field dibersihkan di sini agar frontend selalu
// menerima string yang aman untuk input form, dan agar konten yang melebihi batas
// kolom tidak ditolak belakangan oleh database.
// -----------------------------------------------------------------------------

/** Bersihkan satu nilai AI menjadi teks trimmed. Nilai bukan-teks jadi string kosong. */
function cleanText($value, int $maxLength): string
{
    if (is_array($value) || is_bool($value) || $value === null) {
        return '';
    }

    $text = trim((string)$value);
    // Ratakan spasi/tab berlebih, tapi pertahankan pemisah baris kosong karena isi
    // berita memang sengaja berparagraf.
    $text = preg_replace('/[ \t]+/', ' ', $text) ?? $text;
    $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function normaliseBeritaDraft(array $data): array
{
    return [
        'judul' => cleanText($data['judul'] ?? '', 255),
        'ringkasan' => cleanText($data['ringkasan'] ?? '', 1000),
        'isi' => cleanText($data['isi'] ?? '', 20000),
    ];
}

function normaliseAgendaDraft(array $data): array
{
    return [
        'judul' => cleanText($data['judul'] ?? '', 255),
        'badge' => cleanText($data['badge'] ?? '', 100),
        'lokasi' => cleanText($data['lokasi'] ?? '', 255),
        'deskripsi' => cleanText($data['deskripsi'] ?? '', 2000),
    ];
}

/**
 * Pengumuman sengaja tidak membawa `link_href`: URL adalah data faktual yang
 * harus dituju resmi sekolah, bukan hasil tebakan model. Label tautan pun tidak
 * diminta karena form mengharuskannya berpasangan dengan href.
 */
function normalisePengumumanDraft(array $data): array
{
    return [
        'judul' => cleanText($data['judul'] ?? '', 255),
        'isi' => cleanText($data['isi'] ?? '', 5000),
        'badge' => cleanText($data['badge'] ?? '', 100),
        'status' => cleanText($data['status'] ?? '', 50),
    ];
}

function normaliseFasilitasDraft(array $data): array
{
    return [
        'judul' => cleanText($data['judul'] ?? '', 255),
        'deskripsi' => cleanText($data['deskripsi'] ?? '', 1000),
    ];
}

/**
 * Guru TIDAK boleh punya hasil draf berisi nama. Nama orang adalah identitas
 * nyata yang harus diketik admin sendiri; model yang mengarang nama guru berarti
 * membuat-buat data pribadi. Jabatan & deskripsi tetap boleh disusun karena
 * keduanya naratif.
 */
function normaliseGuruDraft(array $data): array
{
    return [
        'jabatan' => cleanText($data['jabatan'] ?? '', 255),
        'deskripsi' => cleanText($data['deskripsi'] ?? '', 1000),
    ];
}

/** Galeri hanya judul; gambar selalu dipilih admin dari berkas yang diunggah. */
function normaliseGaleriDraft(array $data): array
{
    return [
        'judul' => cleanText($data['judul'] ?? '', 255),
    ];
}

/**
 * True bila API key untuk AI_PROVIDER yang dipilih sudah terisi di .env.
 *
 * Disalin secara lokal (bukan memanggil versi di /api/chat) supaya endpoint ini
 * berdiri sendiri dan tidak bergantung pada file lain yang kebetulan punya
 * fungsi bernama sama.
 */
function aiProviderConfigured(): bool
{
    switch (AI_PROVIDER) {
        case 'gemini':
            return !empty(GEMINI_API_KEY);
        case 'anthropic':
            return !empty(ANTHROPIC_API_KEY);
        case 'openai':
        default:
            return !empty(OPENAI_API_KEY);
    }
}