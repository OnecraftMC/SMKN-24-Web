<?php
/**
 * Notifikasi WhatsApp "Chatbot-BK" untuk Guru BK — eskalasi laporan berat.
 *
 * Konteks: Counsellor AI (api/bk/chat) menandai laporan dengan tingkat_kesulitan
 * ('Ringan'|'Sedang'|'Berat') dan butuh_perhatian (1 = ada indikasi risiko
 * keselamatan). Ketika jumlah laporan berat yang MASIH TERBUKA (status <> 'Selesai')
 * mencapai ambang (default 10), satu pesan WhatsApp dikirim ke Guru BK atas nama
 * Chatbot-BK (WA_BRAND_NAME).
 *
 * Batasan yang disengaja:
 *  - Credential gateway (WA_API_TOKEN/WA_API_URL) HANYA dari .env — server-only.
 *    Tabel bk_wa_setting hanya menyimpan nomor tujuan + toggle + ambang + provider,
 *    yang memang boleh diubah admin lewat dashboard /admin/bk.
 *  - Nama internal (tabel pesan_bk / bk_wa_setting / bk_wa_alert dan seluruh
 *    environment key) TIDAK diubah. Hanya isi pesan + label UI yang memakai
 *    branding "Chatbot-BK".
 *  - Fungsi ini TIDAK PERNAH melempar exception. Kegagalan gateway dicatat ke
 *    bk_wa_alert sebagai 'Gagal' lalu dilewatkan. Laporan siswa sudah tercommit
 *    sebelum pemicu ini jalan; notifikasi tidak boleh menggagalkan laporan.
 *  - Payload dirakit sesuai kontrak Fonnte (/send, field target+message) dan
 *    Wablas (/send-message, field phone+message). Keduanya POST JSON dengan
 *    header `Authorization: <token>`.
 */

/** Nomor diseragamkan ke format internasional 62xxx tanpa '+' / spasi / strip. */
function waNormalizeTarget(?string $raw): string
{
    $digits = preg_replace('/\D/', '', (string) $raw) ?? '';
    if ($digits === '') {
        return '';
    }
    // 0812xxxx -> 62812xxxx; 62812xxxx dibiarkan; 812xxxx -> 62812xxxx.
    if (str_starts_with($digits, '0')) {
        $digits = '62' . substr($digits, 1);
    } elseif (!str_starts_with($digits, '62') && str_starts_with($digits, '8')) {
        $digits = '62' . $digits;
    }
    return $digits;
}

/**
 * Validasi nomor tujuan yang layak dikirim. Sengaja longgar: panjang dan
 * prefix cukup; gateway yang akan menolak nomor tidak valid.
 */
function waTargetValid(string $target): bool
{
    return (bool) preg_match('/^62\d{8,15}$/', $target);
}

/**
 * Provider gateway terkonfigurasi? Token kosong = fitur dilewati, bukan error.
 * Konsisten dengan perilaku OPENAI_API_KEY kosong.
 */
function waProviderConfigured(): bool
{
    return trim((string) WA_API_TOKEN) !== '';
}

/**
 * Normalisasi provider yang dipilih; nilai tak dikenal jatuh ke 'fonnte'.
 */
function waProviderName(?string $provider): string
{
    $name = strtolower(trim((string) $provider));
    return in_array($name, ['fonnte', 'wablas'], true) ? $name : 'fonnte';
}

/**
 * Baca konfigurasi eskalasi. Nilai DB didahulukan; env dipakai sebagai fallback
 * ketika baris konfigurasi belum ada (mis. sebelum migration dijalankan, atau
 * saat tool CLI dijalankan tanpa pernah membuka dashboard).
 *
 * @return array{target:string,aktif:bool,threshold:int,provider:string,sumber:string}
 */
function waGetSetting(PDO $db): array
{
    $fallback = [
        'target' => waNormalizeTarget(BK_WA_TARGET),
        'aktif' => false,
        'threshold' => max(1, (int) BK_WA_ALERT_THRESHOLD),
        'provider' => waProviderName(WA_PROVIDER),
        'sumber' => 'env',
    ];

    try {
        $stmt = $db->query('SELECT target, aktif, threshold, provider FROM bk_wa_setting WHERE id = 1');
        $row = $stmt ? $stmt->fetch() : false;
    } catch (Throwable $e) {
        // Tabel belum ada (migration belum jalan) -> pakai fallback env.
        error_log('[SMKN24] bk_wa_setting belum terbaca: ' . $e->getMessage());
        return $fallback;
    }

    if (!$row) {
        return $fallback;
    }

    return [
        'target' => waNormalizeTarget($row['target']),
        'aktif' => (bool) $row['aktif'],
        'threshold' => max(1, (int) $row['threshold']),
        'provider' => waProviderName($row['provider']),
        'sumber' => 'database',
    ];
}

