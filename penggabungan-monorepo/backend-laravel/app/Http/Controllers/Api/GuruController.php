<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuruController
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
        $query = DB::table('guru');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Data guru tidak ditemukan'], 404);
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->query('kategori'));
        }

        return response()->json($query->orderBy('urutan')->orderBy('id')->get()->map(
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
        $category = AdminApi::category('guru', $body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $id = DB::table('guru')->insertGetId($this->data($body, $category));
        return response()->json(['id' => (int) $id, 'message' => 'Data guru berhasil ditambahkan'], 201);
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
        $category = AdminApi::category('guru', $body['kategori']);
        if ($category instanceof JsonResponse) {
            return $category;
        }
        if (!DB::table('guru')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Data guru tidak ditemukan'], 404);
        }

        DB::table('guru')->where('id', $id)->update($this->data($body, $category));
        return response()->json(['message' => 'Data guru berhasil diperbarui']);
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
        if (DB::table('guru')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Data guru tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Data guru berhasil dihapus']);
    }

    private function validate(array $body): ?string
    {
        foreach (['nama', 'jabatan', 'kategori'] as $field) {
            if (!is_string($body[$field] ?? null) || trim($body[$field]) === '') {
                return "Field '$field' wajib diisi";
            }
        }
        if (isset($body['urutan']) && $body['urutan'] !== '' && $body['urutan'] !== null
            && (!is_numeric($body['urutan']) || (int) $body['urutan'] != $body['urutan'] || (int) $body['urutan'] < 0)) {
            return "Field 'urutan' harus bilangan bulat 0 atau lebih";
        }

        return null;
    }

    private function data(array $body, string $category): array
    {
        return [
            'nama' => $body['nama'],
            'jabatan' => $body['jabatan'],
            'deskripsi' => $body['deskripsi'] ?? '',
            'kategori' => $category,
            'gambar' => $body['gambar'] ?? null,
            'urutan' => (int) ($body['urutan'] ?? 0),
        ];
    }

    private function formatRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'nama' => $row['nama'],
            'jabatan' => $row['jabatan'],
            'deskripsi' => $row['deskripsi'],
            'kategori' => $row['kategori'],
            'gambar' => $row['gambar'],
            'urutan' => (int) $row['urutan'],
        ];
    }
}
