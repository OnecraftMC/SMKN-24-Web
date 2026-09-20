<?php
/**
 * GET /api/chat/history.php?sessionId=xxx  -> riwayat 1 sesi (admin)
 * GET /api/chat/history.php                -> daftar semua sesi + jumlah pesan (admin)
 */

require_once __DIR__ . '/../../bootstrap.php';

requireMethod('GET');
requireAuth();

$db = getDB();

if (!empty($_GET['sessionId'])) {
    $stmt = $db->prepare('SELECT sender, text, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC');
    $stmt->execute([$_GET['sessionId']]);
    jsonResponse($stmt->fetchAll());
    exit;
}

$stmt = $db->query(
    'SELECT s.id AS session_id, s.created_at,
            (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS total_pesan
     FROM chat_sessions s
     ORDER BY s.created_at DESC
     LIMIT 100'
);
jsonResponse($stmt->fetchAll());
