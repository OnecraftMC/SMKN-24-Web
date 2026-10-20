<?php
/**
 * GET    /api/bk/wa-config.php   -> baca konfigurasi WA Guru BK + jumlah laporan berat terbuka
 * POST   /api/bk/wa-config.php   -> simpan konfigurasi (target, aktif, threshold, provider)
 * POST   ?aksi=test              -> uji kirim WA paksa (abaikan ambang & cooldown)
 *
 * Hanya untuk admin (autentikasi JWT wajib).
 */

require_once __DIR__ . '/../../bootstrap.php';

requireAuth();

$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];
$aksi = $_GET['aksi'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        if ($aksi === 'test') {
            handleTest($db);
        } else {
            handleSave($db);
        }
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

/** Baca konfigurasi saat ini dan hitungan laporan berat terbuka. */
function handleGet(PDO $db): void
{
    $setting = waGetSetting($db);
    $jumlah = waCountHeavyOpen($db);

    jsonResponse([
        'target' => $setting['target'],
        'aktif' => (bool) $setting['aktif'],
        'threshold' => (int) $setting['threshold'],
        'provider' => $setting['provider'],
        'sumber' => $setting['sumber'],
        'jumlah_laporan_terbuka' => $jumlah,
    ]);
}

/** Simpan konfigurasi dari dashboard admin. */
function handleSave(PDO $db): void
{
    $body = getJsonBody();
    foreach (['target', 'aktif', 'threshold', 'provider'] as $f) {
        if (!array_key_exists($f, $body)) {
            jsonError("Field '$f' wajib diisi", 400);
        }
    }

    if (!in_array($body['provider'], ['fonnte', 'wablas'], true)) {
        jsonError('Provider tidak valid (fonnte atau wablas).', 400);
    }

    $setting = waSaveSetting($db, $body);

    jsonResponse([
        'message' => 'Konfigurasi WhatsApp Guru BK disimpan.',
        'target' => $setting['target'],
        'aktif' => (bool) $setting['aktif'],
        'threshold' => (int) $setting['threshold'],
        'provider' => $setting['provider'],
        'sumber' => $setting['sumber'],
    ]);
}

/** Uji kirim WhatsApp (paksa): abaikan ambang & cooldown, untuk demo/presentasi. */
function handleTest(PDO $db): void
{
    $setting = waGetSetting($db);

    if ($setting['target'] === '' || !waTargetValid($setting['target'])) {
        jsonError('Nomor tujuan belum dikonfigurasi atau tidak valid.', 400);
    }

    if (!waProviderConfigured()) {
        jsonError('WA_API_TOKEN belum diisi di .env backend. Gateway belum siap.', 400);
    }

    $jumlah = waCountHeavyOpen($db);
    $rows = [];
    try {
        $stmt = $db->query(
            "SELECT nama, kelas, ringkasan, tingkat_kesulitan, butuh_perhatian
             FROM pesan_bk
             WHERE (butuh_perhatian = 1 OR tingkat_kesulitan = 'Berat')
               AND status <> 'Selesai'
             ORDER BY butuh_perhatian DESC,
                      FIELD(IFNULL(tingkat_kesulitan, 'zzz'), 'Berat', 'Sedang', 'Ringan', 'zzz'),
                      tanggal DESC
             LIMIT " . max(1, (int) BK_WA_ALERT_MAX_CASES)
        );
        $rows = $stmt->fetchAll();
    } catch (Throwable $e) {
        error_log('[SMKN24] Gagal mengambil baris uji kirim WA: ' . $e->getMessage());
    }

    $message = waBuildMessage($rows, $jumlah, $setting['threshold']);
    $result = waSendMessage($setting['target'], $message, $setting['provider']);

    waLogAlert($db, [
        'jumlah_laporan' => $jumlah,
        'target' => $setting['target'],
        'pesan' => $message,
        'status' => $result['ok'] ? 'Terkirim' : 'Gagal',
        'error' => $result['ok'] ? null : $result['detail'],
    ]);

    jsonResponse([
        'ok' => $result['ok'],
        'status' => $result['status'],
        'detail' => $result['detail'],
        'jumlah' => $jumlah,
        'target' => $setting['target'],
        'provider' => $setting['provider'],
    ]);
}