/**
 * Simpan konfigurasi dari dashboard admin. Nomor dinormalisasi ke 62xxx sebelum
 * disimpan supaya tampilan dan konsistensi tidak tergantung cara mengetik.
 */
function waSaveSetting(PDO $db, array $input): array
{
    $target = waNormalizeTarget($input['target'] ?? '');
    $aktif = !empty($input['aktif']);
    $threshold = isset($input['threshold']) ? max(1, (int) $input['threshold']) : max(1, (int) BK_WA_ALERT_THRESHOLD);
    $provider = waProviderName($input['provider'] ?? WA_PROVIDER);

    $stmt = $db->prepare(
        'INSERT INTO bk_wa_setting (id, target, aktif, threshold, provider)
         VALUES (1, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE target = VALUES(target), aktif = VALUES(aktif),
                                 threshold = VALUES(threshold), provider = VALUES(provider)'
    );
    $stmt->execute([$target, $aktif ? 1 : 0, $threshold, $provider]);

    $setting = waGetSetting($db);
    $setting['sumber'] = 'database';
    return $setting;
}

/**
 * Jumlah laporan berat yang MASIH TERBUKA.
 *
 * "Berat" = butuh_perhatian (indikasi risiko keselamatan) ATAU tingkat_kesulitan
 * 'Berat' — definisi yang sama dengan yang dipakai panel antrean /admin/bk.
 * NULL tingkat_kesulitan dikecualikan agar data lama tidak dihitung sebagai berat.
 */
function waCountHeavyOpen(PDO $db): int
{
    $sql = "SELECT COUNT(*) FROM pesan_bk
            WHERE (butuh_perhatian = 1 OR tingkat_kesulitan = 'Berat')
              AND status <> 'Selesai'";
    return (int) $db->query($sql)->fetchColumn();
}

/**
 * Nama persona yang tampil di isi pesan WhatsApp.
 *
 * Pesan dikirim atas nama "Chatbot-BK" (sistem pendamping Bimbingan Konseling),
 * bukan sebagai notifikasi scheduler yang kaku. Nama internal (tabel `pesan_bk`,
 * `bk_wa_setting`, `bk_wa_alert`, dan environment key) TIDAK diubah — hanya isi
 * pesan dan teks antarmuka yang memakai label ini.
 */
const WA_BRAND_NAME = 'Chatbot-BK';

/**
 * Sapaan sesuai waktu (Asia/Jakarta).
 */
function waSapaanWaktu(): string
{
    try {
        $tz = new DateTimeZone('Asia/Jakarta');
        $jam = (int) $tz->format('G');
    } catch (Throwable $e) {
        $jam = (int) date('G');
    }

    if ($jam < 11) {
        return 'Selamat pagi';
    }
    if ($jam < 15) {
        return 'Selamat siang';
    }
    if ($jam < 18) {
        return 'Selamat sore';
    }
    return 'Selamat malam';
}

/**
 * Waktu relatif ringkas: "baru saja", "12 menit lalu", "3 jam lalu",
 * "2 hari lalu", atau "03 Sep 14:20" untuk yang sudah lama.
 */
function waRelatifWaktu(?string $waktu): string
{
    $waktu = trim((string) $waktu);
    if ($waktu === '') {
        return '';
    }

    $ts = strtotime($waktu);
    if (!$ts) {
        return '';
    }

    $selisih = time() - $ts;
    if ($selisih < 60) {
        return 'baru saja';
    }
    if ($selisih < 3600) {
        return floor($selisih / 60) . ' menit lalu';
    }
    if ($selisih < 86400) {
        return floor($selisih / 3600) . ' jam lalu';
    }
    if ($selisih < 604800) {
        return floor($selisih / 86400) . ' hari lalu';
    }
    return date('d M H:i', $ts);
}

/**
 * Statistik antrean BK untuk ditampilkan di pesan.
 *
 * @return array{aktif:int, perlu:int, ditangani:int}
 */
function waStatistikAntrean(PDO $db): array
{
    $statistik = ['aktif' => 0, 'perlu' => 0, 'ditangani' => 0];

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
            $statistik = [
                'aktif' => (int) ($row['aktif'] ?? 0),
                'perlu' => (int) ($row['perlu'] ?? 0),
                'ditangani' => (int) ($row['ditangani'] ?? 0),
            ];
        }
    } catch (Throwable $e) {
        error_log('[SMKN24] Gagal mengambil statistik antrean WA: ' . $e->getMessage());
    }

    return $statistik;
}

