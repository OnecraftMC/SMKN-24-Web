<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GaleriController
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
        $query = DB::table('galeri');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Galeri tidak ditemukan'], 404);
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->query('kategori'));
        }

        return response()->json($query->orderByDesc('id')->get()->map(
            fn (object $row): array => $this->formatRow((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $body = $request->json()->all();
        if ($error = $this->validate($body)) {
            return response()->json(['error' => $error], 400);
        }
        $category = AdminApi::category('galeri', $body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $id = DB::table('galeri')->insertGetId([
            'judul' => $body['judul'],
            'kategori' => $category,
            'gambar' => $body['gambar'],
        ]);

        return response()->json(['id' => (int) $id, 'message' => 'Galeri berhasil ditambahkan'], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $id = (int) $request->query('id', 0);
        if (!$id) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }
        $body = $request->json()->all();
        if ($error = $this->validate($body)) {
            return response()->json(['error' => $error], 400);
        }
        $category = AdminApi::category('galeri', $body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }
        if (!DB::table('galeri')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Galeri tidak ditemukan'], 404);
        }

        DB::table('galeri')->where('id', $id)->update([
            'judul' => $body['judul'],
            'kategori' => $category,
            'gambar' => $body['gambar'],
        ]);

        return response()->json(['message' => 'Galeri berhasil diperbarui']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $id = (int) $request->query('id', 0);
        if (!$id) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }
        if (DB::table('galeri')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Galeri tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Galeri berhasil dihapus']);
    }

    private function validate(array $body): ?string
    {
        foreach (['judul', 'kategori', 'gambar'] as $field) {
            if (!is_string($body[$field] ?? null) || trim($body[$field]) === '') {
                return "Field '$field' wajib diisi";
            }
        }

        return null;
    }

    private function formatRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'kategori' => $row['kategori'],
            'gambar' => $row['gambar'],
        ];
    }
}
