<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HubIndustriController
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
        $public = $request->query('public') === '1';
        if (!$public && !AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $query = DB::table('hub_industri');
        if ($request->filled('id')) {
            $query->where('id', (int) $request->query('id'));
            if ($public) $query->where('aktif', 1);
            $row = $query->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Mitra industri tidak ditemukan'], 404);
        }
        if ($public) $query->where('aktif', 1);

        return response()->json($query->orderBy('urutan')->orderBy('id')->get()->map(
            fn (object $row): array => $this->formatRow((array) $row)
        )->values());
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $body = $request->json()->all();
        if (($error = $this->validateBody($body)) !== null) return $error;

        $id = DB::table('hub_industri')->insertGetId($this->values($body));
        return response()->json(['id' => (int) $id, 'message' => 'Mitra industri berhasil ditambahkan'], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $id = (int) $request->query('id', 0);
        if (!$id) return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        $body = $request->json()->all();
        if (($error = $this->validateBody($body)) !== null) return $error;
        if (!DB::table('hub_industri')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Mitra industri tidak ditemukan'], 404);
        }

        DB::table('hub_industri')->where('id', $id)->update($this->values($body));
        return response()->json(['message' => 'Mitra industri berhasil diperbarui']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $id = (int) $request->query('id', 0);
        if (!$id) return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        if (DB::table('hub_industri')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Mitra industri tidak ditemukan'], 404);
        }
        return response()->json(['message' => 'Mitra industri berhasil dihapus']);
    }

    private function validateBody(array $body): ?JsonResponse
    {
        foreach (['nama' => 255, 'alamat' => 5000, 'deskripsi' => 10000] as $field => $max) {
            if (!is_string($body[$field] ?? null) || trim($body[$field]) === '') {
                return response()->json(['error' => "Field '$field' wajib diisi"], 400);
            }
            if (strlen(trim($body[$field])) > $max) {
                return response()->json(['error' => "Field '$field' terlalu panjang"], 400);
            }
        }
        foreach (['logo' => 500, 'linkLabel' => 120, 'linkHref' => 500] as $field => $max) {
            if (isset($body[$field]) && (!is_string($body[$field]) || strlen($body[$field]) > $max)) {
                return response()->json(['error' => "Field '$field' tidak valid"], 400);
            }
        }
        $label = trim((string) ($body['linkLabel'] ?? ''));
        $href = trim((string) ($body['linkHref'] ?? ''));
        if (($label === '') !== ($href === '')) {
            return response()->json(['error' => 'Label dan tautan aksi harus diisi bersama'], 400);
        }
        if ($href !== '' && !preg_match('~^(https?://|mailto:|tel:|/)~i', $href)) {
            return response()->json(['error' => 'Tautan aksi tidak valid'], 400);
        }
        if (isset($body['urutan']) && filter_var($body['urutan'], FILTER_VALIDATE_INT) === false) {
            return response()->json(['error' => "Field 'urutan' harus berupa angka"], 400);
        }
        if (array_key_exists('aktif', $body) && !is_bool($body['aktif']) && !in_array($body['aktif'], [0, 1, '0', '1'], true)) {
            return response()->json(['error' => "Field 'aktif' harus berupa boolean"], 400);
        }
        return null;
    }

    private function values(array $body): array
    {
        return [
            'nama' => trim($body['nama']),
            'logo' => $this->optional($body, 'logo'),
            'alamat' => trim($body['alamat']),
            'deskripsi' => trim($body['deskripsi']),
            'link_label' => $this->optional($body, 'linkLabel'),
            'link_href' => $this->optional($body, 'linkHref'),
            'urutan' => (int) ($body['urutan'] ?? 0),
            'aktif' => !array_key_exists('aktif', $body) || !empty($body['aktif']) ? 1 : 0,
        ];
    }

    private function optional(array $body, string $field): ?string
    {
        $value = trim((string) ($body[$field] ?? ''));
        return $value === '' ? null : $value;
    }

    private function formatRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'nama' => $row['nama'],
            'logo' => $row['logo'],
            'alamat' => $row['alamat'],
            'deskripsi' => $row['deskripsi'],
            'linkLabel' => $row['link_label'],
            'linkHref' => $row['link_href'],
            'urutan' => (int) $row['urutan'],
            'aktif' => (bool) $row['aktif'],
        ];
    }
}
