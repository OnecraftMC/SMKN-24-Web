<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use App\Support\PrivateUploads;
use App\Support\UploadException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class ArsipController
{
    private const TYPES = [
        'pdf' => ['application/pdf'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
            'application/x-zip',
        ],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
    ];

    public function __invoke(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'POST' => $this->create($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->delete($request),
            default => response()->json(['error' => 'Method tidak diizinkan'], 405),
        };
    }

    private function index(Request $request)
    {
        if ($request->query('admin') === '1' && !AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        if ($request->filled('id') && $request->query('download') === '1') {
            $row = DB::table('arsip')->where('id', (int) $request->query('id'))->first();
            if (!$row) {
                return response()->json(['error' => 'Dokumen tidak ditemukan.'], 404);
            }
            if (!(bool) $row->aktif && !AdminApi::authorized($request)) {
                return AdminApi::unauthorized($request);
            }
            $download = (new PrivateUploads())->download($row->storage_key, $row->nama_file, $row->mime_type);
            return $download ?? response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        $query = DB::table('arsip');
        if ($request->query('admin') === '1') {
            $query->orderByDesc('created_at')->orderByDesc('id');
        } else {
            $query->where('aktif', 1)->orderBy('kategori')->orderBy('judul');
        }
        return response()->json($query->get()->map(
            fn (object $row): array => $this->format((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $judul = trim((string) $request->input('judul', ''));
        $description = trim((string) $request->input('deskripsi', ''));
        $category = trim((string) $request->input('kategori', 'Akademik'));
        if (($error = $this->validateMetadata($judul, $description, $category)) !== null) {
            return response()->json(['error' => $error], 400);
        }
        $storedCategory = AdminApi::category('arsip', $category);
        if ($storedCategory instanceof JsonResponse) {
            return $storedCategory;
        }
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'Pilih dokumen untuk diunggah.'], 400);
        }
        try {
            $upload = (new PrivateUploads())->store($request->file('file'), self::TYPES);
        } catch (UploadException $exception) {
            return $this->uploadError($exception);
        }

        try {
            $id = DB::table('arsip')->insertGetId([
                'judul' => $judul,
                'deskripsi' => $description === '' ? null : $description,
                'kategori' => $storedCategory,
                'nama_file' => $upload['originalName'],
                'storage_key' => $upload['storedName'],
                'mime_type' => $upload['mime'],
                'ukuran_file' => $upload['size'],
                'aktif' => $request->input('aktif') === '1' ? 1 : 0,
            ]);
        } catch (Throwable $exception) {
            if (!(new PrivateUploads())->delete($upload['storedName'])) {
                report(new \RuntimeException('File arsip gagal dibersihkan setelah insert database gagal.'));
            }
            throw $exception;
        }

        return response()->json(['id' => (int) $id, 'message' => 'Dokumen arsip berhasil ditambahkan.'], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            return response()->json(['error' => 'Parameter id tidak valid.'], 400);
        }
        $body = $request->json()->all();
        $judul = trim((string) ($body['judul'] ?? ''));
        $description = trim((string) ($body['deskripsi'] ?? ''));
        $category = trim((string) ($body['kategori'] ?? ''));
        if (!array_key_exists('aktif', $body) || !in_array($body['aktif'], [true, false, 0, 1, '0', '1'], true)) {
            return response()->json(['error' => "Field 'aktif' harus berupa boolean."], 400);
        }
        if (($error = $this->validateMetadata($judul, $description, $category)) !== null) {
            return response()->json(['error' => $error], 400);
        }
        $storedCategory = AdminApi::category('arsip', $category);
        if ($storedCategory instanceof JsonResponse) {
            return $storedCategory;
        }
        if (!DB::table('arsip')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Dokumen arsip tidak ditemukan.'], 404);
        }
        DB::table('arsip')->where('id', $id)->update([
            'judul' => $judul,
            'deskripsi' => $description === '' ? null : $description,
            'kategori' => $storedCategory,
            'aktif' => (int) (bool) $body['aktif'],
        ]);
        return response()->json(['message' => 'Metadata arsip berhasil diperbarui.']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            return response()->json(['error' => 'Parameter id tidak valid.'], 400);
        }
        $row = DB::table('arsip')->where('id', $id)->first(['storage_key']);
        if (!$row) {
            return response()->json(['error' => 'Dokumen arsip tidak ditemukan.'], 404);
        }
        DB::table('arsip')->where('id', $id)->delete();
        if (!(new PrivateUploads())->delete($row->storage_key)) {
            report(new \RuntimeException('Metadata arsip terhapus, tetapi file privat gagal dibersihkan.'));
            return response()->json([
                'error' => 'Metadata terhapus, tetapi file gagal dibersihkan. Hubungi administrator server.',
            ], 500);
        }
        return response()->json(['message' => 'Dokumen arsip dan file berhasil dihapus.']);
    }

    private function validateMetadata(string $title, string $description, string $category): ?string
    {
        if ($title === '' || strlen($title) > 255) {
            return 'Judul wajib diisi (maksimal 255 karakter).';
        }
        if (strlen($description) > 5000) {
            return 'Deskripsi maksimal 5.000 karakter.';
        }
        if ($category === '' || strlen($category) > 100) {
            return 'Kategori wajib diisi (maksimal 100 karakter).';
        }
        return null;
    }

    private function format(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'deskripsi' => $row['deskripsi'],
            'kategori' => $row['kategori'],
            'namaFile' => $row['nama_file'],
            'ukuranFile' => (int) $row['ukuran_file'],
            'aktif' => (bool) $row['aktif'],
            'createdAt' => $row['created_at'],
            'downloadUrl' => '/api/arsip/index.php?id=' . (int) $row['id'] . '&download=1',
        ];
    }

    private function uploadError(UploadException $exception): JsonResponse
    {
        $response = response()->json(['error' => $exception->getMessage()], $exception->status);
        if ($exception->retryAfter !== null) {
            $response->headers->set('Retry-After', (string) $exception->retryAfter);
        }
        return $response;
    }
}
