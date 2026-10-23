<?php
/**
 * GET    /api/ekstrakurikuler/index.php              -> semua ekstrakurikuler
 * GET    /api/ekstrakurikuler/index.php?unggulan=1   -> hanya unggulan
 * GET    /api/ekstrakurikuler/index.php?kategori=Seni -> filter kategori
 * GET    /api/ekstrakurikuler/index.php?id=1         -> detail
 * POST   /api/ekstrakurikuler/index.php              -> tambah (admin)
 * PUT    /api/ekstrakurikuler/index.php?id=1         -> update (admin)
 * DELETE /api/ekstrakurikuler/index.php?id=1         -> hapus (admin)
 *
 * Kontrak field mengikuti tabel `ekstrakurikuler`:
 * nama, deskripsi, logo, kategori, pembina, jadwal, lokasi, unggulan.
 * Logo boleh berisi path unggahan admin (/backend/uploads/...) atau aset
 * contoh yang ikut di-build bersama website (/images/ekstrakurikuler/...).
 */

require_once __DIR__ . '/../../bootstrap.php';

$db = getDB();
ensureEkstrakurikulerSchema($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        requireAuth();
        handleCreate($db);
        break;
    case 'PUT':
        requireAuth();
        handleUpdate($db);
        break;
    case 'DELETE':
        requireAuth();
        handleDelete($db);
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

/**
 * Pastikan tabel tersedia. Dipanggil sekali per request (static guard).
 * Data contoh hanya dimasukkan saat tabel benar-benar baru dibuat supaya
 * baris yang sengaja dihapus admin tidak muncul lagi.
 *
 * Backend produksi bisa saja belum menjalankan migrasi; tanpa ini endpoint
 * membalas 500 (table not found) sehingga admin menampilkan "Permintaan gagal".
 */
function ensureEkstrakurikulerSchema(PDO $db): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    try {
        $exists = $db->query("SHOW TABLES LIKE 'ekstrakurikuler'")->fetchColumn();
        $db->exec(
            "CREATE TABLE IF NOT EXISTS ekstrakurikuler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(150) NOT NULL,
                deskripsi TEXT,
                logo VARCHAR(500) DEFAULT NULL,
                kategori VARCHAR(100) DEFAULT NULL,
                pembina VARCHAR(150) DEFAULT NULL,
                jadwal VARCHAR(150) DEFAULT NULL,
                lokasi VARCHAR(150) DEFAULT NULL,
                unggulan TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        if ($exists) {
            return;
        }

        $seed = [
            ['Paskibra', 'Pasukan Pengibar Bendera melatih kedisiplinan, kepemimpinan, dan rasa cinta tanah air melalui latihan baris-berbaris serta protokol upacara.', '/images/ekstrakurikuler/paskibra.svg', 'Kepemimpinan', 'Pembina Kesiswaan', 'Sabtu, 08.00 - 10.00 WIB', 'Lapangan Utama', 1],
            ['Pramuka', 'Gerakan Pramuka membentuk karakter mandiri, gotong royong, dan peduli lingkungan lewat kegiatan kepramukaan yang menyenangkan.', '/images/ekstrakurikuler/pramuka.svg', 'Kepemimpinan', 'Kak Pembina Pramuka', 'Jumat, 14.00 - 16.00 WIB', 'Aula Serbaguna', 1],
            ['PMR', 'Palang Merah Remaja membekali siswa dengan pertolongan pertama, kesehatan remaja, dan kesiapsiagaan bencana.', '/images/ekstrakurikuler/pmr.svg', 'Sosial', 'Tim Kesehatan Sekolah', 'Rabu, 14.30 - 16.00 WIB', 'Ruang UKS', 0],
            ['Basket', 'Klub basket mengembangkan teknik dasar, kerja sama tim, dan kebugaran melalui latihan rutin serta sparring antarsekolah.', '/images/ekstrakurikuler/basket.svg', 'Olahraga', 'Pelatih Basket', 'Selasa & Kamis, 15.30 - 17.00 WIB', 'Lapangan Basket', 1],
            ['Futsal', 'Futsal menjadi wadah siswa menyalurkan minat olahraga, membangun sportivitas, dan bersiap mengikuti turnamen pelajar.', '/images/ekstrakurikuler/futsal.svg', 'Olahraga', 'Pelatih Futsal', 'Senin & Jumat, 15.30 - 17.00 WIB', 'Lapangan Futsal', 0],
            ['Tari Tradisional', 'Sanggar tari melestarikan seni tari Nusantara sekaligus menyiapkan penampilan untuk acara sekolah dan festival budaya.', '/images/ekstrakurikuler/tari.svg', 'Seni', 'Guru Seni Budaya', 'Kamis, 14.00 - 16.00 WIB', 'Studio Tari', 1],
            ['Paduan Suara', 'Paduan suara melatih teknik vokal, harmonisasi, dan kepercayaan diri untuk tampil pada upacara serta kompetisi.', '/images/ekstrakurikuler/paduan-suara.svg', 'Seni', 'Guru Musik', 'Rabu, 14.00 - 15.30 WIB', 'Ruang Musik', 0],
            ['Jurnalistik', 'Ekstrakurikuler jurnalistik mengasah kemampuan menulis, fotografi, dan produksi konten untuk media sekolah.', '/images/ekstrakurikuler/jurnalistik.svg', 'Akademik', 'Tim Humas Sekolah', 'Jumat, 13.00 - 15.00 WIB', 'Laboratorium Komputer', 0],
        ];

        $stmt = $db->prepare(
            'INSERT INTO ekstrakurikuler (nama, deskripsi, logo, kategori, pembina, jadwal, lokasi, unggulan)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($seed as $row) {
            $stmt->execute($row);
        }
    } catch (Throwable $e) {
        // Query berikutnya akan memberi pesan error yang lebih spesifik.
        error_log('[SMKN24] Gagal menyiapkan tabel ekstrakurikuler: ' . $e->getMessage());
    }
}

function handleGet(PDO $db): void
{
    if (isset($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM ekstrakurikuler WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Ekstrakurikuler tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $conditions = [];
    $params = [];
    if (isset($_GET['unggulan']) && $_GET['unggulan'] === '1') {
        $conditions[] = 'unggulan = 1';
    }
    $kategori = trim((string)($_GET['kategori'] ?? ''));
    if ($kategori !== '') {
        $conditions[] = 'kategori = ?';
        $params[] = $kategori;
    }

    $sql = 'SELECT * FROM ekstrakurikuler';
    if ($conditions !== []) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY unggulan DESC, nama ASC, id ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    $nama = requireNama($body);

    $stmt = $db->prepare(
        'INSERT INTO ekstrakurikuler (nama, deskripsi, logo, kategori, pembina, jadwal, lokasi, unggulan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $nama,
        optionalText($body, 'deskripsi', 5000),
        optionalText($body, 'logo', 500),
        optionalText($body, 'kategori', 100),
        optionalText($body, 'pembina', 150),
        optionalText($body, 'jadwal', 150),
        optionalText($body, 'lokasi', 150),
        optionalFeature($body) ? 1 : 0,
    ]);

    jsonResponse([
        'id' => (int)$db->lastInsertId(),
        'message' => 'Ekstrakurikuler berhasil ditambahkan',
    ], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    $nama = requireNama($body);

    // Eksistensi dicek dulu; rowCount() 0 saat tidak ada perubahan bukan 404.
    $exists = $db->prepare('SELECT id, unggulan FROM ekstrakurikuler WHERE id = ?');
    $exists->execute([$id]);
    $existing = $exists->fetch();
    if (!$existing) jsonError('Ekstrakurikuler tidak ditemukan', 404);

    $unggulan = array_key_exists('unggulan', $body)
        ? (optionalFeature($body) ? 1 : 0)
        : (int)$existing['unggulan'];

    $stmt = $db->prepare(
        'UPDATE ekstrakurikuler
         SET nama = ?, deskripsi = ?, logo = ?, kategori = ?, pembina = ?, jadwal = ?, lokasi = ?, unggulan = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $nama,
        optionalText($body, 'deskripsi', 5000),
        optionalText($body, 'logo', 500),
        optionalText($body, 'kategori', 100),
        optionalText($body, 'pembina', 150),
        optionalText($body, 'jadwal', 150),
        optionalText($body, 'lokasi', 150),
        $unggulan,
        $id,
    ]);

    jsonResponse(['message' => 'Ekstrakurikuler berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM ekstrakurikuler WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Ekstrakurikuler tidak ditemukan', 404);
    jsonResponse(['message' => 'Ekstrakurikuler berhasil dihapus']);
}

function requireNama(array $body): string
{
    $nama = $body['nama'] ?? null;
    if (!is_string($nama) || trim($nama) === '') {
        jsonError("Field 'nama' wajib diisi", 400);
    }
    $nama = trim($nama);
    if (mb_strlen($nama) > 150) {
        jsonError("Field 'nama' maksimal 150 karakter", 400);
    }
    return $nama;
}

function optionalText(array $body, string $key, int $maxLength): ?string
{
    if (!array_key_exists($key, $body) || $body[$key] === null) {
        return null;
    }
    if (!is_string($body[$key])) {
        jsonError("Field '{$key}' harus berupa teks", 400);
    }
    $value = trim($body[$key]);
    if ($value === '') {
        return null;
    }
    if (mb_strlen($value) > $maxLength) {
        jsonError("Field '{$key}' maksimal {$maxLength} karakter", 400);
    }
    return $value;
}

function optionalFeature(array $body): bool
{
    if (!array_key_exists('unggulan', $body)) {
        return false;
    }
    $value = $body['unggulan'];
    if (!is_bool($value) && !in_array($value, [0, 1, '0', '1'], true)) {
        jsonError("Field 'unggulan' harus berupa boolean", 400);
    }
    return !empty($value);
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nama' => $row['nama'],
        'deskripsi' => $row['deskripsi'] ?? null,
        'logo' => $row['logo'] ?? null,
        'kategori' => $row['kategori'] ?? null,
        'pembina' => $row['pembina'] ?? null,
        'jadwal' => $row['jadwal'] ?? null,
        'lokasi' => $row['lokasi'] ?? null,
        'unggulan' => (bool)($row['unggulan'] ?? 0),
    ];
}
