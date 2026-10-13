<?php
/**
 * GET    /api/jadwal/index.php                 -> kelas dan jadwal mingguan
 * GET    /api/jadwal/index.php?admin=1          -> data kelas/jadwal untuk admin
 * POST   /api/jadwal/index.php                  -> tambah atau ubah jadwal pelajaran
 * POST   /api/jadwal/index.php?resource=kelas   -> tambah atau ubah nama/kelas
 * DELETE /api/jadwal/index.php?id=1             -> hapus satu jadwal pelajaran
 * DELETE /api/jadwal/index.php?kelas_id=1       -> hapus kelas kosong
 */

require_once __DIR__ . '/../../bootstrap.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        requireAuth();
        if (($_GET['resource'] ?? '') === 'kelas') {
            handleSaveClass($db);
        } else {
            handleSaveSchedule($db);
        }
        break;
    case 'DELETE':
        requireAuth();
        handleDelete($db);
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

function handleGet(PDO $db): void
{
    if (isset($_GET['admin'])) {
        requireAuth();
    }

    $classes = $db->query(
        'SELECT id, nama, jurusan, tingkat FROM jadwal_kelas ORDER BY jurusan, tingkat, rombel'
    )->fetchAll();
    $classId = filter_var($_GET['kelas_id'] ?? null, FILTER_VALIDATE_INT);
    $sql = 'SELECT id, kelas_id, hari, TIME_FORMAT(jam_mulai, "%H:%i") AS jam_mulai,
                   TIME_FORMAT(jam_selesai, "%H:%i") AS jam_selesai, mapel, guru
            FROM jadwal_pelajaran';
    if ($classId !== false && $classId !== null) {
        $stmt = $db->prepare($sql . ' WHERE kelas_id = ? ORDER BY FIELD(hari, "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"), jam_mulai');
        $stmt->execute([$classId]);
        $schedules = $stmt->fetchAll();
    } else {
        $schedules = $db->query(
            $sql . ' ORDER BY kelas_id, FIELD(hari, "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"), jam_mulai'
        )->fetchAll();
    }

    jsonResponse([
        'classes' => array_map('formatClass', $classes),
        'schedules' => array_map('formatSchedule', $schedules),
    ]);
}

function handleSaveSchedule(PDO $db): void
{
    $body = getJsonBody();
    $id = isset($body['id']) ? filter_var($body['id'], FILTER_VALIDATE_INT) : null;
    $classId = filter_var($body['kelasId'] ?? null, FILTER_VALIDATE_INT);
    $day = strtolower(trim((string)($body['hari'] ?? '')));
    $start = trim((string)($body['jamMulai'] ?? ''));
    $end = trim((string)($body['jamSelesai'] ?? ''));
    $subject = trim((string)($body['mapel'] ?? ''));
    $teacher = trim((string)($body['guru'] ?? ''));

    if ($classId === false || $classId < 1) jsonError("Field 'kelasId' wajib diisi.", 400);
    if (!in_array($day, ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], true)) {
        jsonError("Field 'hari' tidak valid.", 400);
    }
    if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $start)
        || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $end)
        || $start >= $end) {
        jsonError('Jam mulai dan selesai harus valid; jam selesai harus setelah jam mulai.', 400);
    }
    if ($subject === '' || mb_strlen($subject) > 255) jsonError("Nama mata pelajaran wajib diisi (maksimal 255 karakter).", 400);
    if (mb_strlen($teacher) > 150) jsonError('Nama guru maksimal 150 karakter.', 400);
    if ($id === false || ($id !== null && $id < 1)) jsonError("Field 'id' tidak valid.", 400);

    $db->beginTransaction();
    try {
        $class = $db->prepare('SELECT id FROM jadwal_kelas WHERE id = ? FOR UPDATE');
        $class->execute([$classId]);
        if (!$class->fetch()) {
            $db->rollBack();
            jsonError('Kelas tidak ditemukan.', 404);
        }

        $conflictSql = 'SELECT id FROM jadwal_pelajaran
                        WHERE kelas_id = ? AND hari = ?
                          AND jam_mulai < ? AND jam_selesai > ?';
        $conflictParams = [$classId, $day, $end, $start];
        if ($id !== null) {
            $conflictSql .= ' AND id <> ?';
            $conflictParams[] = $id;
        }
        $conflictSql .= ' LIMIT 1 FOR UPDATE';
        $conflict = $db->prepare($conflictSql);
        $conflict->execute($conflictParams);
        if ($conflict->fetch()) {
            $db->rollBack();
            jsonError('Waktu tersebut bertabrakan dengan jadwal lain di kelas ini.', 409);
        }

        if ($id === null) {
            $stmt = $db->prepare(
                'INSERT INTO jadwal_pelajaran (kelas_id, hari, jam_mulai, jam_selesai, mapel, guru)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$classId, $day, $start, $end, $subject, $teacher ?: null]);
            $id = (int)$db->lastInsertId();
        } else {
            $exists = $db->prepare('SELECT id FROM jadwal_pelajaran WHERE id = ? FOR UPDATE');
            $exists->execute([$id]);
            if (!$exists->fetch()) {
                $db->rollBack();
                jsonError('Jadwal pelajaran tidak ditemukan.', 404);
            }
            $stmt = $db->prepare(
                'UPDATE jadwal_pelajaran
                 SET kelas_id = ?, hari = ?, jam_mulai = ?, jam_selesai = ?, mapel = ?, guru = ?
                 WHERE id = ?'
            );
            $stmt->execute([$classId, $day, $start, $end, $subject, $teacher ?: null, $id]);
        }

        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }

    jsonResponse(['id' => $id, 'message' => 'Jadwal pelajaran berhasil disimpan.']);
}

