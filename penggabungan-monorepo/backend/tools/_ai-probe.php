<?php
/**
 * Uji respons AI nyata tanpa menyentuh database.
 *
 * Dipakai sementara untuk memastikan jalur provider (auth, base URL, model,
 * bentuk respons) benar-benar bekerja. Bukan untuk produksi.
 *
 * Jalankan: php backend/tools/_ai-probe.php chat|bk|content
 */
// Probe mandiri: memanggil provider langsung dengan cURL, tanpa memakai
// helper produksi, supaya SSL lokal tidak menutupi diagnosis provider.
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/ai.php';

$feature = $argv[1] ?? 'chat';

if ($feature === 'models') {
    // Daftar model yang tersedia untuk kunci ini. Cuma membaca nama model.
    require_once __DIR__ . '/../config/config.php';
    require_once __DIR__ . '/../helpers/ai.php';
    $opts = aiFeatureOptions('chat');
    $k = aiOption($opts, 'api_key') ?? OPENAI_API_KEY;
    $url = aiOption($opts, 'base_url') ?? OPENAI_BASE_URL;
    $listUrl = preg_replace('#/chat/completions$#', '/models', $url);
    $ch = curl_init($listUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $k],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CAINFO => getenv('CACERT') ?: '',
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo "HTTP {$code} {$listUrl}\n";
    $data = json_decode((string) $body, true);
    $ids = array_column($data['data'] ?? [], 'id');
    sort($ids);
    echo count($ids) . " model\n";
    foreach ($ids as $id) {
        echo "  {$id}\n";
    }
    exit;
}
$options = aiFeatureOptions($feature);

$provider = aiOption($options, 'provider') ?? AI_PROVIDER;
$key = aiOption($options, 'api_key');
if ($key === null) {
    $key = $provider === 'gemini' ? GEMINI_API_KEY
        : ($provider === 'anthropic' ? ANTHROPIC_API_KEY : OPENAI_API_KEY);
}
$model = aiOption($options, 'model') ?? ($provider === 'gemini' ? GEMINI_MODEL : OPENAI_MODEL);
$baseUrl = aiOption($options, 'base_url') ?? OPENAI_BASE_URL;

// Opsional: `--model=<nama>` mengganti model sementara untuk uji alternatif.
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--model=')) {
        $model = substr($arg, strlen('--model='));
    }
}

echo "fitur           : {$feature}\n";
echo "provider        : {$provider}\n";
echo "model           : {$model}\n";
echo "base_url        : {$baseUrl}\n";
echo 'key sumber      : ' . (aiOption($options, 'api_key') === null ? 'GLOBAL' : 'PER-FITUR') . "\n";
echo 'key prefix      : ' . substr((string) $key, 0, 4) . ' (' . strlen((string) $key) . "ch)\n";
echo 'configured()    : ' . (aiProviderConfigured($options) ? 'YA' : 'TIDAK') . "\n\n";

$payload = [
    'model' => $model,
    'messages' => [
        ['role' => 'system', 'content' => 'Kamu asisten uji. Jawab singkat.'],
        ['role' => 'user', 'content' => 'Sebutkan satuJurusan SMK.'],
    ],
    'temperature' => 0.6,
    'max_tokens' => 100,
];

$insecure = in_array('--insecure', $argv, true);

$ch = curl_init($baseUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key,
    ],
    CURLOPT_TIMEOUT => 30,
]);
if ($insecure) {
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    echo "[probe] --insecure: verifikasi sertifikat dimatikan (KHATAMAN lokal saja)\n";
}

$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "HTTP           : {$code}\n";
echo 'curl_error     : ' . ($err !== '' ? $err : '(tidak ada)') . "\n";
echo "--- BODY ---\n" . substr((string) $body, 0, 2000) . "\n--- END ---\n";

$decoded = json_decode((string) $body, true);
if (is_array($decoded)) {
    echo 'top-level keys : ' . implode(', ', array_keys($decoded)) . "\n";
    $text = $decoded['choices'][0]['message']['content'] ?? null;
    echo 'choices[0]     : ' . ($text === null ? 'TIDAK ADA (path tidak cocok!)' : 'ADA') . "\n";
    if (is_string($text)) {
        echo "isi jawaban    : {$text}\n";
    }
}

// Body JSON ditulis ke file supaya tidak perlu escaping di shell.
$endpoint = match ($feature) {
    'bk' => '/api/bk/chat/index.php',
    'content' => '/api/ai/index.php',
    default => '/api/chat/index.php',
};

$payloadHttp = match ($feature) {
    'bk' => [
        'messages' => [
            ['sender' => 'user', 'text' => 'Saya sering merasa lelah dan sulit tidur sejak sebulan lalu.'],
        ],
        'nama' => 'Siswa Uji',
        'kelas' => 'XII-1',
    ],
    'content' => [
        'modul' => 'berita',
        'catatan' => 'Guru SMK Negeri 24 Jakarta mengikuti lomba teknologi informasi.',
    ],
    default => [
        'message' => 'Jurusan apa saja yang ada di SMKN 24 Jakarta?',
        'sessionId' => 'probe-e2e-001',
    ],
};

