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
  $statusRaw = $b['status_terakhir'] !== null ? (string)$b['status_terakhir'] : null;
  $top[] = [
    'pertanyaan' => (string)($b['pertanyaan'] ?? ''),
    'jumlah' => (int)($b['jumlah'] ?? 0),
    'kategori' => $b['kategori'] !== null ? (string)$b['kategori'] : null,
    'statusTerakhir' => $statusRaw,
    // Label dua status yang dipakai UI: "Terjawab" vs
    // "Tidak Terjawab/AI butuh info lebih lanjut".
    'statusLabel' => chatStatusLabel($statusRaw),
    'terakhir' => (string)($b['terakhir'] ?? ''),
  ];
}
// Balasan bot yang butuh bantuan manusia / info lebih lanjut.
$tidakTerjawab = $punyaKolom['status_resolusi'] ? (int) queryScalar($db,
  "SELECT COUNT(*) FROM chat_messages WHERE sender='bot'"
  . " AND status_resolusi IN ('escalated','unanswered') AND DATE(created_at) BETWEEN ? AND ?",
  [$dari, $sampai]) : 0;
// Aktivitas notifikasi otomatis Chatbot-BK + status antrean BK.
$chatbotBK = bkWaAnalytics($db, $dari, $sampai);
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
    'terjawab' => $dijawab,
    'tidakTerjawab' => $tidakTerjawab,
    'persenTerjawab' => $totalBot > 0 ? round($dijawab / $totalBot * 100) : 0,
    'persenTidakTerjawab' => $totalBot > 0 ? round($tidakTerjawab / $totalBot * 100) : 0,
  ],
  'tren' => $tren,
  'kategori' => $kategori,
  'sentimen' => $sentimen,
  'top' => $top,
  'chatbotBK' => $chatbotBK,
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

/**
 * Label status dua-kolom untuk tabel "Top Pertanyaan".
 *
 * resolved  -> "Terjawab"
 * escalated -> "Tidak Terjawab/AI butuh info lebih lanjut"
 * unanswered-> "Tidak Terjawab/AI butuh info lebih lanjut"
 * NULL/tidak dikenal -> "Belum ada status" (data lama belum diklasifikasi).
 */
function chatStatusLabel(?string $status): string
{
  if ($status === null || $status === '') { return 'Belum ada status'; }
  return $status === 'resolved'
    ? 'Terjawab'
    : 'Tidak Terjawab/AI butuh info lebih lanjut';
}

/**
 * Analytics notifikasi otomatis Chatbot-BK (WhatsApp ke Guru BK).
 *
 * Sumber data nyata:
 *  - bk_wa_alert  : jejak setiap percobaan kirim (status Terkirim/Gagal/Dilewati).
 *  - pesan_bk     : antrean laporan BK (aktif / perlu intervensi / ditangani).
 *
 * Tabel bk_wa_alert belum ada (migration belum jalan) = semua angka nol,
 * bukan error; halaman tetap bisa dirender.
 *
 * @return array<string, mixed>
 */
