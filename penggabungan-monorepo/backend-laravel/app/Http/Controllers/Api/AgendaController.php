<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgendaController
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
        $query = DB::table('agenda');
        if ($request->filled('id')) {
            $row = $query->where('id', (int) $request->query('id'))->first();
            return $row
                ? response()->json($this->formatRow((array) $row))
                : response()->json(['error' => 'Agenda tidak ditemukan'], 404);
        }
        if ($request->query('beranda') !== null) {
            $query->where('tampil_beranda', 1);
        }

        return response()->json($query->orderBy('tgl_mulai')->orderBy('id')->get()->map(
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
        $category = AdminApi::category('agenda', $body['kategori'] ?? null);
        if ($category instanceof JsonResponse) {
            return $category;
        }

        $id = DB::table('agenda')->insertGetId($this->data($body, $category));
        return response()->json(['id' => (int) $id, 'message' => 'Agenda berhasil ditambahkan'], 201);
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
        $category = AdminApi::category('agenda', $body['kategori'] ?? null);
        if ($category instanceof JsonResponse) {
            return $category;
        }
        if (!DB::table('agenda')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Agenda tidak ditemukan'], 404);
        }

        DB::table('agenda')->where('id', $id)->update($this->data($body, $category));
        return response()->json(['message' => 'Agenda berhasil diperbarui']);
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
        if (DB::table('agenda')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Agenda tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Agenda berhasil dihapus']);
    }

    private function validate(array $body): ?string
    {
        foreach (['judul', 'tglMulai'] as $field) {
            if (!isset($body[$field]) || !is_string($body[$field]) || trim($body[$field]) === '') {
                return "Field '$field' wajib diisi";
            }
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['tglMulai'])) {
            return "Field 'tglMulai' harus berformat YYYY-MM-DD";
        }
        $end = $body['tglSelesai'] ?? null;
        if ($end !== null && $end !== '') {
            if (!is_string($end) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
                return "Field 'tglSelesai' harus berformat YYYY-MM-DD";
            }
            if ($end < $body['tglMulai']) {
                return 'Tanggal selesai tidak boleh mendahului tanggal mulai';
            }
        }

        return null;
    }

    private function data(array $body, ?string $category): array
    {
        return [
            'judul' => $body['judul'],
            'tgl_mulai' => $body['tglMulai'],
            'tgl_selesai' => $body['tglSelesai'] ?? null,
            'waktu' => $body['waktu'] ?? null,
            'lokasi' => $body['lokasi'] ?? null,
            'badge' => $body['badge'] ?? null,
            'kategori' => $category,
            'deskripsi' => $body['deskripsi'] ?? null,
            'gambar' => $body['gambar'] ?? null,
            'tampil_beranda' => !empty($body['tampilBeranda']) ? 1 : 0,
        ];
    }

    private function formatRow(array $row): array
    {
        $start = strtotime($row['tgl_mulai']);
        $end = !empty($row['tgl_selesai']) ? strtotime($row['tgl_selesai']) : false;
        $date = $end && date('Y-m-d', $end) !== date('Y-m-d', $start)
            ? date('d', $start) . ' - ' . date('d F Y', $end)
            : date('d F Y', $start);

        return [
            'id' => (int) $row['id'],
            'judul' => $row['judul'],
            'tanggal' => $date,
            'tglMulai' => $row['tgl_mulai'],
            'tglSelesai' => $row['tgl_selesai'],
            'waktu' => $row['waktu'],
            'lokasi' => $row['lokasi'],
            'badge' => $row['badge'],
            'kategori' => $row['kategori'] ?? null,
            'deskripsi' => $row['deskripsi'],
            'gambar' => $row['gambar'],
            'day' => (int) date('d', $start),
            'month' => strtoupper(date('M', $start)),
            'tampilBeranda' => (bool) $row['tampil_beranda'],
        ];
    }
}
