<?php
/**
 * Uji retrieval knowledge dengan fungsi yang SAMA dipakai chatbot.
 *
 * Baca saja (SELECT), tanpa mengubah data, tanpa memanggil provider AI.
 * Dulu file ini menduplikasi pipeline FULLTEXT lama; sekarang ia memanggil
 * `toolCariPengetahuanData()` dari helpers/chat_tools.php supaya hasil uji
 * tidak pernah berbeda dari produksi.
 *
 * Pakai:
 *   php backend/tools/test-knowledge-retrieval.php "berapa biaya sekolah?"
 *   php backend/tools/test-knowledge-retrieval.php --fallback
 *   php backend/tools/test-knowledge-retrieval.php --pii
 *   php backend/tools/test-knowledge-retrieval.php --json "aturan tata tertib"
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/chat_tools.php';

$json = in_array('--json', $argv, true);
$fallback = in_array('--fallback', $argv, true);
$pii = in_array('--pii', $argv, true);
$pesan = '';
foreach (array_slice($argv, 1) as $arg) {
    if (!str_starts_with($arg, '--')) {
        $pesan = $arg;
        break;
    }
}

try {
    $db = getDB();
    $db->query('SELECT 1 FROM knowledge LIMIT 1');
} catch (PDOException $e) {
    fwrite(STDERR, "Tabel knowledge tidak siap: " . $e->getMessage() . "\n");
    fwrite(STDERR, "Jalankan dulu backend/migrations/20261006_add_chat_knowledge.sql "
        . "lewat phpMyAdmin (setelah backup).\n");
    exit(1);
}

if ($pii) {
    $stmt = $db->query('SELECT id, judul, kategori, konten, updated_at FROM knowledge ORDER BY id');
    $rows = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        if (!toolKnowledgePiiRisk((string) $r['judul'], (string) $r['konten'])) {
            continue;
        }
        $rows[] = [
            'id' => (int) $r['id'],
            'judul' => (string) $r['judul'],
            'kategori' => (string) $r['kategori'],
            'potongan' => mb_substr(toolStripHtml((string) $r['konten']), 0, 220, 'UTF-8'),
            'updated_at' => $r['updated_at'],
        ];
    }

    if ($json) {
        echo json_encode([
            'total' => count($rows),
            'pii' => $rows,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
        exit(0);
    }

    echo "Baris knowledge yang terdeteksi PII (tidak dipakai chatbot): " . count($rows) . "\n";
    foreach ($rows as $r) {
        echo "- #{$r['id']} [{$r['kategori']}] {$r['judul']}\n";
        echo "  {$r['potongan']}\n";
    }
    echo "\nHapus/ringkas baris di atas dari dashboard admin. Baris ini sudah "
        . "otomatis dikecualikan dari retrieval chatbot.\n";
    exit(0);
}

if ($fallback) {
    $stmt = $db->query(
        "SELECT id, judul, kategori, LEFT(konten, 220) AS potongan, updated_at
         FROM knowledge
         WHERE konten LIKE '%belum tersedia%'
            OR konten LIKE '%tidak tersedia%'
            OR konten LIKE '%data saya%'
         ORDER BY updated_at DESC, id DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($json) {
        echo json_encode([
            'total' => count($rows),
            'fallback' => $rows,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
        exit(0);
    }

    echo "Baris knowledge yang masih berisi kalimat fallback: " . count($rows) . "\n";
    foreach ($rows as $r) {
        echo "- #{$r['id']} [{$r['kategori']}] {$r['judul']}\n";
        echo "  {$r['potongan']}\n";
    }
    exit(0);
}

if ($pesan === '') {
    $pesan = 'Bagaimana cara mendaftar PPDB?';
}

$t0 = microtime(true);
$rows = toolCariPengetahuanData($db, ['kata' => $pesan, 'batas' => 8]);
$terms = toolKnowledgeSearchTerms($pesan);
$baris = toolFormatPengetahuanRows($rows, $terms);
$ms = round((microtime(true) - $t0) * 1000);

if ($json) {
    echo json_encode([
        'pesan' => $pesan,
        'latensi_ms' => $ms,
        'total' => count($rows),
        'hasil' => $rows,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
    exit(0);
}

echo "pesan  : {$pesan}\n";
echo "latensi: {$ms} ms\n";
echo "hasil  : " . count($rows) . " baris\n";
if ($baris === []) {
    echo "konteks: (kosong - chatbot akan menganggap data belum tersedia)\n";
} else {
    echo "konteks:\n";
    foreach ($baris as $line) {
        echo "- {$line}\n";
    }
}
