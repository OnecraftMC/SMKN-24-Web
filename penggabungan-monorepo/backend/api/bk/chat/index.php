<?php
/**
 * POST /api/bk/chat/index.php
 * Body: { "messages": [{ "role": "user"|"bot", "text": "..." }],
 *         "nama": "opsional", "kelas": "opsional", "noHp": "opsional" }
 *
 * Endpoint Bimbingan Konseling berbasis AI (counsellor AI).
 *
 * Berbeda dengan /api/chat/index.php yang menjawab pertanyaan umum sekolah,
 * endpoint ini punya satu tujuan: menyimpan cerita siswa hasil triase AI —
 * ringkasan masalah, kategori, dan TINGKAT KESULITAN — supaya guru BK bisa
 * menentukan mana yang ditangani lebih dahulu.
 *
 * AI memakai system prompt AI_BK_SYSTEM_PROMPT dan diminta menjawab JSON.
 */

// File ini satu tingkat lebih dalam dibanding endpoint lain
// (api/bk/index.php), sehingga path ke bootstrap memakai 3 tingkat "../".
require_once __DIR__ . '/../../../bootstrap.php';

requireMethod('POST');

$body = getJsonBody();

$messages = $body['messages'] ?? null;
if (!is_array($messages) || $messages === []) {
    jsonError("Field 'messages' wajib diisi dan tidak boleh kosong", 400);
}

// Ambil hanya pesan dari siswa (role user) sebagai bahan triase.
//
// Frontend BKChatModal mengirim field `sender`, sedangkan kontrak lama
// memakai `role`. Keduanya diterima supaya frontend dan backend sinkron.
$studentTexts = [];
foreach ($messages as $m) {
    if (!is_array($m)) {
        continue;
    }
    $role = $m['role'] ?? $m['sender'] ?? '';
    $text = trim($m['text'] ?? '');
    if ($role === 'user' && $text !== '') {
        $studentTexts[] = $text;
    }
}

if ($studentTexts === []) {
    jsonError('Ceritakan dulu masalah yang sedang kamu rasakan, ya.', 400);
}

$nama = trim($body['nama'] ?? '');
$kelas = trim($body['kelas'] ?? '');
$noHp = trim($body['noHp'] ?? '');
$deviceId = trim($body['deviceId'] ?? '');

// deviceId hanya dipakai agar siswa bisa membaca history-nya sendiri di
// perangkat yang sama. Kalau tidak dikirim (mis. browser tanpa localStorage),
// cerita tetap tersimpan tanpa kunci history.
if ($deviceId !== '' && !preg_match('/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/i', $deviceId)) {
    $deviceId = '';
}

// Gabungkan seluruh cerita siswa menjadi satu teks untuk dianalisis AI.
$story = implode("\n", $studentTexts);

$ringkasan = null;
$kategori = null;
$tingkat = null;
$butuhPerhatian = false;
$balasanSiswa = "Terima kasih sudah bercerita. Ceritamu sudah kami terima dan akan segera ditindaklanjuti oleh tim Bimbingan Konseling.";

// Panggil AI BK. Bila provider gagal, cerita siswa TETAP tersimpan supaya
// guru BK tidak lose data — hanya triase otomatisnya yang kosong.
try {
    $messagesAi = [
        ['role' => 'system', 'content' => AI_BK_SYSTEM_PROMPT],
        ['role' => 'user', 'content' => "Ceritakan masalah yang sedang kamu rasakan:\n\n" . $story],
    ];

    $raw = callAiProvider($messagesAi, aiFeatureOptions('bk'));
    $data = extractJsonObject($raw);

    if ($data !== null) {
        $ringkasan = trim($data['ringkasan'] ?? '') ?: null;
        $kategori = normaliseKategori($data['kategori'] ?? '');
        $tingkat = normaliseTingkat($data['tingkat_kesulitan'] ?? '');
        $butuhPerhatian = !empty($data['butuh_perhatian']);
        $balasan = trim($data['balasan_siswa'] ?? '');
        if ($balasan !== '') {
            $balasanSiswa = $balasan;
        }
    } else {
        // JSON tidak terbaca — pakai ringkasan cadangan dari cerita siswa.
        error_log('[SMKN24] AI BK tidak mengembalikan JSON yang valid.');
        $ringkasan = fallbackRingkasan($studentTexts);
    }
} catch (Throwable $e) {
    error_log('[SMKN24] AI BK gagal: ' . $e->getMessage());
    $ringkasan = fallbackRingkasan($studentTexts);
}

// Simpan ke pesan_bk. Nama/kelas boleh kosong untuk anonymity (anonim).
$db = getDB();
$transkrip = json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$stmt = $db->prepare(
    'INSERT INTO pesan_bk
        (nama, kelas, no_hp, keperluan, pesan, ringkasan, tingkat_kesulitan, kategori, butuh_perhatian, transkrip, device_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $nama !== '' ? $nama : 'Anonim',
    $kelas !== '' ? $kelas : '-',
    $noHp !== '' ? $noHp : null,
    'Ceritakan Masalah lewat AI',
    $story,
    $ringkasan,
    $tingkat,
    $kategori,
    $butuhPerhatian ? 1 : 0,
    $transkrip,
    $deviceId !== '' ? $deviceId : null,
]);

$id = (int)$db->lastInsertId();

jsonResponse([
    'message' => $balasanSiswa,
    'id' => $id,
    'tingkatKesulitan' => $tingkat,
    'butuhPerhatian' => $butuhPerhatian,
], 201);

// -----------------------------------------------------------------------------
// Normalisasi nilai dari AI. Model kadang menulis "sedang"/"Sedang." atau
// kategori di luar daftar, jadi selalu dipetakan ke nilai yang valid.
// -----------------------------------------------------------------------------

function normaliseTingkat($value): ?string
{
    $v = strtolower(trim((string)$value));
    $map = [
        'ringan' => 'Ringan',
        'sedang' => 'Sedang',
        'berat' => 'Berat',
    ];
    return $map[$v] ?? null;
}

function normaliseKategori($value): ?string
{
    $v = trim((string)$value);
    $allowed = ['Akademik', 'Sosial', 'Keluarga', 'Ekonomi', 'Kecemasan', 'Kekerasan', 'Lainnya'];
    foreach ($allowed as $a) {
        if (strcasecmp($v, $a) === 0) {
            return $a;
        }
    }
    return 'Lainnya';
}

/**
 * Ringkasan cadangan bila AI gagal: ambil kalimat pertama cerita siswa,
 * dibersihkan dari pembuka sapaan yang tidak perlu.
 */
function fallbackRingkasan(array $studentTexts): string
{
    $text = preg_replace('/\s+/', ' ', implode(' ', $studentTexts)) ?? '';
    $text = trim($text);
    if (strlen($text) > 300) {
        $text = substr($text, 0, 297) . '...';
    }
    return $text !== '' ? 'Siswa melaporkan: ' . $text : 'Siswa mengirim laporan melalui counseller AI.';
}