/**
 * Susun isi pesan dari Chatbot-BK untuk Guru BK.
 * Format dirancang informatif & layak didemokan:
 *  1. Header persona + sapaan waktu (ramah, seperti percakapan).
 *  2. Ringkasan antrean (aktif / perlu intervensi / sudah ditangani / ambang).
 *  3. Daftar kasus paling mendesak dengan kategori, tingkat kesulitan, waktu
 *     relatif, penanda risiko keselamatan, dan ringkasan hasil triase AI.
 *  4. Saran tindakan konkret + ajakan membalas pesan.
 *
 * Tidak pernah throw; daftar kasus dipilih deterministik (sama dengan antrean
 * /admin/bk) supaya Guru BK melihat urutan yang sama di dashboard dan WhatsApp.
 *
 * @param array $rows       Laporan teratas (nama, kelas, kategori, tanggal,
 *                          ringkasan, tingkat_kesulitan, butuh_perhatian).
 * @param int   $total      Jumlah laporan berat yang masih terbuka.
 * @param int   $threshold  Ambang eskalasi yang aktif.
 * @param array|null $statistik  Ringkasan antrean {aktif, perlu, ditangani}.
 */
function waBuildMessage(array $rows, int $total, int $threshold, ?array $statistik = null): string
{
    $maxCases = max(1, (int) BK_WA_ALERT_MAX_CASES);
    $shown = array_slice($rows, 0, $maxCases);
    $stat = array_merge(
        ['aktif' => $total, 'perlu' => $total, 'ditangani' => 0],
        $statistik ?? []
    );

    $lines = [];
    $lines[] = '🤖 *' . WA_BRAND_NAME . ' — SMKN 24 Jakarta*';
    $lines[] = '_Sistem Pendamping Bimbingan Konseling_';
    $lines[] = '';
    $lines[] = waSapaanWaktu() . ', Guru BK 👋';
    $lines[] = 'Saya *' . WA_BRAND_NAME . '*. Saya memantau laporan siswa yang masuk lewat';
    $lines[] = 'layanan BK, lalu mentriase tiap laporan untuk memisahkan mana yang';
    $lines[] = 'bisa saya bantu sendiri dan mana yang butuh intervensi manusia.';
    $lines[] = '';
    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '📊 *Ringkasan antrean saat ini*';
    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '• Laporan aktif    : *' . (int) $stat['aktif'] . '*';
    $lines[] = '• Perlu intervensi : *' . (int) $stat['perlu'] . '*';
    $lines[] = '• Sudah ditangani   : *' . (int) $stat['ditangani'] . '*';
    $lines[] = '• Ambang eskalasi   : *' . (int) $threshold . '*';
    $lines[] = '';
    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '🚨 *Perlu perhatian Anda (' . count($shown) . ' kasus)*';
    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '';

    foreach ($shown as $i => $row) {
        $no = $i + 1;
        $nama = (string) ($row['nama'] ?? 'Anonim');
        $kelas = (string) ($row['kelas'] ?? '-');
        $tingkat = (string) ($row['tingkat_kesulitan'] ?? '-');
        $perhatian = !empty($row['butuh_perhatian']);
        $kategori = trim((string) ($row['kategori'] ?? ''));
        $waktu = waRelatifWaktu(isset($row['tanggal']) ? (string) $row['tanggal'] : null);

        $lines[] = '*' . $no . '. ' . $nama . ' — ' . $kelas . '*';

        $meta = [];
        if ($kategori !== '') {
            $meta[] = 'Kategori: _' . $kategori . '_';
        }
        $meta[] = 'Tingkat: *' . strtoupper($tingkat) . '*';
        if ($waktu !== '') {
            $meta[] = '⏰ ' . $waktu;
        }
        $lines[] = '   ' . implode(' · ', $meta);

        if ($perhatian) {
            $lines[] = '   ⚠️ *Indikasi risiko keselamatan — mohon ditinjau prioritas*';
        }
        if (!empty($row['ringkasan'])) {
            $lines[] = '   "' . mb_substr((string) $row['ringkasan'], 0, 180) . '"';
        }
        $lines[] = '';
    }

    if ($total > count($shown)) {
        $lines[] = '⋯ dan ' . ($total - count($shown)) . ' laporan berat lainnya belum ditangani.';
        $lines[] = '';
    }

    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '✅ *Langkah yang saya sarankan*';
    $lines[] = '━━━━━━━━━━━━━━━━━━━━━━';
    $lines[] = '1️⃣ Hubungi siswa berindikasi risiko keselamatan hari ini juga.';
    $lines[] = '2️⃣ Tinjau ringkasan kasus di dashboard: */admin/bk*.';
    $lines[] = '3️⃣ Balas pesan ini atau ubah status laporan di dashboard agar saya';
    $lines[] = '   berhenti menghubungi Anda untuk kasus tersebut.';
    $lines[] = '';
    $lines[] = '🤖 _Pesan ini dikirim otomatis oleh ' . WA_BRAND_NAME . '.';
    $lines[] = 'Saya hanya menandai kasus — keputusan dan tindak lanjut tetap di tangan Anda._';

    return implode("\n", $lines);
}