function bkWaAnalytics(PDO $db, string $dari, string $sampai): array
{
  $hasil = [
    'pengirim' => WA_BRAND_NAME,
    'totalNotifikasi' => 0,
    'terkirim' => 0,
    'gagal' => 0,
    'dilewati' => 0,
    'terakhirKirim' => null,
    'terakhirStatus' => null,
    'laporanAktif' => 0,
    'perluIntervensi' => 0,
    'sudahDitangani' => 0,
    'ambang' => 0,
    'aktif' => false,
    // Riwayat entri otomatis (jejak bk_wa_alert terbaru pada periode).
    'riwayat' => [],
  ];

  // Konfigurasi aktif + ambang eskalasi (aman bila tabel belum ada).
  try {
    $setting = waGetSetting($db);
    $hasil['ambang'] = (int) $setting['threshold'];
    $hasil['aktif'] = (bool) $setting['aktif'];
  } catch (Throwable $e) {
    error_log('[SMKN24] Gagal membaca konfigurasi WA pada analytics: ' . $e->getMessage());
  }

  // Jejak pengiriman pada periode.
  try {
    $stmt = $db->prepare(
      "SELECT status, COUNT(*) AS jumlah, MAX(created_at) AS terakhir FROM bk_wa_alert
       WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY status"
    );
    $stmt->execute([$dari, $sampai]);
    foreach ($stmt->fetchAll() as $b) {
      $jumlah = (int)($b['jumlah'] ?? 0);
      $hasil['totalNotifikasi'] += $jumlah;
      $status = (string)($b['status'] ?? '');
      if ($status === 'Terkirim') { $hasil['terkirim'] += $jumlah; }
      elseif ($status === 'Gagal') { $hasil['gagal'] += $jumlah; }
      else { $hasil['dilewati'] += $jumlah; }
    }
  } catch (Throwable $e) {
    error_log('[SMKN24] Gagal membaca bk_wa_alert pada analytics: ' . $e->getMessage());
  }

  // Notifikasi terakhir (terkirim/gagal) — lintas periode, ini aktivitas terakhir.
  try {
    $stmt = $db->query(
      "SELECT MAX(created_at) AS terakhir,
              SUBSTRING_INDEX(GROUP_CONCAT(status ORDER BY created_at DESC), ',', 1) AS status_terakhir
       FROM bk_wa_alert WHERE status IN ('Terkirim','Gagal')"
    );
    $row = $stmt ? $stmt->fetch() : false;
    if (is_array($row)) {
      $hasil['terakhirKirim'] = $row['terakhir'] ?? null;
      $hasil['terakhirStatus'] = $row['status_terakhir'] ?? null;
    }
  } catch (Throwable $e) {
    error_log('[SMKN24] Gagal membaca aktivitas WA terakhir: ' . $e->getMessage());
  }

  // Riwayat entri otomatis (10 terakhir pada periode) — sumber untuk
  // panel "Riwayat Chatbot-BK" di halaman Riwayat Chatbot.
  try {
    $stmt = $db->prepare(
      'SELECT id, jumlah_laporan, target, pesan, status, error, created_at
       FROM bk_wa_alert WHERE DATE(created_at) BETWEEN ? AND ?
       ORDER BY created_at DESC, id DESC LIMIT 10'
    );
    $stmt->execute([$dari, $sampai]);
    foreach ($stmt->fetchAll() as $b) {
      $hasil['riwayat'][] = [
        'id' => (int)($b['id'] ?? 0),
        'jumlahLaporan' => (int)($b['jumlah_laporan'] ?? 0),
        'target' => (string)($b['target'] ?? ''),
        'pesan' => (string)($b['pesan'] ?? ''),
        'status' => (string)($b['status'] ?? ''),
        'error' => $b['error'] !== null ? (string)$b['error'] : null,
        'tanggal' => (string)($b['created_at'] ?? ''),
      ];
    }
  } catch (Throwable $e) {
    error_log('[SMKN24] Gagal membaca riwayat WA pada analytics: ' . $e->getMessage());
  }

  // Status antrean laporan BK (sumber data yang sama dengan pesan WhatsApp).
  try {
    $stmt = $db->query(
      "SELECT
         SUM(CASE WHEN status <> 'Selesai' THEN 1 ELSE 0 END) AS aktif,
         SUM(CASE WHEN status <> 'Selesai'
                   AND (butuh_perhatian = 1 OR tingkat_kesulitan = 'Berat')
                  THEN 1 ELSE 0 END) AS perlu,
         SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS ditangani
       FROM pesan_bk"
    );
    $row = $stmt ? $stmt->fetch() : false;
    if (is_array($row)) {
      $hasil['laporanAktif'] = (int)($row['aktif'] ?? 0);
      $hasil['perluIntervensi'] = (int)($row['perlu'] ?? 0);
      $hasil['sudahDitangani'] = (int)($row['ditangani'] ?? 0);
    }
  } catch (Throwable $e) {
    error_log('[SMKN24] Gagal membaca antrean BK pada analytics: ' . $e->getMessage());
  }

  return $hasil;
}