echo "=== E2E: POST {$endpoint} lewat HTTP lokal ===\n";
// ---------------------------------------------------------------------------
// Uji helper produksi dengan prompt asli tiap fitur. Tanpa database:
// tujuan hanya memastikan provider + prompt + format output (JSON) berfungsi.
// ---------------------------------------------------------------------------
echo "\n=== UJI HELPER (prompt asli, tanpa DB) ===\n";
$realMessages = match ($feature) {
    'bk' => [
        ['role' => 'system', 'content' => AI_BK_SYSTEM_PROMPT],
        ['role' => 'user', 'content' => "Ceritakan masalah yang sedang kamu rasakan:\n\nSaya sering merasa lelah dan sulit tidur sejak sebulan lalu, nilai saya juga turun."],
    ],
    'content' => [
        ['role' => 'system', 'content' => AI_CONTENT_SYSTEM_PROMPT . "\n\nModul yang diminta sekarang: 'berita'."],
        ['role' => 'user', 'content' => "Catatan admin:\n\nSman 1 mengadakan lomba robotik tingkat nasional di aula sekolah."],
    ],
    default => [
        ['role' => 'system', 'content' => AI_SYSTEM_PROMPT],
        ['role' => 'user', 'content' => 'Apa bedanya PPDB dan SPMB?'],
    ],
};
$tune = $feature === 'content' ? ['max_tokens' => 1600, 'temperature' => 0.7] : [];
try {
    $t0 = microtime(true);
    $out = callAiProvider($realMessages, array_merge($options, $tune));
    echo 'latensi        : ' . round((microtime(true) - $t0) * 1000) . " ms\n";
    echo "isi            : " . substr($out, 0, 900) . "\n";
    if ($feature !== 'chat') {
        $p = extractJsonObject($out);
        if ($p === null) {
            echo "extract JSON   : GAGAL (null)\n";
        } else {
            echo 'extract JSON   : OK, field = ' . implode(', ', array_keys($p)) . "\n";
        }
    }
} catch (Throwable $e) {
    echo 'GAGAL -> ' . get_class($e) . ': ' . $e->getMessage() . "\n";
}

$bodyFile = sys_get_temp_dir() . '/_ai_probe_body.json';
file_put_contents($bodyFile, json_encode($payloadHttp));

$out = [];
$code = 0;
exec(escapeshellcmd('curl.exe') . ' -s -X POST http://127.0.0.1:8899' . $endpoint
    . ' -H "Content-Type: application/json"'
    . ' --data-binary "@' . $bodyFile . '" 2>&1', $out, $code);

$raw = implode("\n", $out);
echo "HTTP           : {$code}\n";
echo "--- BODY ---\n" . substr($raw, 0, 1500) . "\n--- END ---\n";

$json = json_decode($raw, true);
if (is_array($json)) {
    foreach (['aiAvailable', 'reason'] as $key) {
        if (array_key_exists($key, $json)) {
            echo $key . ' : ' . var_export($json[$key], true) . "\n";
        }
    }
    foreach (['reply', 'message'] as $key) {
        if (!empty($json[$key])) {
            echo $key . ' : ' . $json[$key] . "\n";
        }
    }
    if (!empty($json['draf']) && is_array($json['draf'])) {
        echo "draf keys   : " . implode(', ', array_keys($json['draf'])) . "\n";
    }
    if (isset($json['tingkatKesulitan'])) {
        echo "tingkat     : " . var_export($json['tingkatKesulitan'], true) . "\n";
    }
}

unlink($bodyFile);

// ---------------------------------------------------------------------------
// Periksa apakah skema yang dipakai endpoint sudah ada di database.
// Kolom yang hilang = HTTP 500 "Terjadi kesalahan pada server".
// ---------------------------------------------------------------------------
echo "\n=== CEK SKEMA (baca saja, tidak mengubah data) ===\n";
require_once __DIR__ . '/../config/database.php';
try {
    $db = getDB();
    $cols = $db->query("SHOW COLUMNS FROM pesan_bk")->fetchAll();
    $have = array_column($cols, 'Field');
    $need = ['ringkasan', 'tingkat_kesulitan', 'kategori', 'butuh_perhatian', 'transkrip', 'device_id'];
    echo 'kolom pesan_bk : ' . implode(', ', $have) . "\n";
    foreach ($need as $c) {
        echo '  ' . str_pad($c, 18) . (in_array($c, $have, true) ? 'ADA' : 'HILANG  <-- perlu migration') . "\n";
    }
    $idx = $db->query("SHOW INDEX FROM pesan_bk")->fetchAll();
    $names = array_values(array_unique(array_column($idx, 'Key_name')));
    echo 'index          : ' . implode(', ', $names) . "\n";
} catch (Throwable $e) {
    echo 'GAGAL -> ' . $e->getMessage() . "\n";
}