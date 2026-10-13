<?php
/**
 * /api/chat/insights.php (admin, JWT)
 * GET  -> daftar insight aktif (status=baru) + yang selesai/diabaikan (20 terakhir)
 * POST -> generate insight baru: { "periode": "7"|"30" }
 * PUT  -> ubah status: { "id": n, "status": "baru"|"selesai"|"diabaikan" }
 * Generate memakai LLM yang sama dengan chatbot (prompt khusus Bahasa
 * Indonesia, output JSON). Bila provider belum dikonfigurasi / gagal,
 * fallback heuristik dari agregasi analytics tetap disimpan (sumber=heuristik)
 * supaya halaman tidak kosong. generate dicatat ke chat_analytics_log.
 */
require_once __DIR__ . '/../../bootstrap.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  requireAuth();
  ensureInsightTables($db);
  $aktif = $db->query(
    "SELECT * FROM chat_insights WHERE status='baru' ORDER BY created_at DESC LIMIT 20"
  )->fetchAll();
  $riwayat = $db->query(
    "SELECT * FROM chat_insights WHERE status<>'baru' ORDER BY created_at DESC LIMIT 20"
  )->fetchAll();
  jsonResponse(['aktif' => array_map('formatInsight', $aktif), 'riwayat' => array_map('formatInsight', $riwayat)]);
}
if ($method === 'PUT') {
  requireAuth();
  ensureInsightTables($db);
  $body = getJsonBody();
  $id = (int)($body['id'] ?? 0);
  $status = (string)($body['status'] ?? '');
  if ($id <= 0) { jsonError("Field 'id' wajib diisi.", 400); }
  if (!in_array($status, ['baru', 'selesai', 'diabaikan'], true)) {
    jsonError("Field 'status' harus baru|selesai|diabaikan.", 400);
  }
  $upd = $db->prepare('UPDATE chat_insights SET status=? WHERE id=?');
  $upd->execute([$status, $id]);
  if ($upd->rowCount() === 0) { jsonError('Insight tidak ditemukan.', 404); }
  jsonResponse(['ok' => true]);
}
if ($method !== 'POST') { jsonError('Method tidak diizinkan, gunakan GET/POST/PUT', 405); }
requireAuth();
ensureInsightTables($db);
$body = getJsonBody();
$hari = (string)($body['periode'] ?? '7');
if (!in_array($hari, ['7', '30'], true)) { jsonError("Field 'periode' harus 7|30.", 400); }
$sampai = new DateTimeImmutable('today');
$dari = $sampai->modify('-' . ((int)$hari - 1) . ' days');
$ringkas = buildInsightSummary($db, $dari->format('Y-m-d'), $sampai->format('Y-m-d'));
$insights = tryLlmInsights($ringkas);
$sumber = 'ai';
if ($insights === null) {
  $insights = heuristicInsights($ringkas);
  $sumber = 'heuristik';
}
$tersimpan = [];
foreach (array_slice($insights, 0, 5) as $ins) {
  $tipe = in_array($ins['tipe'] ?? '', ['tren', 'konten_kurang', 'rekomendasi', 'teknis', 'faq'], true)
    ? $ins['tipe'] : 'rekomendasi';
  $judul = chatCut(trim((string)($ins['judul'] ?? '')), 255);
  $isi = trim((string)($ins['isi'] ?? ''));
  if ($judul === '' || $isi === '') { continue; }
  $stmt = $db->prepare(
    'INSERT INTO chat_insights (tipe, judul, isi, sumber, periode_mulai, periode_selesai) VALUES (?,?,?,?,?,?)');
  $stmt->execute([$tipe, $judul, $isi, $sumber, $dari->format('Y-m-d'), $sampai->format('Y-m-d')]);
  $tersimpan[] = formatInsight([
    'id' => (int)$db->lastInsertId(), 'tipe' => $tipe, 'judul' => $judul, 'isi' => $isi,
    'sumber' => $sumber, 'periode_mulai' => $dari->format('Y-m-d'),
    'periode_selesai' => $sampai->format('Y-m-d'), 'status' => 'baru',
    'created_at' => date('Y-m-d H:i:s'),
  ]);
}
logAnalytics($db, 'generate_insight', "periode={$hari}h sumber={$sumber} n=" . count($tersimpan));
jsonResponse(['insights' => $tersimpan, 'sumber' => $sumber]);
/** Buat tabel bila migration belum dijalankan (aman diulang). */
function ensureInsightTables(PDO $db): void
{
  $db->exec("CREATE TABLE IF NOT EXISTS chat_insights ("
    . "id INT AUTO_INCREMENT PRIMARY KEY,"
    . "tipe ENUM('tren','konten_kurang','rekomendasi','teknis','faq') NOT NULL,"
    . "judul VARCHAR(255) NOT NULL, isi TEXT NOT NULL,"
    . "sumber ENUM('ai','heuristik') NOT NULL DEFAULT 'heuristik',"
    . "periode_mulai DATE NULL, periode_selesai DATE NULL,"
    . "status ENUM('baru','selesai','diabaikan') NOT NULL DEFAULT 'baru',"
    . "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    . "KEY idx_chat_insights_status (status)) ENGINE=InnoDB");
  $db->exec("CREATE TABLE IF NOT EXISTS chat_analytics_log ("
    . "id INT AUTO_INCREMENT PRIMARY KEY,"
    . "aksi ENUM('generate_insight','export_csv','export_pdf') NOT NULL,"
    . "detail VARCHAR(255) NOT NULL DEFAULT '',"
    . "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    . "KEY idx_chat_analytics_log_aksi (aksi)) ENGINE=InnoDB");
}
function formatInsight(array $r): array
{
  return [
    'id' => (int)($r['id'] ?? 0), 'tipe' => (string)($r['tipe'] ?? 'rekomendasi'),
    'judul' => (string)($r['judul'] ?? ''), 'isi' => (string)($r['isi'] ?? ''),
    'sumber' => (string)($r['sumber'] ?? 'heuristik'),
    'periodeMulai' => $r['periode_mulai'] ?? null, 'periodeSelesai' => $r['periode_selesai'] ?? null,
    'status' => (string)($r['status'] ?? 'baru'), 'createdAt' => (string)($r['created_at'] ?? ''),
  ];
}
function logAnalytics(PDO $db, string $aksi, string $detail): void
{
  try {
    $stmt = $db->prepare('INSERT INTO chat_analytics_log (aksi, detail) VALUES (?,?)');
    $stmt->execute([$aksi, chatCut($detail, 255)]);
  } catch (Throwable $e) { error_log('[SMKN24] Log analytics dilewati: ' . $e->getMessage()); }
}
/** Ringkasan agregat periode untuk prompt LLM maupun fallback heuristik. */
function buildInsightSummary(PDO $db, string $dari, string $sampai): array
{
  $cols = [];
  try {
    $c = $db->prepare('SELECT COLUMN_NAME FROM information_schema.COLUMNS'
      . ' WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
    $c->execute(['chat_messages']);
    foreach ($c->fetchAll(PDO::FETCH_COLUMN) as $n) { $cols[(string)$n] = true; }
  } catch (Throwable $e) { /* tanpa telemetri: agregat dasar saja */ }
  $scalar = function (string $sql) use ($db, $dari, $sampai): int {
    $s = $db->prepare($sql);
    $s->execute([$dari, $sampai]);
    return (int)($s->fetchColumn() ?: 0);
  };
  $ringkas = [
    'periode' => "$dari s.d. $sampai",
    'totalSesi' => $scalar('SELECT COUNT(*) FROM chat_sessions WHERE DATE(created_at) BETWEEN ? AND ?'),
    'totalPertanyaan' => $scalar(
      "SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?"),
    'kategori' => [], 'sentimen' => [], 'top' => [],
    'eskalasi' => 0, 'luarKonteks' => 0, 'negatif' => 0,
  ];
  if (isset($cols['kategori'])) {
    $s = $db->prepare("SELECT COALESCE(kategori,'Lainnya') k, COUNT(*) n FROM chat_messages"
      . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ? GROUP BY k ORDER BY n DESC LIMIT 6");
    $s->execute([$dari, $sampai]);
    foreach ($s->fetchAll() as $b) { $ringkas['kategori'][] = ['nama' => (string)$b['k'], 'n' => (int)$b['n']]; }
  }
  if (isset($cols['sentimen'])) {
    $s = $db->prepare("SELECT COALESCE(sentimen,'netral') k, COUNT(*) n FROM chat_messages"
      . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ? GROUP BY k");
    $s->execute([$dari, $sampai]);
    foreach ($s->fetchAll() as $b) {
      $ringkas['sentimen'][(string)$b['k']] = (int)$b['n'];
      if ((string)$b['k'] === 'negatif') { $ringkas['negatif'] = (int)$b['n']; }
    }
  }
  if (isset($cols['di_luar_konteks'])) {
    $ringkas['luarKonteks'] = $scalar(
      "SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND di_luar_konteks=1 AND DATE(created_at) BETWEEN ? AND ?");
  }
  if (isset($cols['status_resolusi'])) {
    $ringkas['eskalasi'] = $scalar(
      "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND status_resolusi='escalated' AND DATE(created_at) BETWEEN ? AND ?");
  }
  $s = $db->prepare('SELECT text t, COUNT(*) n FROM chat_messages'
    . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ? GROUP BY text ORDER BY n DESC LIMIT 10");
  $s->execute([$dari, $sampai]);
  foreach ($s->fetchAll() as $b) {
    $ringkas['top'][] = ['tanya' => chatCut((string)$b['t'], 160), 'n' => (int)$b['n']];
  }
  return $ringkas;
}
/** Coba generate via LLM; null bila provider tidak siap / gagal / JSON rusak. */
function tryLlmInsights(array $ringkas): ?array
{
  if (!aiProviderConfigured(aiFeatureOptions('content'))) {
    error_log('[SMKN24] Insight AI dilewati: API key provider belum diisi di .env.');
    return null;
  }
  $prompt = "Kamu analis data website SMKN 24 Jakarta. Dari ringkasan analytics chatbot berikut,"
    . " susun 3-5 insight ringkas dalam Bahasa Indonesia yang actionable untuk admin sekolah.\n"
    . "Ringkasan: " . json_encode($ringkas, JSON_UNESCAPED_UNICODE) . "\n"
    . "Aturan: tiap insight bertipe salah satu tren|konten_kurang|rekomendasi|teknis|faq;"
    . " judul maks 80 karakter; isi 1-3 kalimat konkret (sebut angka bila ada)."
    . " Jangan mengarang data di luar ringkasan."
    . " Kembalikan HANYA array JSON: [{\"tipe\":\"...\",\"judul\":\"...\",\"isi\":\"...\"}].";
  try {
    $raw = callAiProvider(
      [['role' => 'user', 'content' => $prompt]],
      array_merge(aiFeatureOptions('content'), ['max_tokens' => 1200, 'temperature' => 0.4]));
    $parsed = extractJsonObject($raw);
  } catch (Throwable $e) {
    error_log('[SMKN24] Insight AI gagal: ' . $e->getMessage());
    return null;
  }
  if (!is_array($parsed)) { return null; }
  // Model kadang membungkus array dalam objek — terima kedua bentuk.
  $items = array_is_list($parsed) ? $parsed : ($parsed['insights'] ?? null);
  if (!is_array($items) || $items === []) { return null; }
  $valid = [];
  foreach ($items as $it) {
    if (!is_array($it)) { continue; }
    if (trim((string)($it['judul'] ?? '')) === '' || trim((string)($it['isi'] ?? '')) === '') { continue; }
    $valid[] = ['tipe' => (string)($it['tipe'] ?? 'rekomendasi'),
      'judul' => (string)$it['judul'], 'isi' => (string)$it['isi']];
  }
  return $valid === [] ? null : $valid;
}
/** Fallback tanpa LLM: aturan sederhana dari agregasi (contoh PRD §11). */
function heuristicInsights(array $ringkas): array
{
  $out = [];
  if (!empty($ringkas['kategori'])) {
    $top = $ringkas['kategori'][0];
    $out[] = ['tipe' => 'tren',
      'judul' => "Topik teratas: {$top['nama']} ({$top['n']} pertanyaan)",
      'isi' => "Kategori {$top['nama']} paling sering ditanyakan pada periode {$ringkas['periode']}."
        . " Pastikan info terkait mudah ditemukan di website."];
  }
  if ($ringkas['eskalasi'] > 0) {
    $out[] = ['tipe' => 'konten_kurang',
      'judul' => "{$ringkas['eskalasi']} jawaban diteruskan ke manusia",
      'isi' => "Sebanyak {$ringkas['eskalasi']} balasan bot berujung eskalasi."
        . " Periksa pertanyaan pemicunya dan lengkapi konten/FAQ terkait."];
  }
  if ($ringkas['luarKonteks'] > 0) {
    $out[] = ['tipe' => 'teknis',
      'judul' => "{$ringkas['luarKonteks']} pertanyaan di luar konteks",
      'isi' => "Filter konteks menolak {$ringkas['luarKonteks']} pertanyaan."
        . " Bila topiknya berulang dan relevan, pertimbangkan memperluas cakupan jawaban."];
  }
  if ($ringkas['negatif'] > 0) {
    $out[] = ['tipe' => 'teknis',
      'judul' => "{$ringkas['negatif']} pesan bernada negatif",
      'isi' => "Ada {$ringkas['negatif']} pesan user bernada negatif pada periode ini."
        . " Tinjau balasan bot pada sesi tersebut untuk perbaikan."];
  }
  if (!empty($ringkas['top'])) {
    $t = $ringkas['top'][0];
    $out[] = ['tipe' => 'faq',
      'judul' => "Kandidat FAQ: \"{$t['tanya']}\" ({$t['n']}x)",
      'isi' => "Pertanyaan ini muncul {$t['n']} kali. Jadikan FAQ atau pengumuman"
        . " agar chatbot dan pengunjung terbantu."];
  }
  if ($out === []) {
    $out[] = ['tipe' => 'rekomendasi',
      'judul' => "Belum cukup data ({$ringkas['totalSesi']} sesi)",
      'isi' => "Chatbot mencatat {$ringkas['totalSesi']} sesi pada periode {$ringkas['periode']}."
        . " Insight akan lebih kaya setelah chatbot lebih sering dipakai pengunjung."];
  }
  return $out;
}



