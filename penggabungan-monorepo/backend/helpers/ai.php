<?php
/**
 * Client AI bersama untuk seluruh kebutuhan AI di backend.
 *
 * Backend ini punya DUA kegunaan AI yang sengaja dipisah agar masing-masing
 * fokus pada satu tujuan:
 *
 *  1. AI ASISTEN SEKOLAH â€” menjawab pertanyaan umum (PPDB, jurusan, jadwal,
 *     fasilitas). Memakai AI_SYSTEM_PROMPT.
 *  2. AI BIMBINGAN KONSELING â€” triase keluhahan siswa: merangkum masalah dan
 *     menentukan tingkat kesulitan untuk guru BK. Memakai AI_BK_SYSTEM_PROMPT.
 *
 * Keduanya memakai pemanggil provider yang sama (`callAiProvider`) supaya
 * credential, timeout, dan penanganan error hanya ada di satu tempat. Yang
 * membedakan hanya system prompt dan, untuk BK, mode output JSON.
 */

/**
 * Panggil provider AI sesuai AI_PROVIDER dan kembalikan teks balasannya.
 *
 * @param array $messages Daftar pesan [{role, content}, ...] sudah termasuk system.
 * @return string Teks balasan mentah dari provider.
 */
function callAiProvider(array $messages): string
{
    switch (AI_PROVIDER) {
        case 'gemini':
            $reply = callAiGemini($messages);
            break;
        case 'anthropic':
            $reply = callAiAnthropic($messages);
            break;
        case 'openai':
        default:
            $reply = callAiOpenai($messages);
            break;
    }

    return trim($reply);
}

/**
 * OpenAI (juga untuk provider OpenAI-compatible lewat OPENAI_BASE_URL).
 */
function callAiOpenai(array $messages): string
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

/**
 * Anthropic Claude â€” `system` dikirim terpisah, messages hanya user/assistant.
 */
function callAiAnthropic(array $messages): string
{
    if (empty(ANTHROPIC_API_KEY)) {
        throw new RuntimeException('ANTHROPIC_API_KEY belum diisi di file .env');
    }

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

/**
 * Google Gemini â€” `systemInstruction` terpisah dari `contents`.
 */
function callAiGemini(array $messages): string
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

/**
 * Pecah teks balasan AI menjadi array JSON. Menangani model yang membungkus
 * jawaban dalam pagar markdown (```json ... ```) atau menambah penjelasan di
 * luar objek JSON.
 *
 * Mengembalikan null bila tidak ada JSON yang bisa diambil â€” pemanggil wajib
 * punya nilai cadangan agar hasil triase tidak hilang.
 */
function extractJsonObject(string $text): ?array
{
    $text = trim($text);

    // Buang pagar markdown bila ada.
    $text = preg_replace('/^```(?:json)?\s*/i', '', $text) ?? $text;
    $text = preg_replace('/\s*```$/', '', $text) ?? $text;
    $text = trim($text);

    $decoded = json_decode($text, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    // Cari objek JSON pertama yang kurung kurawalnya seimbang.
    $start = strpos($text, '{');
    if ($start === false) {
        return null;
    }

    $depth = 0;
    $length = strlen($text);
    for ($i = $start; $i < $length; $i++) {
        if ($text[$i] === '{') {
            $depth++;
        } elseif ($text[$i] === '}') {
            $depth--;
            if ($depth === 0) {
                $candidate = json_decode(substr($text, $start, $i - $start + 1), true);
                return is_array($candidate) ? $candidate : null;
            }
        }
    }

    return null;
}
