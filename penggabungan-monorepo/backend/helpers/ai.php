<?php
/**
 * Client AI bersama untuk seluruh kebutuhan AI di backend.
 *
 * Backend ini punya TIGA kegunaan AI yang sengaja dipisah agar masing-masing
 * fokus pada satu tujuan:
 *
 *  1. AI ASISTEN SEKOLAH - menjawab pertanyaan umum (PPDB, jurusan, jadwal,
 *     fasilitas). Memakai AI_SYSTEM_PROMPT.
 *  2. AI BIMBINGAN KONSELING - triase keluhahan siswa: merangkum masalah dan
 *     menentukan tingkat kesulitan untuk guru BK. Memakai AI_BK_SYSTEM_PROMPT.
 *
 *  3. AI PENYUSUN DRAF - menyusun draf konten untuk form admin. Memakai
 *     AI_CONTENT_SYSTEM_PROMPT.
 *
 * Ketiganya memakai pemanggil provider yang sama (`callAiProvider`) supaya
 * credential, timeout, dan penanganan error hanya ada di satu tempat. Yang
 * membedakan hanya system prompt dan, untuk BK/draf, mode output JSON.
 *
 * Provider, akun (API key), dan model boleh BERBEDA per kegunaan lewat opsi
 * `provider`, `api_key`, `model`, dan `base_url`. Default-nya tetap konstanta
 * global AI_PROVIDER serta konstanta key/model tiap provider, jadi tidak ada
 * regresi saat opsi itu tidak diisi. Lihat `aiFeatureOptions()` di bawah.
 */

/**
 * Ambil satu nilai opsional dari `$options`. String kosong dianggap "tidak diisi"
 * supaya fallback ke konstanta global tetap berlaku.
 *
 * @return string|null Nilai non-kosong, atau null bila tidak diisi.
 */
function aiOption(array $options, string $key): ?string
{
    $value = $options[$key] ?? '';
    if (!is_string($value)) {
        return null;
    }
    $value = trim($value);
    return $value === '' ? null : $value;
}

/**
 * Opsi provider untuk satu kegunaan AI.
 *
 * Dibaca dari konstanta per-fitur di config/config.php yang semuanya ber-default
 * ke nilai global. `api_key`/`model`/`base_url` sengaja boleh kosong: pemanggil
 * provider memakai konstanta global saat opsi itu null.
 *
 * @param string $feature 'chat' | 'bk' | 'content'
 */
function aiFeatureOptions(string $feature): array
{
    switch ($feature) {
        case 'chat':
            return [
                'provider' => AI_CHAT_PROVIDER,
                'api_key' => AI_CHAT_API_KEY,
                'model' => AI_CHAT_MODEL,
                'base_url' => AI_CHAT_BASE_URL,
            ];
        case 'bk':
            return [
                'provider' => AI_BK_PROVIDER,
                'api_key' => AI_BK_API_KEY,
                'model' => AI_BK_MODEL,
                'base_url' => AI_BK_BASE_URL,
            ];
        case 'content':
            return [
                'provider' => AI_CONTENT_PROVIDER,
                'api_key' => AI_CONTENT_API_KEY,
                'model' => AI_CONTENT_MODEL,
                'base_url' => AI_CONTENT_BASE_URL,
            ];
        default:
            return [];
    }
}

/**
 * True bila kegunaan AI yang dimaksud punya kunci API yang terisi.
 *
 * Dipakai endpoint SEBELUM memanggil provider supaya request tidak sekali pun
 * menyentuh layanan AI saat konfigurasi belum lengkap, dan supaya kondisi
 * "belum dikonfigurasi" bisa dibedakan dari "provider gagal" pada respons.
 *
 * Fungsi ini sengaja hanya satu, dipakai bersama oleh ketiga endpoint. Versi
 * sebelumnya disalin per-endpoint; salinan itu membuat fitur per-fitur rawan
 * lolos karena satu salinan lupa diperbarui.
 */
function aiProviderConfigured(array $options = []): bool
{
    $provider = aiOption($options, 'provider') ?? AI_PROVIDER;

    // Kunci khusus per-fitur, kalau diisi, menggantikan kunci global.
    if (aiOption($options, 'api_key') !== null) {
        return true;
    }

    switch ($provider) {
        case 'gemini':
            return !empty(GEMINI_API_KEY);
        case 'anthropic':
            return !empty(ANTHROPIC_API_KEY);
        case 'openai':
        default:
            return !empty(OPENAI_API_KEY);
    }
}

