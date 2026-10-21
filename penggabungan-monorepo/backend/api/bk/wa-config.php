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

/**
 * Baca konfigurasi saat ini, status Chatbot-BK, dan pratinjau pesan.
 */
function handleGet(PDO $db): void
{
    $setting = waGetSetting($db);
    $jumlah = waCountHeavyOpen($db);
    $aktivitas = waLastAlertInfo($db);

    jsonResponse([
        'target' => $setting['target'],
        'aktif' => (bool) $setting['aktif'],
        'threshold' => (int) $setting['threshold'],
        'provider' => $setting['provider'],
        'sumber' => $setting['sumber'],
        'jumlah_laporan_terbuka' => $jumlah,
        // Nama persona yang tampil pada pesan & antarmuka.
        'pengirim' => WA_BRAND_NAME,
        'status_agen' => $setting['aktif']
            ? 'Siap menghubungi Guru BK'
            : 'Dalam mode siaga (belum mengaktifkan pesan otomatis)',
        // Pratinjau isi pesan hari ini (tidak dikirim).
        'preview_pesan' => waBuildPreview($db),
        // Aktivitas terakhir Chatbot-BK ke Guru BK.
        'total_terkirim' => $aktivitas['total_terkirim'],
        'terakhir_kirim' => $aktivitas['terakhir_kirim'],
        'terakhir_status' => $aktivitas['terakhir_status'],
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
    $aktivitas = waLastAlertInfo($db);

    jsonResponse([
        'message' => 'Preferensi ' . WA_BRAND_NAME . ' disimpan.',
        'target' => $setting['target'],
        'aktif' => (bool) $setting['aktif'],
        'threshold' => (int) $setting['threshold'],
        'provider' => $setting['provider'],
        'sumber' => $setting['sumber'],
        'pengirim' => WA_BRAND_NAME,
        'status_agen' => $setting['aktif']
            ? 'Siap menghubungi Guru BK'
            : 'Dalam mode siaga (belum mengaktifkan pesan otomatis)',
        'preview_pesan' => waBuildPreview($db),
        'total_terkirim' => $aktivitas['total_terkirim'],
        'terakhir_kirim' => $aktivitas['terakhir_kirim'],
        'terakhir_status' => $aktivitas['terakhir_status'],
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
    $rows = waTopCases($db);

    $message = waBuildMessage($rows, $jumlah, $setting['threshold'], waStatistikAntrean($db));
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
        'detail' => $result['ok']
            ? 'Pesan uji ' . WA_BRAND_NAME . ' terkirim ke ' . $setting['target'] . '.'
            : $result['detail'],
        'jumlah' => $jumlah,
        'target' => $setting['target'],
        'provider' => $setting['provider'],
        'pengirim' => WA_BRAND_NAME,
    ]);
}