/**
 * Kirim satu pesan ke gateway (Fonnte / Wablas). Payload generik: `target` +
 * `message`. Header Authorization memakai WA_API_TOKEN dari .env backend.
 *
 * @return array{ok:bool, status:string, detail:string}
 */
function waSendMessage(string $target, string $message, ?string $provider = null): array
{
    $provider = waProviderName($provider ?? waCurrentProvider());
    $url = WA_API_URL;

    if ($url === '') {
        return ['ok' => false, 'status' => 'Gagal', 'detail' => 'WA_API_URL belum diisi di .env.'];
    }
    if (WA_API_TOKEN === '') {
        return ['ok' => false, 'status' => 'Dilewati', 'detail' => 'WA_API_TOKEN belum diisi di .env (provider belum dikonfigurasi).'];
    }
    if (!waTargetValid($target)) {
        return ['ok' => false, 'status' => 'Gagal', 'detail' => 'Nomor tujuan tidak valid (harus diawali 62).'];
    }

    // Fonnte : POST /send          form-encoded {target, message} + header Authorization.
    // Wablas : POST /send-message  form-encoded {phone, message}  + header Authorization.
    $endpoint = $url . ($provider === 'wablas' ? '/send-message' : '/send');
    $payload = $provider === 'wablas'
        ? ['phone' => $target, 'message' => $message]
        : ['target' => $target, 'message' => $message];

    try {
        $response = waHttpPostForm($endpoint, $payload, ['Authorization: ' . trim((string) WA_API_TOKEN)]);
    } catch (Throwable $e) {
        error_log('[SMKN24] Gagal kirim WA ke Guru BK: ' . $e->getMessage());
        return ['ok' => false, 'status' => 'Gagal', 'detail' => $e->getMessage()];
    }

    // Fonnte/Wablas membalas {status: ...}. Anggap gagal bila eksplisit false.
    $remote = is_array($response) ? $response : [];
    $remoteStatus = $remote['status'] ?? null;
    $gagal = $remoteStatus === false
        || $remoteStatus === 'false'
        || $remoteStatus === 'error'
        || (is_string($remoteStatus) && strcasecmp($remoteStatus, 'failed') === 0);

    if ($gagal) {
        $detail = is_string($remote['message'] ?? null)
            ? $remote['message']
            : (is_string($remote['reason'] ?? null) ? $remote['reason'] : 'Gateway menolak pesan.');
        return ['ok' => false, 'status' => 'Gagal', 'detail' => $detail];
    }

    return ['ok' => true, 'status' => 'Terkirim', 'detail' => 'Pesan terkirim ke ' . $target . '.'];
}

/**
 * POST form-urlencoded ke gateway. Terpisah dari httpPostJson() di helpers/ai.php
 * karena Fonnte dan Wablas menerima form, bukan JSON.
 */
