<?php
/**
 * GET /api/chat/export.php?dari=YYYY-MM-DD&sampai=YYYY-MM-DD (admin, JWT)
 * Export CSV ringkas analytics: metrik + top pertanyaan + kategori + tren.
 * Must-Have PRD §2.1. Export dicatat ke chat_analytics_log (PRD §5).
 */
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');
requireAuth();
$dari = $_GET['dari'] ?? null;
$sampai = $_GET['sampai'] ?? null;
if (!is_string($dari) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dari)) { $dari = date('Y-m-d', strtotime('-6 days')); }
if (!is_string($sampai) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $sampai)) { $sampai = date('Y-m-d'); }
if ($dari > $sampai) { [$dari, $sampai] = [$sampai, $dari]; }
$db = getDB();
$cols = [];
try {
  $c = $db->prepare('SELECT COLUMN_NAME FROM information_schema.COLUMNS'
    . ' WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
  $c->execute(['chat_messages']);
  foreach ($c->fetchAll(PDO::FETCH_COLUMN) as $n) { $cols[(string)$n] = true; }
} catch (Throwable $e) { /* agregat dasar saja */ }
$scalar = function (string $sql) use ($db, $dari, $sampai): int {
  $s = $db->prepare($sql);
  $s->execute([$dari, $sampai]);
  return (int)($s->fetchColumn() ?: 0);
};
$totalSesi = $scalar('SELECT COUNT(*) FROM chat_sessions WHERE DATE(created_at) BETWEEN ? AND ?');
$totalUser = $scalar("SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?");
$totalBot = $scalar("SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND DATE(created_at) BETWEEN ? AND ?");
$dijawab = isset($cols['status_resolusi']) ? $scalar(
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND status_resolusi='resolved' AND DATE(created_at) BETWEEN ? AND ?") : 0;
$eskalasi = isset($cols['status_resolusi']) ? $scalar(
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND status_resolusi='escalated' AND DATE(created_at) BETWEEN ? AND ?") : 0;
$luarKonteks = isset($cols['di_luar_konteks']) ? $scalar(
  "SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND di_luar_konteks=1 AND DATE(created_at) BETWEEN ? AND ?") : 0;
/** Baris CSV: [seksi, kolom1, kolom2, kolom3]. */
$baris = [];
$baris[] = ['METRIK', 'Nilai', '', ''];
$baris[] = ['Periode', $dari, $sampai, ''];
$baris[] = ['Total sesi', (string)$totalSesi, '', ''];
$baris[] = ['Total pertanyaan user', (string)$totalUser, '', ''];
$baris[] = ['Total jawaban bot', (string)$totalBot, '', ''];
$baris[] = ['Dijawab', (string)$dijawab, '', ''];
$baris[] = ['Eskalasi ke manusia', (string)$eskalasi, '', ''];
$baris[] = ['Di luar konteks', (string)$luarKonteks, '', ''];
$baris[] = ['', '', '', ''];
$baris[] = ['TOP PERTANYAAN', 'Jumlah', 'Kategori', 'Status terakhir'];
$topSql = 'SELECT text t, COUNT(*) n'
  . (isset($cols['kategori']) ? ', MAX(kategori) k' : ', NULL k')
  . " FROM chat_messages WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?"
  . ' GROUP BY text ORDER BY n DESC LIMIT 50';
$topStmt = $db->prepare($topSql);
$topStmt->execute([$dari, $sampai]);
foreach ($topStmt->fetchAll() as $b) {
  $baris[] = [chatCut((string)$b['t'], 300), (string)(int)$b['n'],
    isset($cols['kategori']) && $b['k'] !== null ? (string)$b['k'] : '', ''];
}
$baris[] = ['', '', '', ''];
$baris[] = ['KATEGORI', 'Jumlah', '', ''];
if (isset($cols['kategori'])) {
  $kStmt = $db->prepare("SELECT COALESCE(kategori,'Lainnya') k, COUNT(*) n FROM chat_messages"
    . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ? GROUP BY k ORDER BY n DESC");
  $kStmt->execute([$dari, $sampai]);
  foreach ($kStmt->fetchAll() as $b) {
    $baris[] = [(string)$b['k'], (string)(int)$b['n'], '', ''];
  }
}
$baris[] = ['', '', '', ''];
$baris[] = ['TREN HARIAN', 'Sesi', '', ''];
$tStmt = $db->prepare('SELECT DATE(created_at) t, COUNT(*) n FROM chat_sessions'
  . ' WHERE DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at) ORDER BY t ASC');
$tStmt->execute([$dari, $sampai]);
foreach ($tStmt->fetchAll() as $b) {
  $baris[] = [(string)$b['t'], (string)(int)$b['n'], '', ''];
}
try {
  $log = $db->prepare('INSERT INTO chat_analytics_log (aksi, detail) VALUES (?,?)');
  $log->execute(['export_csv', "periode={$dari}..{$sampai}"]);
} catch (Throwable $e) { /* tabel log belum ada: export tetap jalan */ }
$nama = "chatbot-analytics-{$dari}_{$sampai}.csv";
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $nama . '"');
$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel tampil benar
foreach ($baris as $r) { fputcsv($out, $r); }
fclose($out);
exit;

