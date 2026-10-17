<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BkController
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
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $rows = DB::table('pesan_bk')
            ->orderByDesc('butuh_perhatian')
            ->orderByRaw("FIELD(IFNULL(tingkat_kesulitan, 'zzz'), 'Berat', 'Sedang', 'Ringan', 'zzz')")
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($rows->map(static function (object $row): array {
            return [
                'id' => (int) $row->id,
                'nama' => $row->nama,
                'kelas' => $row->kelas,
                'noHp' => $row->no_hp,
                'keperluan' => $row->keperluan,
                'pesan' => $row->pesan,
                'status' => $row->status,
                'kategori' => $row->kategori,
                'tanggal' => $row->tanggal,
                'ringkasan' => $row->ringkasan,
                'tingkatKesulitan' => $row->tingkat_kesulitan,
                'butuhPerhatian' => (bool) $row->butuh_perhatian,
                'transkrip' => $row->transkrip,
                'media' => json_decode((string) $row->media_json, true) ?: [],
                'canReply' => !empty($row->device_id),
            ];
        })->values());
    }

    private function create(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        foreach (['nama', 'kelas', 'keperluan', 'pesan'] as $field) {
            if (empty($body[$field])) {
                return response()->json(['error' => "Field '$field' wajib diisi"], 400);
            }
        }

        DB::table('pesan_bk')->insert([
            'nama' => $body['nama'],
            'kelas' => $body['kelas'],
            'no_hp' => $body['noHp'] ?? null,
            'keperluan' => $body['keperluan'],
            'pesan' => $body['pesan'],
        ]);

        return response()->json([
            'message' => 'Pesan Anda berhasil dikirim ke Guru BK. Terima kasih!',
        ], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $id = $request->integer('id');
        if ($id <= 0) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }
        $body = $request->json()->all();

        if (array_key_exists('reply', $body)) {
            return $this->reply($id, $body['reply']);
        }

        $hasStatus = array_key_exists('status', $body);
        $hasCategory = array_key_exists('kategori', $body);
        if (!$hasStatus && !$hasCategory) {
            return response()->json(['error' => 'Status atau kategori harus diubah.'], 400);
        }
        if ($hasStatus && !in_array($body['status'], ['Baru', 'Diproses', 'Selesai'], true)) {
            return response()->json(['error' => 'Status tidak valid'], 400);
        }
        if (!DB::table('pesan_bk')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Data tidak ditemukan.'], 404);
        }

        $changes = [];
        if ($hasStatus) {
            $changes['status'] = $body['status'];
        }
        if ($hasCategory) {
            $category = AdminApi::category('bk', $body['kategori']);
            if ($category instanceof JsonResponse) {
                return $category;
            }
            $changes['kategori'] = $category;
        }
        DB::table('pesan_bk')->where('id', $id)->update($changes);

        return response()->json(['message' => 'Pesan BK berhasil diperbarui.']);
    }

    private function reply(int $id, mixed $value): JsonResponse
    {
        if (!is_string($value)) {
            return response()->json(['error' => 'Balasan harus berupa teks.'], 400);
        }
        $reply = trim($value);
        if ($reply === '') {
            return response()->json(['error' => 'Balasan tidak boleh kosong.'], 400);
        }
        if (mb_strlen($reply, 'UTF-8') > 5000) {
            return response()->json(['error' => 'Balasan maksimal 5.000 karakter.'], 400);
        }

        $result = DB::transaction(static function () use ($id, $reply): ?JsonResponse {
            $row = DB::table('pesan_bk')->where('id', $id)->lockForUpdate()->first();
            if (!$row) {
                return response()->json(['error' => 'Pesan tidak ditemukan.'], 404);
            }
            if (empty($row->device_id)) {
                return response()->json([
                    'error' => 'Pesan ini tidak terhubung dengan riwayat perangkat siswa, jadi balasan web tidak dapat dikirim.',
                ], 409);
            }

            $messages = json_decode((string) $row->transkrip, true);
            if (!is_array($messages)) {
                $messages = [];
            }
            $messages[] = [
                'sender' => 'counselor',
                'text' => $reply,
                'sentAt' => now()->toAtomString(),
            ];
            $transcript = json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($transcript === false) {
                return response()->json(['error' => 'Balasan tidak dapat disimpan.'], 500);
            }

            DB::table('pesan_bk')->where('id', $id)->update([
                'transkrip' => $transcript,
                'status' => 'Diproses',
            ]);

            return null;
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }

        return response()->json([
            'message' => 'Balasan Guru BK berhasil dikirim.',
            'status' => 'Diproses',
        ]);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $id = $request->integer('id');
        if ($id <= 0) {
            return response()->json(['error' => 'Parameter id wajib diisi'], 400);
        }
        if (DB::table('pesan_bk')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Data tidak ditemukan'], 404);
        }

        return response()->json(['message' => 'Pesan berhasil dihapus']);
    }
}