function handleSaveClass(PDO $db): void
{
    $body = getJsonBody();
    $id = isset($body['id']) ? filter_var($body['id'], FILTER_VALIDATE_INT) : null;
    $name = trim((string)($body['nama'] ?? ''));
    $program = strtolower(trim((string)($body['jurusan'] ?? '')));
    $grade = filter_var($body['tingkat'] ?? null, FILTER_VALIDATE_INT);
    $programs = ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata'];

    if ($name === '' || mb_strlen($name) > 80) jsonError("Nama kelas wajib diisi (maksimal 80 karakter).", 400);
    if (!in_array($program, $programs, true)) jsonError("Program keahlian tidak valid.", 400);
    if (!in_array($grade, [10, 11, 12], true)) jsonError("Tingkat kelas harus X, XI, atau XII.", 400);
    if ($id === false || ($id !== null && $id < 1)) jsonError("Field 'id' tidak valid.", 400);

    try {
        if ($id !== null) {
            $stmt = $db->prepare('UPDATE jadwal_kelas SET nama = ? WHERE id = ?');
            $stmt->execute([$name, $id]);
            if ($stmt->rowCount() === 0) {
                $exists = $db->prepare('SELECT id FROM jadwal_kelas WHERE id = ?');
                $exists->execute([$id]);
                if (!$exists->fetch()) jsonError('Kelas tidak ditemukan.', 404);
            }
        } else {
            $db->beginTransaction();
            $lastRoom = $db->prepare(
                'SELECT rombel FROM jadwal_kelas
                 WHERE jurusan = ? AND tingkat = ? ORDER BY rombel DESC LIMIT 1 FOR UPDATE'
            );
            $lastRoom->execute([$program, $grade]);
            $roomNumber = (int)$lastRoom->fetchColumn() + 1;
            $stmt = $db->prepare(
                'INSERT INTO jadwal_kelas (nama, jurusan, tingkat, rombel) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$name, $program, $grade, $roomNumber]);
            $id = (int)$db->lastInsertId();
            $db->commit();
        }
    } catch (PDOException $error) {
        if ($db->inTransaction()) $db->rollBack();
        if ($error->getCode() === '23000') {
            jsonError('Nama kelas tersebut sudah digunakan. Pilih nama lain.', 409);
        }
        throw $error;
    }

    jsonResponse(['id' => $id, 'message' => 'Kelas berhasil disimpan.']);
}

function handleDelete(PDO $db): void
{
    $classId = filter_var($_GET['kelas_id'] ?? null, FILTER_VALIDATE_INT);
    if ($classId !== false && $classId !== null) {
        $count = $db->prepare('SELECT COUNT(*) FROM jadwal_pelajaran WHERE kelas_id = ?');
        $count->execute([$classId]);
        if ((int)$count->fetchColumn() > 0) {
            jsonError('Kelas masih memiliki jadwal. Hapus jadwal kelas terlebih dahulu.', 409);
        }
        $stmt = $db->prepare('DELETE FROM jadwal_kelas WHERE id = ?');
        $stmt->execute([$classId]);
        if ($stmt->rowCount() === 0) jsonError('Kelas tidak ditemukan.', 404);
        jsonResponse(['message' => 'Kelas berhasil dihapus.']);
    }

    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) jsonError("Parameter 'id' wajib diisi.", 400);
    $stmt = $db->prepare('DELETE FROM jadwal_pelajaran WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Jadwal pelajaran tidak ditemukan.', 404);
    jsonResponse(['message' => 'Jadwal pelajaran berhasil dihapus.']);
}

function formatClass(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nama' => $row['nama'],
        'jurusan' => $row['jurusan'],
        'tingkat' => (int)$row['tingkat'],
    ];
}

function formatSchedule(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'kelasId' => (int)$row['kelas_id'],
        'hari' => $row['hari'],
        'jamMulai' => $row['jam_mulai'],
        'jamSelesai' => $row['jam_selesai'],
        'mapel' => $row['mapel'],
        'guru' => $row['guru'],
    ];
}
