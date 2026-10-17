<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AspirasiController
{
    public function __invoke(Request $request): JsonResponse
    {
        return match ($request->method()) {
            'POST' => $this->create($request),
            'GET' => $this->index($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->delete($request),
            default => response()->json(['error' => 'Method tidak diizinkan'], 405),
        };
    }

    private function create(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        if (empty($body['pesan'])) {
            return response()->json(['error' => "Field 'pesan' wajib diisi"], 400);
        }
        DB::table('aspirasi')->insert([
            'nama' => $body['nama'] ?? null,
            'email' => $body['email'] ?? null,
            'kategori' => $body['kategori'] ?? null,
            'pesan' => $body['pesan'],
        ]);
        return response()->json(['message' => 'Aspirasi Anda berhasil dikirim. Terima kasih!'], 201);
    }

    private function index(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        return response()->json(DB::table('aspirasi')->orderByDesc('created_at')->get());
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
        $status = $request->json('status');
        if (!in_array($status, ['Baru', 'Ditinjau', 'Selesai'], true)) {
            return response()->json(['error' => 'Status tidak valid'], 400);
        }
        $exists = DB::table('aspirasi')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['error' => 'Data tidak ditemukan atau tidak ada perubahan'], 404);
        }
        DB::table('aspirasi')->where('id', $id)->update(['status' => $status]);
        return response()->json(['message' => 'Status berhasil diperbarui']);
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
        if (DB::table('aspirasi')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Data tidak ditemukan'], 404);
        }
        return response()->json(['message' => 'Aspirasi berhasil dihapus']);
    }
}
