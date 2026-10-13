<?php
/**
 * GET /api/chat/analytics.php?dari=YYYY-MM-DD&sampai=YYYY-MM-DD (admin)
 * Agregasi telemetri chatbot: metrik, tren, kategori, sentimen, top-10.
 * Selalu 200 walau data nol. Tahan migration belum jalan (kolom dianggap NULL).
 */
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');
requireAuth();
[$dari, $sampai] = resolvePeriode($_GET['dari'] ?? null, $_GET['sampai'] ?? null);
$db = getDB();
$punyaKolom = chatAnalyticsColumns($db);
$totalSesi = (int) queryScalar($db,
  'SELECT COUNT(*) FROM chat_sessions WHERE DATE(created_at) BETWEEN ? AND ?',
  [$dari, $sampai]);
$aktifHariIni = (int) queryScalar($db,
  'SELECT COUNT(*) FROM chat_sessions WHERE DATE(created_at) = CURDATE()');
$totalUser = (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]);
$totalBot = (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]);
$dijawab = $punyaKolom['status_resolusi'] ? (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND status_resolusi='resolved' AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]) : 0;
$eskalasi = $punyaKolom['status_resolusi'] ? (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot' AND status_resolusi='escalated' AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]) : 0;
$luarKonteks = $punyaKolom['di_luar_konteks'] ? (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='user' AND di_luar_konteks=1 AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]) : 0;
$trenStmt = $db->prepare(
  'SELECT DATE(created_at) AS tanggal, COUNT(*) AS sesi FROM chat_sessions'
  . ' WHERE DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at) ORDER BY tanggal ASC');
$trenStmt->execute([$dari, $sampai]);
$tren = [];
foreach ($trenStmt->fetchAll() as $b) {
  $tren[] = ['tanggal' => (string)($b['tanggal'] ?? ''), 'sesi' => (int)($b['sesi'] ?? 0)];
}
$kategori = [];
if ($punyaKolom['kategori']) {
  $katStmt = $db->prepare(
    "SELECT COALESCE(kategori,'Lainnya') AS kategori, COUNT(*) AS jumlah FROM chat_messages"
    . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?"
    . " GROUP BY COALESCE(kategori,'Lainnya') ORDER BY jumlah DESC");
  $katStmt->execute([$dari, $sampai]);
  foreach ($katStmt->fetchAll() as $b) {
    $kategori[] = ['kategori' => (string)($b['kategori'] ?? 'Lainnya'), 'jumlah' => (int)($b['jumlah'] ?? 0)];
  }
}
$sentimen = ['positif' => 0, 'netral' => 0, 'negatif' => 0];
if ($punyaKolom['sentimen']) {
  $senStmt = $db->prepare(
    "SELECT COALESCE(sentimen,'netral') AS sentimen, COUNT(*) AS jumlah FROM chat_messages"
    . " WHERE sender='user' AND DATE(created_at) BETWEEN ? AND ?"
    . " GROUP BY COALESCE(sentimen,'netral')");
  $senStmt->execute([$dari, $sampai]);
  foreach ($senStmt->fetchAll() as $b) {
    $k = (string)($b['sentimen'] ?? 'netral');
    if (array_key_exists($k, $sentimen)) { $sentimen[$k] = (int)($b['jumlah'] ?? 0); }
  }
}
$topStmt = $db->prepare(
  'SELECT m.text AS pertanyaan, COUNT(*) AS jumlah, MAX(m.created_at) AS terakhir'
  . ($punyaKolom['kategori'] ? ', MAX(m.kategori) AS kategori' : ', NULL AS kategori')
  . ($punyaKolom['status_resolusi']
      ? ", (SELECT b.status_resolusi FROM chat_messages b WHERE b.session_id=m.session_id AND b.sender='bot' ORDER BY b.id DESC LIMIT 1) AS status_terakhir"
      : ', NULL AS status_terakhir')
  . " FROM chat_messages m WHERE m.sender='user' AND DATE(m.created_at) BETWEEN ? AND ?"
  . ' GROUP BY m.text ORDER BY jumlah DESC, terakhir DESC LIMIT 10');
$topStmt->execute([$dari, $sampai]);
$top = [];
foreach ($topStmt->fetchAll() as $b) {
  $top[] = [
    'pertanyaan' => (string)($b['pertanyaan'] ?? ''),
    'jumlah' => (int)($b['jumlah'] ?? 0),
    'kategori' => $b['kategori'] !== null ? (string)$b['kategori'] : null,
    'statusTerakhir' => $b['status_terakhir'] !== null ? (string)$b['status_terakhir'] : null,
    'terakhir' => (string)($b['terakhir'] ?? ''),
  ];
}
jsonResponse([
  'periode' => ['dari' => $dari, 'sampai' => $sampai],
  'metrik' => [
    'totalSesi' => $totalSesi,
    'aktifHariIni' => $aktifHariIni,
    'totalPertanyaan' => $totalUser,
    'totalJawaban' => $totalBot,
    'dijawab' => $dijawab,
    'persenDijawab' => $totalBot > 0 ? round($dijawab / $totalBot * 100) : 0,
    'eskalasi' => $eskalasi,
    'persenEskalasi' => $totalBot > 0 ? round($eskalasi / $totalBot * 100) : 0,
    'luarKonteks' => $luarKonteks,
    'persenLuarKonteks' => $totalUser > 0 ? round($luarKonteks / $totalUser * 100) : 0,
  ],
  'tren' => $tren,
  'kategori' => $kategori,
  'sentimen' => $sentimen,
  'top' => $top,
]);
/** Periode YYYY-MM-DD; default 7 hari terakhir, maksimal 93 hari. */
function resolvePeriode($dariRaw, $sampaiRaw): array
{
  $hariIni = new DateTimeImmutable('today');
  $sampai = parseTanggal($sampaiRaw) ?? $hariIni;
  $dari = parseTanggal($dariRaw) ?? $hariIni->modify('-6 days');
  if ($dari > $sampai) { [$dari, $sampai] = [$sampai, $dari]; }
  if ($dari->diff($sampai)->days > 93) { jsonError('Rentang periode maksimal 93 hari.', 400); }
  return [$dari->format('Y-m-d'), $sampai->format('Y-m-d')];
}
function parseTanggal($raw): ?DateTimeImmutable
{
  if (!is_string($raw) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) { return null; }
  try { $dt = new DateTimeImmutable($raw); }
  catch (Throwable $e) { return null; }
  return $dt->format('Y-m-d') === $raw ? $dt : null;
}
/** Satu nilai skalar COUNT(*) agar int casting konsisten. */
function queryScalar(PDO $db, string $sql, array $params = []): string
{
  $stmt = $db->prepare($sql);
  $stmt->execute($params);
  $val = $stmt->fetchColumn();
  return $val === false || $val === null ? '0' : (string)$val;
}
/** Kolom telemetri mana yang sudah ada; belum migration = semua false. */
function chatAnalyticsColumns(PDO $db): array
{
  try {
    $stmt = $db->prepare('SELECT COLUMN_NAME FROM information_schema.COLUMNS'
      . ' WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
    $stmt->execute(['chat_messages']);
    $ada = [];
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $nama) { $ada[(string)$nama] = true; }
    return [
      'kategori' => isset($ada['kategori']),
      'sentimen' => isset($ada['sentimen']),
      'di_luar_konteks' => isset($ada['di_luar_konteks']),
      'status_resolusi' => isset($ada['status_resolusi']),
    ];
  } catch (Throwable $e) {
    return ['kategori' => false, 'sentimen' => false, 'di_luar_konteks' => false, 'status_resolusi' => false];
  }
}