function waHttpPostForm(string $url, array $fields, array $headers = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($fields, '', '&'),
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/x-www-form-urlencoded'], $headers),
        CURLOPT_TIMEOUT => 20,
        // SSL verification: nonaktifkan di development agar tidak gagal karena
        // CA bundle cURL belum tersedia di Windows/XAMPP. Di production (Hostinger)
        // server biasanya sudah punya CA bundle terbaru, bisa di-aktifkan kembali.
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
    ]);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    // curl_close() sengaja tidak dipanggil: resource cURL dibebaskan otomatis
    // sejak PHP 8.0, dan di PHP 8.5 pemanggilan hanya memunculkan deprecation.
    if ($body === false) {
        throw new RuntimeException('Gateway tidak merespons: ' . $err);
    }
    if ($code >= 400) {
        throw new RuntimeException('Gateway membalas HTTP ' . $code . ': ' . mb_substr($body, 0, 200));
    }

    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : ['status' => true];
}

/**
 * Ambil kasus-kasus teratas yang perlu eskalasi. Satu sumber kebenaran untuk
 * pesan otomatis, pratinjau di dashboard, dan uji kirim.
 *
 * @return array<int, array<string, mixed>>
 */
function waTopCases(PDO $db): array
{
    try {
        $stmt = $db->query(
            "SELECT nama, kelas, kategori, tanggal, ringkasan, tingkat_kesulitan, butuh_perhatian
             FROM pesan_bk
             WHERE (butuh_perhatian = 1 OR tingkat_kesulitan = 'Berat')
               AND status <> 'Selesai'
             ORDER BY butuh_perhatian DESC,
                      FIELD(IFNULL(tingkat_kesulitan, 'zzz'), 'Berat', 'Sedang', 'Ringan', 'zzz'),
                      tanggal DESC
             LIMIT " . max(1, (int) BK_WA_ALERT_MAX_CASES)
        );
        return $stmt ? $stmt->fetchAll() : [];
    } catch (Throwable $e) {
        error_log('[SMKN24] Gagal mengambil baris eskalasi WA: ' . $e->getMessage());
        return [];
    }
}

/**
 * Pratinjau pesan hari ini TANPA mengirim — dipakai untuk bubble WhatsApp di
 * dashboard admin supaya Guru BK bisa melihat tampilan pesan yang akan masuk.
 */
function waBuildPreview(PDO $db): string
{
    $setting = waGetSetting($db);
    return waBuildMessage(
        waTopCases($db),
        waCountHeavyOpen($db),
        (int) $setting['threshold'],
        waStatistikAntrean($db)
    );
}

/**
 * Ringkasan aktivitas Chatbot-BK dari tabel audit `bk_wa_alert`.
 *
 * @return array{total_terkirim:int, terakhir_kirim:?string, terakhir_status:?string}
 */
function waLastAlertInfo(PDO $db): array
{
    $info = ['total_terkirim' => 0, 'terakhir_kirim' => null, 'terakhir_status' => null];

    try {
        $stmt = $db->query(
            "SELECT COUNT(*) AS total,
                    MAX(created_at) AS terakhir,
                    SUBSTRING_INDEX(GROUP_CONCAT(status ORDER BY created_at DESC), ',', 1) AS status_terakhir
             FROM bk_wa_alert
             WHERE status IN ('Terkirim', 'Gagal')"
        );
        $row = $stmt ? $stmt->fetch() : false;
        if (is_array($row)) {
            $info = [
                'total_terkirim' => (int) ($row['total'] ?? 0),
                'terakhir_kirim' => $row['terakhir'] ?? null,
                'terakhir_status' => $row['status_terakhir'] ?? null,
            ];
        }
    } catch (Throwable $e) {
        error_log('[SMKN24] Gagal membaca aktivitas bk_wa_alert: ' . $e->getMessage());
    }

    return $info;
}

/**
 * Catat satu percobaan eskalasi ke tabel `bk_wa_alert` (audit + cooldown).
 *
 * Tabel ini juga dipacu cooldown di waMaybeAlert(); karena itu setiap kirim —
 * terkirim, gagal, maupun dilewati — wajib tercatat di sini.
 */
