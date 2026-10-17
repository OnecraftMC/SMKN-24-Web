<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Support\LegacyJwt;

class BeritaController
{
    public function __invoke(Request $request): JsonResponse
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'POST' => $this->create($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->delete($request),
            default => response()->json(['error' => 'Method tidak diizinkan'], 405),
        };
    }

    private function index(Request $request): JsonResponse
    {
        $query = DB::table('berita');

        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            if (!$row) {
                return response()->json(['error' => 'Berita tidak ditemukan'], 404);
            }

            return response()->json($this->formatRow((array) $row));
        }

        if (!$this->jwt()->verify($this->bearerToken($request) ?? '')) {
            $query->where('status', 'terbit');
        }

        if ($request->query('utama') !== null) {
            $query->where('utama', 1);
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->query('kategori'));
        }

        $rows = $query->orderByDesc('tanggal')->orderByDesc('id')->get();

        return response()->json($rows->map(
            fn (object $row): array => $this->formatRow((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!$this->authorized($request)) {
            return $this->unauthorized($request);
        }

        $body = $request->json()->all();
        $error = $this->validateArticle($body);
        if ($error) {
            return response()->json(['error' => $error], 400);
        }

        $category = $this->validateCategory($body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $body['isi'] = $this->sanitizeHtml($body['isi'] ?? null);
        $isFeatured = !empty($body['utama']);

        try {
            $id = DB::transaction(function () use ($body, $category, $isFeatured): int {
                if ($isFeatured) {
                    DB::table('berita')->where('utama', 1)->update(['utama' => 0]);
                }

                return (int) DB::table('berita')->insertGetId([
                    'judul' => $body['judul'],
                    'kategori' => $category,
                    'tanggal' => $body['tanggal'],
                    'gambar' => $body['gambar'] ?? null,
                    'ringkasan' => $body['ringkasan'] ?? '',
                    'isi' => $body['isi'],
                    'status' => $body['status'] ?? 'terbit',
                    'utama' => $isFeatured ? 1 : 0,
                ]);
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['error' => 'Terjadi kesalahan pada server'], 500);
        }

        return response()->json(['id' => $id, 'message' => 'Berita berhasil ditambahkan'], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!$this->authorized($request)) {
            return $this->unauthorized($request);
        }

        $id = (int) $request->query('id', 0);
        if (!$id) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }

        $body = $request->json()->all();
        $error = $this->validateArticle($body);
        if ($error) {
            return response()->json(['error' => $error], 400);
        }

        $category = $this->validateCategory($body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $body['isi'] = $this->sanitizeHtml($body['isi'] ?? null);
        $isFeatured = !empty($body['utama']);

        try {
            $found = DB::transaction(function () use ($id, $body, $category, $isFeatured): bool {
                $exists = DB::table('berita')->where('id', $id)->exists();
                if (!$exists) {
                    return false;
                }

                if ($isFeatured) {
                    DB::table('berita')->where('utama', 1)->where('id', '<>', $id)->update(['utama' => 0]);
                }

                DB::table('berita')->where('id', $id)->update([
                    'judul' => $body['judul'],
                    'kategori' => $category,
                    'tanggal' => $body['tanggal'],
                    'gambar' => $body['gambar'] ?? null,
                    'ringkasan' => $body['ringkasan'] ?? '',
                    'isi' => $body['isi'],
                    'status' => $body['status'] ?? 'terbit',
                    'utama' => $isFeatured ? 1 : 0,
                ]);

                return true;
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['error' => 'Terjadi kesalahan pada server'], 500);
        }

        if (!$found) {
            return response()->json(['error' => 'Berita tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Berita berhasil diperbarui']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!$this->authorized($request)) {
            return $this->unauthorized($request);
        }

        $id = (int) $request->query('id', 0);
        if (!$id) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }

        if (DB::table('berita')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Berita tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Berita berhasil dihapus']);
    }

    private function validateArticle(array $body): ?string
    {
        foreach (['judul', 'kategori', 'tanggal'] as $field) {
            if (!isset($body[$field]) || !is_string($body[$field]) || trim($body[$field]) === '') {
                return "Field '$field' wajib diisi";
            }
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['tanggal'])) {
            return "Field 'tanggal' harus berformat YYYY-MM-DD";
        }
        if (isset($body['status']) && $body['status'] !== ''
            && !in_array($body['status'], ['draft', 'terbit'], true)) {
            return "Field 'status' harus 'draft' atau 'terbit'";
        }

        return null;
    }

    private function validateCategory(string $category): string|JsonResponse
    {
        $category = trim($category);
        if ($category === '' || strlen($category) > 100) {
            return response()->json(['error' => 'Kategori harus berisi maksimal 100 karakter.'], 400);
        }

        $stored = DB::table('admin_categories')
            ->where('module_name', 'berita')
            ->where('category_name', $category)
            ->value('category_name');

        if (!is_string($stored)) {
            return response()->json([
                'error' => 'Kategori belum terdaftar. Tambahkan kategori terlebih dahulu.',
            ], 400);
        }

        return $stored;
    }

    private function formatRow(array $row): array
    {
        require_once base_path('../backend/helpers/sanitize_html.php');
        $isi = $row['isi'] ?? null;

        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'kategori' => $row['kategori'],
            'tanggal' => date('d F Y', strtotime($row['tanggal'])),
            'tanggalIso' => substr((string) $row['tanggal'], 0, 10),
            'gambar' => $row['gambar'],
            'ringkasan' => $row['ringkasan'],
            'isi' => $isi,
            'isiHtml' => isBeritaHtmlContent($isi),
            'status' => $row['status'] ?? null,
            'utama' => (bool) ($row['utama'] ?? 0),
        ];
    }

    private function sanitizeHtml(mixed $value): string
    {
        require_once base_path('../backend/helpers/sanitize_html.php');

        return sanitizeBeritaHtml($value);
    }

    private function authorized(Request $request): bool
    {
        return $this->jwt()->verify($this->bearerToken($request) ?? '') !== null;
    }

    private function bearerToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        return preg_match('/Bearer\s+(.*)$/i', $header, $matches) ? $matches[1] : null;
    }

    private function jwt(): LegacyJwt
    {
        return new LegacyJwt((string) env('JWT_SECRET', ''));
    }

    private function unauthorized(Request $request): JsonResponse
    {
        $message = $this->bearerToken($request)
            ? 'Token tidak valid atau sudah kedaluwarsa.'
            : 'Token tidak ditemukan. Silakan login.';

        return response()->json(['error' => $message], 401);
    }
}
