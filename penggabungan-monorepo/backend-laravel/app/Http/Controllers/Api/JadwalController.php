<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JadwalController
{
    private const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    private const PROGRAMS = ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata'];

    public function __invoke(Request $request): JsonResponse
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'POST' => $this->save($request),
            'DELETE' => $this->delete($request),
            default => response()->json(['error' => 'Method tidak diizinkan'], 405),
        };
    }

    private function index(Request $request): JsonResponse
    {
        if ($request->query('admin') !== null && !AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $classes = DB::table('jadwal_kelas')
            ->select('id', 'nama', 'jurusan', 'tingkat')
            ->orderBy('jurusan')->orderBy('tingkat')->orderBy('rombel')->get()
            ->map(fn (object $row): array => [
                'id' => (int) $row->id,
                'nama' => $row->nama,
                'jurusan' => $row->jurusan,
                'tingkat' => (int) $row->tingkat,
            ]);

        $classId = filter_var($request->query('kelas_id'), FILTER_VALIDATE_INT);
        $query = DB::table('jadwal_pelajaran')->selectRaw(
            'id, kelas_id, hari, TIME_FORMAT(jam_mulai, "%H:%i") AS jam_mulai, TIME_FORMAT(jam_selesai, "%H:%i") AS jam_selesai, mapel, guru'
        );
        if ($classId !== false && $classId !== null) {
            $query->where('kelas_id', $classId);
        }
        $query->orderByRaw('FIELD(hari, "senin", "selasa", "rabu", "kamis", "jumat", "sabtu")')
            ->orderBy('jam_mulai');
        if ($classId === false || $classId === null) {
            $query->orderBy('kelas_id');
        }

        return response()->json([
            'classes' => $classes,
            'schedules' => $query->get()->map(fn (object $row): array => [
                'id' => (int) $row->id,
                'kelasId' => (int) $row->kelas_id,
                'hari' => $row->hari,
                'jamMulai' => $row->jam_mulai,
                'jamSelesai' => $row->jam_selesai,
                'mapel' => $row->mapel,
                'guru' => $row->guru,
            ]),
        ]);
    }

    private function save(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        return $request->query('resource') === 'kelas'
            ? $this->saveClass($request)
            : $this->saveSchedule($request);
    }

    private function saveSchedule(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $id = array_key_exists('id', $body) ? filter_var($body['id'], FILTER_VALIDATE_INT) : null;
        $classId = filter_var($body['kelasId'] ?? null, FILTER_VALIDATE_INT);
        $day = strtolower(trim((string) ($body['hari'] ?? '')));
        $start = trim((string) ($body['jamMulai'] ?? ''));
        $end = trim((string) ($body['jamSelesai'] ?? ''));
        $subject = trim((string) ($body['mapel'] ?? ''));
        $teacher = trim((string) ($body['guru'] ?? ''));

        if ($classId === false || $classId < 1) {
            return response()->json(['error' => "Field 'kelasId' wajib diisi."], 400);
        }
        if (!in_array($day, self::DAYS, true)) {
            return response()->json(['error' => "Field 'hari' tidak valid."], 400);
        }
        if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $start)
            || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $end) || $start >= $end) {
            return response()->json([
                'error' => 'Jam mulai dan selesai harus valid; jam selesai harus setelah jam mulai.',
            ], 400);
        }
        if ($subject === '' || mb_strlen($subject) > 255) {
            return response()->json(['error' => 'Nama mata pelajaran wajib diisi (maksimal 255 karakter).'], 400);
        }
        if (mb_strlen($teacher) > 150) {
            return response()->json(['error' => 'Nama guru maksimal 150 karakter.'], 400);
        }
        if ($id === false || ($id !== null && $id < 1)) {
            return response()->json(['error' => "Field 'id' tidak valid."], 400);
        }

        $result = DB::transaction(function () use ($id, $classId, $day, $start, $end, $subject, $teacher) {
            if (!DB::table('jadwal_kelas')->where('id', $classId)->lockForUpdate()->exists()) {
                return response()->json(['error' => 'Kelas tidak ditemukan.'], 404);
            }
            $conflict = DB::table('jadwal_pelajaran')
                ->where('kelas_id', $classId)->where('hari', $day)
                ->where('jam_mulai', '<', $end)->where('jam_selesai', '>', $start);
            if ($id !== null) {
                $conflict->where('id', '<>', $id);
            }
            if ($conflict->lockForUpdate()->exists()) {
                return response()->json([
                    'error' => 'Waktu tersebut bertabrakan dengan jadwal lain di kelas ini.',
                ], 409);
            }

            $data = [
                'kelas_id' => $classId,
                'hari' => $day,
                'jam_mulai' => $start,
                'jam_selesai' => $end,
                'mapel' => $subject,
                'guru' => $teacher !== '' ? $teacher : null,
            ];
            if ($id === null) {
                $id = (int) DB::table('jadwal_pelajaran')->insertGetId($data);
            } else {
                if (!DB::table('jadwal_pelajaran')->where('id', $id)->lockForUpdate()->exists()) {
                    return response()->json(['error' => 'Jadwal pelajaran tidak ditemukan.'], 404);
                }
                DB::table('jadwal_pelajaran')->where('id', $id)->update($data);
            }

            return response()->json(['id' => $id, 'message' => 'Jadwal pelajaran berhasil disimpan.']);
        });

        return $result;
    }

    private function saveClass(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $id = array_key_exists('id', $body) ? filter_var($body['id'], FILTER_VALIDATE_INT) : null;
        $name = trim((string) ($body['nama'] ?? ''));
        $program = strtolower(trim((string) ($body['jurusan'] ?? '')));
        $grade = filter_var($body['tingkat'] ?? null, FILTER_VALIDATE_INT);
        if ($name === '' || mb_strlen($name) > 80) {
            return response()->json(['error' => 'Nama kelas wajib diisi (maksimal 80 karakter).'], 400);
        }
        if (!in_array($program, self::PROGRAMS, true)) {
            return response()->json(['error' => 'Program keahlian tidak valid.'], 400);
        }
        if (!in_array($grade, [10, 11, 12], true)) {
            return response()->json(['error' => 'Tingkat kelas harus X, XI, atau XII.'], 400);
        }
        if ($id === false || ($id !== null && $id < 1)) {
            return response()->json(['error' => "Field 'id' tidak valid."], 400);
        }

        try {
            if ($id !== null) {
                if (!DB::table('jadwal_kelas')->where('id', $id)->exists()) {
                    return response()->json(['error' => 'Kelas tidak ditemukan.'], 404);
                }
                DB::table('jadwal_kelas')->where('id', $id)->update(['nama' => $name]);
            } else {
                $id = DB::transaction(function () use ($name, $program, $grade): int {
                    $lastRoom = DB::table('jadwal_kelas')->where('jurusan', $program)
                        ->where('tingkat', $grade)->orderByDesc('rombel')->lockForUpdate()->value('rombel');
                    return (int) DB::table('jadwal_kelas')->insertGetId([
                        'nama' => $name,
                        'jurusan' => $program,
                        'tingkat' => $grade,
                        'rombel' => (int) $lastRoom + 1,
                    ]);
                });
            }
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23000') {
                return response()->json(['error' => 'Nama kelas tersebut sudah digunakan. Pilih nama lain.'], 409);
            }
            throw $exception;
        }

        return response()->json(['id' => $id, 'message' => 'Kelas berhasil disimpan.']);
    }

    private function delete(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        $classId = filter_var($request->query('kelas_id'), FILTER_VALIDATE_INT);
        if ($classId !== false && $classId !== null) {
            if (DB::table('jadwal_pelajaran')->where('kelas_id', $classId)->exists()) {
                return response()->json([
                    'error' => 'Kelas masih memiliki jadwal. Hapus jadwal kelas terlebih dahulu.',
                ], 409);
            }
            if (DB::table('jadwal_kelas')->where('id', $classId)->delete() === 0) {
                return response()->json(['error' => 'Kelas tidak ditemukan.'], 404);
            }
            return response()->json(['message' => 'Kelas berhasil dihapus.']);
        }

        $id = filter_var($request->query('id'), FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            return response()->json(['error' => "Parameter 'id' wajib diisi."], 400);
        }
        if (DB::table('jadwal_pelajaran')->where('id', $id)->delete() === 0) {
            return response()->json(['error' => 'Jadwal pelajaran tidak ditemukan.'], 404);
        }

        return response()->json(['message' => 'Jadwal pelajaran berhasil dihapus.']);
    }
}
