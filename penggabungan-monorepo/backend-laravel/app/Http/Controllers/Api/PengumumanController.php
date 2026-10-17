<?php

namespace App\Http\Controllers\Api;

use App\Support\LegacyJwt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class PengumumanController
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
        $query = DB::table('pengumuman');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Pengumuman tidak ditemukan'], 404);
        }

        if ($request->query('beranda') !== null) {
            $query->where('tampil_beranda', 1);
        }

        return response()->json($query->orderByDesc('tanggal')->orderByDesc('id')->get()->map(
            fn (object $row): array => $this->formatRow((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!$this->authorized($request)) {
            return $this->unauthorized($request);
        }

        $body = $request->json()->all();
        $invalid = $this->validate($body);
        if ($invalid) {
            return response()->json(['error' => $invalid], 400);
        }

        $category = $this->validateCategory($body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        try {
            $id = DB::transaction(function () use ($body, $category): int {
                if (!empty($body['tampilBeranda'])) {
                    DB::table('pengumuman')->update(['tampil_beranda' => 0]);
                }

                return (int) DB::table('pengumuman')->insertGetId($this->data($body, $category));
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['error' => 'Terjadi kesalahan pada server'], 500);
        }

        return response()->json([
            'id' => $id,
            'message' => 'Pengumuman berhasil ditambahkan',
        ], 201);
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
        $invalid = $this->validate($body);
        if ($invalid) {
            return response()->json(['error' => $invalid], 400);
        }

        $category = $this->validateCategory($body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        try {
            $found = DB::transaction(function () use ($id, $body, $category): bool {
                if (!DB::table('pengumuman')->where('id', $id)->exists()) {
                    return false;
                }

                if (!empty($body['tampilBeranda'])) {
                    DB::table('pengumuman')->where('id', '<>', $id)->update(['tampil_beranda' => 0]);
                }
                DB::table('pengumuman')->where('id', $id)->update($this->data($body, $category));

                return true;
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['error' => 'Terjadi kesalahan pada server'], 500);
        }

        if (!$found) {
            return response()->json(['error' => 'Pengumuman tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Pengumuman berhasil diperbarui']);
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
        if (DB::table('pengumuman')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Pengumuman tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Pengumuman berhasil dihapus']);
    }

    private function validate(array $body): ?string
    {
        foreach (['judul', 'tanggal', 'kategori'] as $field) {
            if (!isset($body[$field]) || !is_string($body[$field]) || trim($body[$field]) === '') {
                return "Field '$field' wajib diisi";
            }
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['tanggal'])) {
            return "Field 'tanggal' harus berformat YYYY-MM-DD";
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
            ->where('module_name', 'pengumuman')
            ->where('category_name', $category)
            ->value('category_name');
        if (!is_string($stored)) {
            return response()->json([
                'error' => 'Kategori belum terdaftar. Tambahkan kategori terlebih dahulu.',
            ], 400);
        }

        return $stored;
    }

    private function data(array $body, string $category): array
    {
        return [
            'judul' => $body['judul'],
            'isi' => $body['isi'] ?? '',
            'tanggal' => $body['tanggal'],
            'kategori' => $category,
            'penting' => !empty($body['penting']) ? 1 : 0,
            'gambar' => $body['gambar'] ?? null,
            'badge' => $body['badge'] ?? null,
            'status' => $body['status'] ?? null,
            'link_label' => $body['linkLabel'] ?? null,
            'link_href' => $body['linkHref'] ?? null,
            'icon' => $body['icon'] ?? null,
            'action_icon' => $body['actionIcon'] ?? null,
            'variant' => $body['variant'] ?? null,
            'tampil_beranda' => !empty($body['tampilBeranda']) ? 1 : 0,
        ];
    }

    private function formatRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'isi' => $row['isi'],
            'tanggal' => date('d F Y', strtotime($row['tanggal'])),
            'tanggalIso' => substr((string) $row['tanggal'], 0, 10),
            'kategori' => $row['kategori'],
            'penting' => (bool) $row['penting'],
            'gambar' => $row['gambar'],
            'badge' => $row['badge'],
            'status' => $row['status'],
            'linkLabel' => $row['link_label'],
            'linkHref' => $row['link_href'],
            'icon' => $row['icon'],
            'actionIcon' => $row['action_icon'],
            'variant' => $row['variant'],
            'tampilBeranda' => (bool) $row['tampil_beranda'],
        ];
    }

    private function authorized(Request $request): bool
    {
        return (new LegacyJwt((string) env('JWT_SECRET', '')))
            ->verify($request->bearerToken() ?? '') !== null;
    }

    private function unauthorized(Request $request): JsonResponse
    {
        return response()->json([
            'error' => $request->bearerToken()
                ? 'Token tidak valid atau sudah kedaluwarsa.'
                : 'Token tidak ditemukan. Silakan login.',
        ], 401);
    }
}
