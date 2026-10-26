<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KelulusanController
{
    private const STATUSES = ['Lulus', 'Tidak Lulus'];

    public function __invoke(Request $request): JsonResponse
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'POST' => $request->query('action') === 'cek'
                ? $this->check($request)
                : $this->create($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->delete($request),
            default => response()->json(['error' => 'Method tidak diizinkan.'], 405),
        };
    }

    private function check(Request $request): JsonResponse
    {
        $nisn = is_string($request->input('nisn')) ? trim($request->input('nisn')) : '';
        if (!preg_match('/\A\d{10}\z/', $nisn)) {
            return response()->json(['error' => 'NISN harus terdiri dari 10 digit.'], 400)->header('Cache-Control', 'no-store, private');
        }

        $row = DB::table('kelulusan')->where('nisn', $nisn)->where('aktif', true)
            ->first(['nama_siswa', 'kelas', 'jurusan', 'tahun_lulus', 'status']);
        if (!$row) {
            return response()->json([
                'error' => 'Data kelulusan tidak ditemukan. Periksa NISN atau hubungi pihak sekolah.',
            ], 404)->header('Cache-Control', 'no-store, private');
        }

        return response()->json([
            'namaSiswa' => $row->nama_siswa,
            'kelas' => $row->kelas,
            'jurusan' => $row->jurusan,
            'tahunLulus' => (int) $row->tahun_lulus,
            'status' => $row->status,
        ])->header('Cache-Control', 'no-store, private');
    }

    private function index(Request $request): JsonResponse
    {
        if ($request->query('admin') !== '1' || !AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request)->header('Cache-Control', 'no-store, private');
        }
        $rows = DB::table('kelulusan')->orderByDesc('tahun_lulus')->orderBy('nama_siswa')->get();
        return response()->json($rows->map(fn ($row): array => $this->format((array) $row))->all())
            ->header('Cache-Control', 'no-store, private');
    }

    private function create(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $values = $this->validated($request);
        if ($values instanceof JsonResponse) return $values;
        if (DB::table('kelulusan')->where('nisn', $values['nisn'])->exists()) {
            return response()->json(['error' => 'NISN sudah memiliki data kelulusan.'], 409);
        }
        $id = DB::table('kelulusan')->insertGetId($values);
        return response()->json(['id' => (int) $id, 'message' => 'Data kelulusan berhasil ditambahkan.'], 201);
    }

    private function update(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if (!$id || $id < 1) return response()->json(['error' => 'Parameter id tidak valid.'], 400);
        if (!DB::table('kelulusan')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Data kelulusan tidak ditemukan.'], 404);
        }
        $values = $this->validated($request);
        if ($values instanceof JsonResponse) return $values;
        if (DB::table('kelulusan')->where('nisn', $values['nisn'])->where('id', '<>', $id)->exists()) {
            return response()->json(['error' => 'NISN sudah memiliki data kelulusan.'], 409);
        }
        DB::table('kelulusan')->where('id', $id)->update($values);
        return response()->json(['message' => 'Data kelulusan berhasil diperbarui.']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) return AdminApi::unauthorized($request);
        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if (!$id || $id < 1) return response()->json(['error' => 'Parameter id tidak valid.'], 400);
        if (!DB::table('kelulusan')->where('id', $id)->delete()) {
            return response()->json(['error' => 'Data kelulusan tidak ditemukan.'], 404);
        }
        return response()->json(['message' => 'Data kelulusan berhasil dihapus.']);
    }

    private function validated(Request $request): array|JsonResponse
    {
        $nisn = is_string($request->input('nisn')) ? trim($request->input('nisn')) : '';
        if (!preg_match('/\A\d{10}\z/', $nisn)) return response()->json(['error' => 'NISN harus terdiri dari 10 digit.'], 400);

        $fields = [
            'namaSiswa' => ['nama_siswa', 150],
            'kelas' => ['kelas', 80],
            'jurusan' => ['jurusan', 100],
        ];
        $values = ['nisn' => $nisn];
        foreach ($fields as $input => [$column, $max]) {
            $value = is_string($request->input($input)) ? trim($request->input($input)) : '';
            if ($value === '' || mb_strlen($value, 'UTF-8') > $max) {
                return response()->json(['error' => "Field '$input' wajib diisi, maksimal $max karakter."], 400);
            }
            $values[$column] = $value;
        }

        $year = filter_var($request->input('tahunLulus'), FILTER_VALIDATE_INT);
        if (!$year || $year < 1950 || $year > (int) date('Y') + 1) {
            return response()->json(['error' => 'Tahun lulus tidak valid.'], 400);
        }
        $status = $request->input('status');
        if (!is_string($status) || !in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Status kelulusan tidak valid.'], 400);
        }
        $active = $request->input('aktif');
        if (!in_array($active, [true, false, 0, 1, '0', '1'], true)) {
            return response()->json(['error' => "Field 'aktif' harus berupa boolean."], 400);
        }
        $values['tahun_lulus'] = $year;
        $values['status'] = $status;
        $values['aktif'] = (int) (bool) $active;
        return $values;
    }

    private function format(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'nisn' => $row['nisn'],
            'namaSiswa' => $row['nama_siswa'],
            'kelas' => $row['kelas'],
            'jurusan' => $row['jurusan'],
            'tahunLulus' => (int) $row['tahun_lulus'],
            'status' => $row['status'],
            'aktif' => (bool) $row['aktif'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
}
