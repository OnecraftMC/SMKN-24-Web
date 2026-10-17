<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use App\Support\PrivateUploads;
use App\Support\UploadException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class PrestasiController
{
    private const STATUSES = ['Baru', 'Ditinjau', 'Disetujui', 'Ditolak'];
    private const FIELDS = [
        'nisn' => 20,
        'namaSiswa' => 150,
        'kelas' => 80,
        'jurusan' => 100,
        'perlombaan' => 255,
        'tingkat' => 100,
        'tanggalLomba' => 10,
        'penyelenggara' => 200,
        'prestasi' => 150,
    ];
    private const TYPES = [
        'pdf' => ['application/pdf'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
    ];

    public function __invoke(Request $request)
    {
        return match ($request->method()) {
            'POST' => $this->create($request),
            'GET' => $this->index($request),
            'PUT' => $this->update($request),
            default => response()->json(['error' => 'Method tidak diizinkan'], 405),
        };
    }

    private function create(Request $request): JsonResponse
    {
        foreach (self::FIELDS as $field => $max) {
            $value = trim((string) $request->input($field, ''));
            if ($value === '' || strlen($value) > $max) {
                return response()->json([
                    'error' => "Field '$field' wajib diisi dan maksimal $max karakter.",
                ], 400);
            }
        }
        $dateValue = $request->input('tanggalLomba');
        $date = \DateTime::createFromFormat('!Y-m-d', $dateValue);
        if (!$date || $date->format('Y-m-d') !== $dateValue) {
            return response()->json(["error" => "Field 'tanggalLomba' harus berupa tanggal yang valid."], 400);
        }
        $description = trim((string) $request->input('deskripsi', ''));
        if (strlen($description) > 3000) {
            return response()->json(["error" => "Field 'deskripsi' maksimal 3.000 karakter."], 400);
        }

        try {
            (new PrivateUploads())->enforceRateLimit(
                'prestasi',
                5,
                3600,
                (string) $request->ip(),
            );
        } catch (UploadException $exception) {
            $response = response()->json(['error' => $exception->getMessage()], $exception->status);
            if ($exception->retryAfter !== null) {
                $response->headers->set('Retry-After', (string) $exception->retryAfter);
            }
            return $response;
        }

        $upload = null;
        if ($request->hasFile('bukti')) {
            try {
                $upload = (new PrivateUploads())->store($request->file('bukti'), self::TYPES);
            } catch (UploadException $exception) {
                return response()->json(['error' => $exception->getMessage()], $exception->status);
            }
        }
        $fields = [];
        foreach (self::FIELDS as $field => $_max) {
            $fields[$field] = trim((string) $request->input($field));
        }

        try {
            DB::table('prestasi')->insert([
                'nisn' => $fields['nisn'],
                'nama_siswa' => $fields['namaSiswa'],
                'kelas' => $fields['kelas'],
                'jurusan' => $fields['jurusan'],
                'perlombaan' => $fields['perlombaan'],
                'tingkat' => $fields['tingkat'],
                'tanggal_lomba' => $fields['tanggalLomba'],
                'penyelenggara' => $fields['penyelenggara'],
                'prestasi' => $fields['prestasi'],
                'deskripsi' => $description === '' ? null : $description,
                'nama_file' => $upload['originalName'] ?? null,
                'storage_key' => $upload['storedName'] ?? null,
                'mime_type' => $upload['mime'] ?? null,
                'ukuran_file' => $upload['size'] ?? null,
            ]);
        } catch (Throwable $exception) {
            if ($upload !== null && !(new PrivateUploads())->delete($upload['storedName'])) {
                report(new \RuntimeException('File bukti gagal dibersihkan setelah insert database gagal.'));
            }
            throw $exception;
        }

        return response()->json([
            'message' => 'Pengajuan prestasi berhasil diterima untuk ditinjau. Data hanya dapat diakses admin.',
        ], 201)->header('Cache-Control', 'no-store, private');
    }

    private function index(Request $request)
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request)->header('Cache-Control', 'no-store, private');
        }
        if ($request->query('download') === '1') {
            $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
            if (!$id || $id < 1) {
                return response()->json(['error' => 'Parameter id tidak valid.'], 400);
            }
            $row = DB::table('prestasi')->where('id', $id)->first(['nama_file', 'storage_key', 'mime_type']);
            if (!$row || !$row->storage_key) {
                return response()->json(['error' => 'Bukti prestasi tidak ditemukan.'], 404);
            }
            $download = (new PrivateUploads())->download($row->storage_key, $row->nama_file, $row->mime_type);
            return ($download ?? response()->json(['error' => 'Bukti prestasi tidak ditemukan.'], 404))
                ->header('Cache-Control', 'no-store, private');
        }
        if ($request->filled('id')) {
            $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
            if (!$id || $id < 1) {
                return response()->json(['error' => 'Parameter id tidak valid.'], 400);
            }
            $row = DB::table('prestasi')->where('id', $id)->first();
            if (!$row) {
                return response()->json(['error' => 'Pengajuan tidak ditemukan.'], 404);
            }
            return response()->json($this->format((array) $row))->header('Cache-Control', 'no-store, private');
        }

        $page = filter_var($request->query('page', '1'), FILTER_VALIDATE_INT);
        if (!$page || $page < 1 || $page > 100000) {
            return response()->json(['error' => 'Parameter page tidak valid.'], 400);
        }
        $status = trim((string) $request->query('status', ''));
        if ($status !== '' && !in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Filter status tidak valid.'], 400);
        }
        $category = null;
        if ($request->query->has('kategori')) {
            $category = AdminApi::category('prestasi', $request->query('kategori'));
            if ($category instanceof JsonResponse) {
                return $category;
            }
        }
        $search = trim((string) $request->query('q', ''));
        if (strlen($search) > 100) {
            return response()->json(['error' => 'Kata pencarian maksimal 100 karakter.'], 400);
        }

        $query = DB::table('prestasi');
        if ($status !== '') {
            $query->where('status', $status);
        }
        if ($category !== null) {
            $query->where('kategori', $category);
        }
        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                foreach (['nama_siswa', 'kelas', 'jurusan', 'perlombaan', 'tingkat', 'penyelenggara', 'prestasi'] as $index => $column) {
                    $index === 0
                        ? $builder->where($column, 'like', "%$search%")
                        : $builder->orWhere($column, 'like', "%$search%");
                }
            });
        }
        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')->orderByDesc('id')->forPage($page, 50)->get()
            ->map(fn (object $row): array => $this->format((array) $row));

        return response()->json(['items' => $items, 'page' => $page, 'pageSize' => 50, 'total' => $total])
            ->header('Cache-Control', 'no-store, private');
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request)->header('Cache-Control', 'no-store, private');
        }
        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            return response()->json(['error' => 'Parameter id tidak valid.'], 400);
        }
        $body = $request->json()->all();
        $hasStatus = array_key_exists('status', $body);
        $hasCategory = array_key_exists('kategori', $body);
        if (!$hasStatus && !$hasCategory) {
            return response()->json(['error' => 'Status atau kategori harus diubah.'], 400);
        }
        if ($hasStatus && (!is_string($body['status']) || !in_array($body['status'], self::STATUSES, true))) {
            return response()->json(['error' => 'Status moderasi tidak valid.'], 400);
        }
        $changes = [];
        if ($hasStatus) {
            $changes['status'] = $body['status'];
            $changes['reviewed_at'] = $body['status'] === 'Baru' ? null : now();
        }
        if ($hasCategory) {
            $category = AdminApi::category('prestasi', $body['kategori']);
            if ($category instanceof JsonResponse) {
                return $category;
            }
            $changes['kategori'] = $category;
        }
        if (!DB::table('prestasi')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Pengajuan tidak ditemukan.'], 404);
        }
        DB::table('prestasi')->where('id', $id)->update($changes);
        return response()->json(['message' => 'Pengajuan berhasil diperbarui.'])
            ->header('Cache-Control', 'no-store, private');
    }

    private function format(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'nisn' => $row['nisn'],
            'namaSiswa' => $row['nama_siswa'],
            'kelas' => $row['kelas'],
            'jurusan' => $row['jurusan'],
            'perlombaan' => $row['perlombaan'],
            'tingkat' => $row['tingkat'],
            'tanggalLomba' => $row['tanggal_lomba'],
            'penyelenggara' => $row['penyelenggara'],
            'prestasi' => $row['prestasi'],
            'deskripsi' => $row['deskripsi'],
            'namaFile' => $row['nama_file'],
            'adaBukti' => $row['storage_key'] !== null,
            'status' => $row['status'],
            'kategori' => $row['kategori'] ?? null,
            'createdAt' => $row['created_at'],
            'reviewedAt' => $row['reviewed_at'],
            'downloadUrl' => $row['storage_key'] === null
                ? null : '/api/prestasi/index.php?id=' . (int) $row['id'] . '&download=1',
        ];
    }
}