function waLogAlert(PDO $db, array $data): void
{
    try {
        $stmt = $db->prepare(
            'INSERT INTO bk_wa_alert (jumlah_laporan, target, pesan, status, error)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) ($data['jumlah_laporan'] ?? 0),
            (string) ($data['target'] ?? ''),
            $data['pesan'] ?? null,
            (string) ($data['status'] ?? 'Dilewati'),
            $data['error'] ?? null,
        ]);
    } catch (Throwable $e) {
        // Tabel audit belum ada atau DB penuh: jangan menggagalkan eskalasi.
        error_log('[SMKN24] Gagal mencatat bk_wa_alert: ' . $e->getMessage());
    }
}

/**
 * Provider aktif saat ini: nilai DB didahulukan, fallback ke konstanta env.
 */
function waCurrentProvider(?PDO $db = null): string
{
    if ($db instanceof PDO) {
        return waGetSetting($db)['provider'];
    }
    return waProviderName(WA_PROVIDER);
}

/**
 * Orkestrasi eskalasi — dipanggil SETELAH laporan tersimpan (commit).
 *
 * Tidak pernah melempar exception: kegagalan WA tidak boleh menggagalkan
 * respons 200/201 ke siswa. Semua jalur dicatat ke bk_wa_alert untuk audit
 * dan cooldown.
 *
 * @param bool $paksa Abaikan ambang & cooldown (dipakai tombol "Uji kirim"
 *                    dan tool CLI --test, supaya presentasi lomba tidak perlu
 *                    menunggu 10 laporan nyata).
 * @return array{ok:bool, status:string, detail:string, jumlah:int}
 */
function waMaybeAlert(PDO $db, bool $paksa = false): array
{
    $setting = waGetSetting($db);
    $jumlah = waCountHeavyOpen($db);

    if (!$paksa) {
        if (!$setting['aktif']) {
            return ['ok' => false, 'status' => 'Dilewati', 'detail' => 'Notifikasi nonaktif (toggle mati).', 'jumlah' => $jumlah];
        }
        if ($setting['target'] === '' || !waTargetValid($setting['target'])) {
            return ['ok' => false, 'status' => 'Dilewati', 'detail' => 'Nomor tujuan belum dikonfigurasi.', 'jumlah' => $jumlah];
        }
        if ($jumlah < $setting['threshold']) {
            return ['ok' => false, 'status' => 'Dilewati', 'detail' => "Baru {$jumlah} laporan berat terbuka (ambang {$setting['threshold']}).", 'jumlah' => $jumlah];
        }

        // Cooldown per nomor tujuan: cegah spam saat laporan berdatangan.
        $cooldown = max(0, (int) BK_WA_ALERT_COOLDOWN_MINUTES);
        if ($cooldown > 0) {
            $stmt = $db->prepare(
                'SELECT MAX(created_at) FROM bk_wa_alert
                 WHERE target = ? AND status IN (\'Terkirim\', \'Gagal\')'
            );
            $stmt->execute([$setting['target']]);
            $last = $stmt->fetchColumn();
            if ($last) {
                $detikLalu = time() - strtotime((string) $last);
                $sisa = ($cooldown * 60) - $detikLalu;
                if ($sisa > 0) {
                    $menit = (int) ceil($sisa / 60);
                    return ['ok' => false, 'status' => 'Dilewati', 'detail' => "Cooldown aktif; coba lagi dalam {$menit} menit.", 'jumlah' => $jumlah];
                }
            }
        }
    }

    $rows = waTopCases($db);

    $message = waBuildMessage($rows, $jumlah, $setting['threshold'], waStatistikAntrean($db));
    $target = $setting['target'];

    if ($target === '') {
        return ['ok' => false, 'status' => 'Dilewati', 'detail' => 'Nomor tujuan kosong.', 'jumlah' => $jumlah];
    }

    $result = waSendMessage($target, $message, $setting['provider']);

    waLogAlert($db, [
        'jumlah_laporan' => $jumlah,
        'target' => $target,
        'pesan' => $message,
        'status' => $result['ok'] ? 'Terkirim' : ($result['status'] === 'Dilewati' ? 'Dilewati' : 'Gagal'),
        'error' => $result['ok'] ? null : $result['detail'],
    ]);

    return ['ok' => $result['ok'], 'status' => $result['ok'] ? 'Terkirim' : 'Gagal', 'detail' => $result['detail'], 'jumlah' => $jumlah];
}
