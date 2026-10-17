<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BkHistoryController
{
    public function __invoke(Request $request): JsonResponse
    {
        $deviceId = trim((string) $request->query('deviceId', ''));
        if (!preg_match('/\A[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}\z/i', $deviceId)) {
            return response()->json(['error' => 'deviceId tidak valid'], 400);
        }

        $rows = DB::table('pesan_bk')
            ->select('id', 'tanggal', 'ringkasan', 'tingkat_kesulitan', 'kategori', 'butuh_perhatian', 'status', 'transkrip')
            ->where('device_id', $deviceId)
            ->orderByDesc('tanggal')
            ->limit(20)
            ->get();

        return response()->json($rows->map(static function (object $row): array {
            $messages = $row->transkrip ? json_decode((string) $row->transkrip, true) : null;

            return [
                'id' => (int) $row->id,
                'tanggal' => $row->tanggal,
                'ringkasan' => $row->ringkasan,
                'tingkatKesulitan' => $row->tingkat_kesulitan,
                'kategori' => $row->kategori,
                'butuhPerhatian' => (bool) $row->butuh_perhatian,
                'status' => $row->status,
                'messages' => is_array($messages) ? $messages : null,
            ];
        })->values());
    }
}
