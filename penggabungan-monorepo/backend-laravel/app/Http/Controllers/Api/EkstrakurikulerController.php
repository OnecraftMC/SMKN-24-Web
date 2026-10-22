<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EkstrakurikulerController
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
        $query = DB::table('ekstrakurikuler');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Ekstrakurikuler tidak ditemukan'], 404);
        }
        if ($request->query('unggulan') === '1') {
            $query->where('unggulan', 1);
        }
        $category = trim((string) $request->query('kategori', ''));
        if ($category !== '') {
            $query->where('kategori', $category);
        }

        return response()->json(
            $query->orderByDesc('unggulan')->orderBy('nama')->orderBy('id')->get()->map(
                fn (object $row): array => $this->formatRow((array) $row)
            )->values()
        );
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $body = $request->json()->all();
        $name = $this->validatedName($body);
        if ($name instanceof JsonResponse) {
            return $name;
        }
        foreach ($this->optionalFields() as $field => $maxLength) {
            $error = $this->validateOptional($body, $field, $maxLength);
            if ($error instanceof JsonResponse) {
                return $error;
            }
        }
        $error = $this->validateFeatureFlag($body);
        if ($error !== null) {
            return response()->json(['error' => $error], 400);
        }

        $id = DB::table('ekstrakurikuler')->insertGetId([
            'nama' => $name,
            'deskripsi' => $this->optional($body, 'deskripsi'),
            'logo' => $this->optional($body, 'logo'),
            'kategori' => $this->optional($body, 'kategori'),
            'pembina' => $this->optional($body, 'pembina'),
            'jadwal' => $this->optional($body, 'jadwal'),
            'lokasi' => $this->optional($body, 'lokasi'),
            'unggulan' => !empty($body['unggulan']) ? 1 : 0,
        ]);

        return response()->json([
            'id' => (int) $id,
            'message' => 'Ekstrakurikuler berhasil ditambahkan',
        ], 201);
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
        $name = $this->validatedName($body);
        if ($name instanceof JsonResponse) {
            return $name;
        }
        foreach ($this->optionalFields() as $field => $maxLength) {
            $error = $this->validateOptional($body, $field, $maxLength);
            if ($error instanceof JsonResponse) {
                return $error;
            }
        }
        $error = $this->validateFeatureFlag($body);
        if ($error !== null) {
            return response()->json(['error' => $error], 400);
        }
        $existing = DB::table('ekstrakurikuler')->where('id', $id)->first(['unggulan']);
        if (!$existing) {
            return response()->json(['error' => 'Ekstrakurikuler tidak ditemukan'], 404);
        }

        DB::table('ekstrakurikuler')->where('id', $id)->update([
            'nama' => $name,
            'deskripsi' => $this->optional($body, 'deskripsi'),
            'logo' => $this->optional($body, 'logo'),
            'kategori' => $this->optional($body, 'kategori'),
            'pembina' => $this->optional($body, 'pembina'),
            'jadwal' => $this->optional($body, 'jadwal'),
            'lokasi' => $this->optional($body, 'lokasi'),
            'unggulan' => array_key_exists('unggulan', $body)
                ? (!empty($body['unggulan']) ? 1 : 0)
                : (int) $existing->unggulan,
        ]);

        return response()->json(['message' => 'Ekstrakurikuler berhasil diperbarui']);
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
        if (DB::table('ekstrakurikuler')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Ekstrakurikuler tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Ekstrakurikuler berhasil dihapus']);
    }

    private function validatedName(array $body): string|JsonResponse
    {
        $name = $body['nama'] ?? null;
        if (!is_string($name) || trim($name) === '') {
            return response()->json(['error' => "Field 'nama' wajib diisi"], 400);
        }
        $name = trim($name);
        if (mb_strlen($name) > 150) {
            return response()->json(['error' => "Field 'nama' maksimal 150 karakter"], 400);
        }
        return $name;
    }

    /** @return array<string, int> */
    private function optionalFields(): array
    {
        return [
            'deskripsi' => 5000,
            'logo' => 500,
            'kategori' => 100,
            'pembina' => 150,
            'jadwal' => 150,
            'lokasi' => 150,
        ];
    }

    private function validateOptional(array $body, string $field, int $maxLength): ?JsonResponse
    {
        if (!array_key_exists($field, $body) || $body[$field] === null) {
            return null;
        }
        if (!is_string($body[$field])) {
            return response()->json(['error' => "Field '{$field}' harus berupa teks"], 400);
        }
        if (mb_strlen(trim($body[$field])) > $maxLength) {
            return response()->json([
                'error' => "Field '{$field}' maksimal {$maxLength} karakter",
            ], 400);
        }
        return null;
    }

    private function optional(array $body, string $field): ?string
    {
        if (!array_key_exists($field, $body) || !is_string($body[$field])) {
            return null;
        }
        $value = trim($body[$field]);
        return $value === '' ? null : $value;
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
            'nama' => $row['nama'],
            'deskripsi' => $row['deskripsi'] ?? null,
            'logo' => $row['logo'] ?? null,
            'kategori' => $row['kategori'] ?? null,
            'pembina' => $row['pembina'] ?? null,
            'jadwal' => $row['jadwal'] ?? null,
            'lokasi' => $row['lokasi'] ?? null,
            'unggulan' => (bool) ($row['unggulan'] ?? 0),
        ];
    }
}
