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

try {
    $reply = generateAiReply($message, $history, $context);
} catch (Throwable $e) {
    // Jika API key belum diisi / request ke provider gagal, tetap beri jawaban fallback
    // Detail teknis cukup masuk log server — pengunjung publik hanya melihat pesan umum.
    error_log('[SMKN24] Chat AI gagal: ' . $e->getMessage());
    $reply = "Maaf, asisten AI sedang tidak dapat diakses saat ini. "
        . "Silakan hubungi bagian Tata Usaha SMKN 24 Jakarta untuk informasi lebih lanjut.";
}

saveMessage($db, $sessionId, 'bot', $reply);

jsonResponse([
    'sessionId' => $sessionId,
    'reply' => $reply,
]);

// -----------------------------------------------------------------------------

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

    switch (AI_PROVIDER) {
        case 'gemini':
            return callGemini($messages);
        case 'anthropic':
            return callAnthropic($messages);
        case 'openai':
        default:
            return callOpenAi($messages);
    }
}

function callOpenAi(array $messages): string
{
    if (empty(OPENAI_API_KEY)) {
        throw new RuntimeException('OPENAI_API_KEY belum diisi di file .env');
    }

    $payload = [
        'model' => OPENAI_MODEL,
        'messages' => $messages,
        'temperature' => 0.6,
        'max_tokens' => 400,
    ];

    $response = httpPostJson(OPENAI_BASE_URL, $payload, [
        'Authorization: Bearer ' . OPENAI_API_KEY,
    ]);

    return $response['choices'][0]['message']['content'] ?? 'Maaf, tidak ada jawaban dari AI.';
}

function callAnthropic(array $messages): string
{
    if (empty(ANTHROPIC_API_KEY)) {
        throw new RuntimeException('ANTHROPIC_API_KEY belum diisi di file .env');
    }

    // Format Anthropic: system terpisah, messages hanya user/assistant
    $system = '';
    $chatMessages = [];
    foreach ($messages as $m) {
        if ($m['role'] === 'system') {
            $system = $m['content'];
        } else {
            $chatMessages[] = $m;
        }
    }

    $payload = [
        'model' => ANTHROPIC_MODEL,
        'system' => $system,
        'messages' => $chatMessages,
        'max_tokens' => 400,
    ];

    $response = httpPostJson('https://api.anthropic.com/v1/messages', $payload, [
        'x-api-key: ' . ANTHROPIC_API_KEY,
        'anthropic-version: 2023-06-01',
    ]);

    return $response['content'][0]['text'] ?? 'Maaf, tidak ada jawaban dari AI.';
}

function callGemini(array $messages): string
{
    if (empty(GEMINI_API_KEY)) {
        throw new RuntimeException('GEMINI_API_KEY belum diisi di file .env');
    }

    $system = '';
    $contents = [];
    foreach ($messages as $m) {
        if ($m['role'] === 'system') {
            $system = $m['content'];
            continue;
        }
        $contents[] = [
            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ];
    }

    $payload = [
        'contents' => $contents,
        'systemInstruction' => ['parts' => [['text' => $system]]],
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        . GEMINI_MODEL . ':generateContent?key=' . GEMINI_API_KEY;

    $response = httpPostJson($url, $payload, []);

    return $response['candidates'][0]['content']['parts'][0]['text'] ?? 'Maaf, tidak ada jawaban dari AI.';
}

/**
 * Helper cURL generik untuk POST JSON ke API eksternal.
 */
function httpPostJson(string $url, array $payload, array $extraHeaders = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $extraHeaders),
        CURLOPT_TIMEOUT => 30,
    ]);

    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        throw new RuntimeException('Gagal menghubungi layanan AI: ' . $curlError);
    }

    $decoded = json_decode($responseBody, true);

    if ($httpCode >= 400) {
        $errMsg = $decoded['error']['message'] ?? $responseBody;
        throw new RuntimeException("Layanan AI mengembalikan error ($httpCode): $errMsg");
    }

    return $decoded ?? [];
}
