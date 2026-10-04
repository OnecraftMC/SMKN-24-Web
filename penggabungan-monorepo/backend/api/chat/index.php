<?php
/**
 * POST /api/chat/index.php
 * Body: { "message": "teks pertanyaan user", "sessionId": "opsional-id-sesi" }
 *
 * Endpoint ini meneruskan pertanyaan user ke AI provider (OpenAI/Gemini/Anthropic)
 * yang API key-nya diatur di file .env / config/config.php, lalu mengembalikan
 * balasan bot. Riwayat percakapan disimpan ke tabel chat_sessions & chat_messages.
 */

require_once __DIR__ . '/../../bootstrap.php';

requireMethod('POST');

$body = getJsonBody();
$message = trim($body['message'] ?? '');
$sessionId = trim($body['sessionId'] ?? '') ?: bin2hex(random_bytes(12));

if ($message === '') {
    jsonError("Field 'message' wajib diisi", 400);
}

$db = getDB();
ensureSession($db, $sessionId);
saveMessage($db, $sessionId, 'user', $message);

// Ambil sedikit konteks percakapan sebelumnya (maks 10 pesan terakhir) untuk continuity
$history = getHistory($db, $sessionId);

// Ambil juga beberapa data sekolah terbaru supaya AI bisa menjawab dengan konteks nyata
$context = buildSchoolContext($db);

// Dua kondisi harus bisa dibedakan oleh pemanggil: jawaban AI asli, atau
// provider yang belum dikonfigurasi/gagal. Tanpa penanda ini, teks bantuan
// dikirim dengan HTTP 200 dan frontend tidak bisa tahu itu bukan jawaban AI.
$aiAvailable = true;
$reason = null;

if (!aiProviderConfigured()) {
    error_log('[SMKN24] Chat AI dilewati: API key provider belum diisi di .env.');
    $aiAvailable = false;
    $reason = 'not_configured';
    $reply = AI_UNAVAILABLE_MESSAGE;
} else {
    try {
        $reply = generateAiReply($message, $history, $context);
    } catch (Throwable $e) {
        // Request ke provider gagal. Detail teknis cukup masuk log server —
        // pengunjung publik hanya melihat pesan umum.
        error_log('[SMKN24] Chat AI gagal: ' . $e->getMessage());
        $aiAvailable = false;
        $reason = 'provider_error';
        $reply = AI_UNAVAILABLE_MESSAGE;
    }
}

saveMessage($db, $sessionId, 'bot', $reply);

jsonResponse([
    'sessionId' => $sessionId,
    'reply' => $reply,
    // `aiAvailable` = false berarti `reply` hanya pesan bantuan, bukan jawaban
    // model. Frontend wajib memperlakukannya sebagai kondisi tak tersedia,
    // bukan menampilkan bubble percakapan biasa.
    'aiAvailable' => $aiAvailable,
    'reason' => $reason,
]);

// -----------------------------------------------------------------------------

/**
 * True bila API key untuk AI_PROVIDER yang dipilih sudah terisi di .env.
 *
 * Dicek sebelum memanggil layanan AI supaya kondisi "belum dikonfigurasi"
 * dapat dibedakan dari "provider gagal" pada respons publik. Kunci dibaca lewat
 * `env()` di config/config.php, jadi nilainya tidak pernah keluar dari server.
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

function ensureSession(PDO $db, string $sessionId): void
{
    $stmt = $db->prepare('INSERT IGNORE INTO chat_sessions (id) VALUES (?)');
    $stmt->execute([$sessionId]);
}

function saveMessage(PDO $db, string $sessionId, string $sender, string $text): void
{
    $stmt = $db->prepare(
        'INSERT INTO chat_messages (session_id, sender, text) VALUES (?, ?, ?)'
    );
    $stmt->execute([$sessionId, $sender, $text]);
}

function getHistory(PDO $db, string $sessionId, int $limit = 10): array
{
    $stmt = $db->prepare(
        'SELECT sender, text FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?'
    );
    $stmt->bindValue(1, $sessionId);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();
    return array_reverse($stmt->fetchAll());
}

function buildSchoolContext(PDO $db): string
{
    $parts = [];

    $stmt = $db->query('SELECT judul FROM pengumuman ORDER BY tanggal DESC LIMIT 3');
    $pengumuman = array_column($stmt->fetchAll(), 'judul');
    if ($pengumuman) {
        $parts[] = 'Pengumuman terbaru: ' . implode('; ', $pengumuman);
    }

    $stmt = $db->query('SELECT judul, tgl_mulai FROM agenda ORDER BY tgl_mulai ASC LIMIT 3');
    $agenda = array_map(fn($r) => $r['judul'] . ' (' . $r['tgl_mulai'] . ')', $stmt->fetchAll());
    if ($agenda) {
        $parts[] = 'Agenda mendatang: ' . implode('; ', $agenda);
    }

    return implode("\n", $parts);
}

/**
 * Meneruskan percakapan ke AI provider yang dipilih di config (AI_PROVIDER).
 *
 * Pemanggilan provider sendiri TIDAK diulang di sini â€” semuanya memakai
 * `callAiProvider()` dari `helpers/ai.php`, yang juga dipakai Counsellor AI
 * Bimbingan Konseling. Yang membedakan hanya system prompt: file ini memakai
 * AI_SYSTEM_PROMPT (info sekolah), sedangkan endpoint BK memakai
 * AI_BK_SYSTEM_PROMPT (triase).
 */
function generateAiReply(string $message, array $history, string $context): string
{
    $messages = [
        ['role' => 'system', 'content' => AI_SYSTEM_PROMPT . ($context ? "\n\nKonteks data sekolah saat ini:\n$context" : '')],
    ];

    foreach ($history as $h) {
        $messages[] = [
            'role' => $h['sender'] === 'user' ? 'user' : 'assistant',
            'content' => $h['text'],
        ];
    }

    return callAiProvider($messages);
}
