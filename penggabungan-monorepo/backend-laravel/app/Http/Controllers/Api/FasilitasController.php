<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FasilitasController
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
        $query = DB::table('fasilitas');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Fasilitas tidak ditemukan'], 404);
        }
        if ($request->query('unggulan') === '1') {
            $query->where('unggulan', 1);
        }

        return response()->json($query->orderBy('id')->get()->map(
            fn (object $row): array => $this->formatRow((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $body = $request->json()->all();
        if (!is_string($body['judul'] ?? null) || trim($body['judul']) === '') {
            return response()->json(['error' => "Field 'judul' wajib diisi"], 400);
        }
        if (($error = $this->validateFeatureFlag($body)) !== null) {
            return response()->json(['error' => $error], 400);
        }
        $category = AdminApi::category('fasilitas', $body['kategori'] ?? null);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $id = DB::table('fasilitas')->insertGetId([
            'judul' => $body['judul'],
            'deskripsi' => $body['deskripsi'] ?? '',
            'gambar' => $body['gambar'] ?? null,
            'kategori' => $category,
            'unggulan' => !empty($body['unggulan']) ? 1 : 0,
        ]);

        return response()->json(['id' => (int) $id, 'message' => 'Fasilitas berhasil ditambahkan'], 201);
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
        if (!is_string($body['judul'] ?? null) || trim($body['judul']) === '') {
            return response()->json(['error' => "Field 'judul' wajib diisi"], 400);
        }
        if (($error = $this->validateFeatureFlag($body)) !== null) {
            return response()->json(['error' => $error], 400);
        }
        $category = AdminApi::category('fasilitas', $body['kategori'] ?? null);
        if ($category instanceof JsonResponse) {
            return $category;
        }
        $existing = DB::table('fasilitas')->where('id', $id)->first(['unggulan']);
        if (!$existing) {
            return response()->json(['error' => 'Fasilitas tidak ditemukan'], 404);
        }

        DB::table('fasilitas')->where('id', $id)->update([
            'judul' => $body['judul'],
            'deskripsi' => $body['deskripsi'] ?? '',
            'gambar' => $body['gambar'] ?? null,
            'kategori' => $category,
            'unggulan' => array_key_exists('unggulan', $body)
                ? (!empty($body['unggulan']) ? 1 : 0)
                : (int) $existing->unggulan,
        ]);

        return response()->json(['message' => 'Fasilitas berhasil diperbarui']);
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
        if (DB::table('fasilitas')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Fasilitas tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Fasilitas berhasil dihapus']);
    }

    private function validateFeatureFlag(array $body): ?string
    {
        if (array_key_exists('unggulan', $body)
            && !is_bool($body['unggulan'])
            && !in_array($body['unggulan'], [0, 1, '0', '1'], true)) {
            return "Field 'unggulan' harus berupa boolean";
        }

        return null;
    }

    private function formatRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'deskripsi' => $row['deskripsi'],
            'gambar' => $row['gambar'],
            'kategori' => $row['kategori'] ?? null,
            'unggulan' => (bool) ($row['unggulan'] ?? 0),
        ];
    }
}