/**
 * Panggil provider AI sesuai AI_PROVIDER dan kembalikan teks balasannya.
 *
 * @param array $messages Daftar pesan [{role, content}, ...] sudah termasuk system.
 * @param array $options Tuning opsional: `max_tokens`, `temperature`, serta
 *                        `provider`/`api_key`/`model`/`base_url` untuk memakai
 *                        akun atau model lain per kegunaan. Yang empat terakhir
 *                        default-nya ke konstanta global dan ke nilai tuning
 *                        sebelumnya (400 / 0.6), sehingga pemanggil yang tidak
 *                        mengisinya tidak ikut berubah.
 * @return string Teks balasan mentah dari provider.
 */
function callAiProvider(array $messages, array $options = []): string
{
    switch (aiOption($options, 'provider') ?? AI_PROVIDER) {
        case 'gemini':
            $reply = callAiGemini($messages, $options);
            break;
        case 'anthropic':
            $reply = callAiAnthropic($messages, $options);
            break;
        case 'openai':
        default:
            $reply = callAiOpenai($messages, $options);
            break;
    }

    return trim($reply);
}

/**
 * OpenAI (juga untuk provider OpenAI-compatible lewat OPENAI_BASE_URL).
 */
function callAiOpenai(array $messages, array $options = []): string
{
    $apiKey = aiOption($options, 'api_key') ?? OPENAI_API_KEY;
    if (empty($apiKey)) {
        throw new RuntimeException('OPENAI_API_KEY belum diisi di file .env');
    }

    $model = aiOption($options, 'model') ?? OPENAI_MODEL;
    $baseUrl = aiOption($options, 'base_url') ?? OPENAI_BASE_URL;

    $payload = [
        'model' => $model,
        'messages' => $messages,
        'temperature' => $options['temperature'] ?? 0.6,
        'max_tokens' => $options['max_tokens'] ?? 400,
    ];

    $response = httpPostJson($baseUrl, $payload, [
        'Authorization: Bearer ' . $apiKey,
    ]);

    return $response['choices'][0]['message']['content'] ?? 'Maaf, tidak ada jawaban dari AI.';
}

/**
 * Anthropic Claude - `system` dikirim terpisah, messages hanya user/assistant.
 */
function callAiAnthropic(array $messages, array $options = []): string
{
    $apiKey = aiOption($options, 'api_key') ?? ANTHROPIC_API_KEY;
    if (empty($apiKey)) {
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
        'model' => aiOption($options, 'model') ?? ANTHROPIC_MODEL,
        'system' => $system,
        'messages' => $chatMessages,
        'max_tokens' => $options['max_tokens'] ?? 400,
    ];

    $response = httpPostJson('https://api.anthropic.com/v1/messages', $payload, [
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
    ]);

    return $response['content'][0]['text'] ?? 'Maaf, tidak ada jawaban dari AI.';
}

/**
 * Google Gemini - `systemInstruction` terpisah dari `contents`.
 */
function callAiGemini(array $messages, array $options = []): string
{
    $apiKey = aiOption($options, 'api_key') ?? GEMINI_API_KEY;
    if (empty($apiKey)) {
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
        'generationConfig' => [
            'temperature' => $options['temperature'] ?? 0.6,
            'maxOutputTokens' => $options['max_tokens'] ?? 400,
        ],
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        . (aiOption($options, 'model') ?? GEMINI_MODEL) . ':generateContent?key=' . $apiKey;

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
        // Harus lebih kecil dari timeout proxy `POST /api/chat` di frontend
        // (CHAT_TIMEOUT_MS = 25 detik) supaya provider yang lambat atau error
        // tetap sempat dibalas dari sini, bukan dipotong proxy menjadi 504.
        CURLOPT_TIMEOUT => 20,
    ]);

    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    // curl_close() sengaja tidak dipanggil: sejak PHP 8.0 resource cURL
    // dibebaskan otomatis, dan di PHP 8.5 pemanggilannya hanya memunculkan
    // notice deprecation yang mengotori error_log.

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
 * Mengembalikan null bila tidak ada JSON yang bisa diambil - pemanggil wajib
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
