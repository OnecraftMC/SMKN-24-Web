<?php
/**
 * GET /api/bk/history/index.php?deviceId=xxx  -> riwayat chat BK milik
 *                                                 perangkat siswa tersebut.
 *
 * Endpoint PUBLIK (tanpa auth admin) supaya siswa bisa membaca history-nya
 * sendiri di handsetnya.
 *
 * Identitas memakai deviceId — ID acak yang dibuat browser dan disimpan di
 * localStorage. Sengaja TIDAK memakai IP: IP handphone sering berubah (pindah
 * WiFi ke seluler atau ganti lokasi) sehingga history bisa hilang sendiri,
 * dan IP sekolah dipakai bersama banyak siswa sehingga rawan tercampur.
 *
 * PRIVASI: yang dikembalikan HANYA milik perangkat tersebut. Endpoint ini
 * sengaja tidak menerima parameter id/filter lain, sehingga tidak bisa
 * dipakai membaca history siswa orang lain. Field yang ditampilkan ke siswa
 * juga dibatasi (tanpa no_hp dan tanpa identitasinternal lain).
 */

require_once __DIR__ . '/../../../bootstrap.php';

requireMethod('GET');

$deviceId = trim((string)($_GET['deviceId'] ?? ''));

// deviceId dibuat browser sebagai UUID v4.
if ($deviceId === '' || !preg_match('/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/i', $deviceId)) {
    jsonError('deviceId tidak valid', 400);
}

$db = getDB();

$limit = 20;
$stmt = $db->prepare(
    'SELECT id, tanggal, ringkasan, tingkat_kesulitan, kategori, butuh_perhatian, status, transkrip
     FROM pesan_bk
     WHERE device_id = ?
     ORDER BY tanggal DESC
     LIMIT ?'
);
$stmt->bindValue(1, $deviceId);
$stmt->bindValue(2, $limit, PDO::PARAM_INT);
$stmt->execute();

$rows = array_map(function ($r) {
    // Transkrip disimpan sebagai JSON; kirim apa adanya agar sisi klien
    // bisa merender ulang percakapan.
    $messages = null;
    if (!empty($r['transkrip'])) {
        $decoded = json_decode((string)$r['transkrip'], true);
        $messages = is_array($decoded) ? $decoded : null;
    }

    return [
        'id' => (int)$r['id'],
        'tanggal' => $r['tanggal'],
        'ringkasan' => $r['ringkasan'] ?? null,
        'tingkatKesulitan' => $r['tingkat_kesulitan'] ?? null,
        'kategori' => $r['kategori'] ?? null,
        'butuhPerhatian' => (bool)($r['butuh_perhatian'] ?? 0),
        'status' => $r['status'],
        'messages' => $messages,
    ];
}, $stmt->fetchAll());

jsonResponse($rows);
