<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatHistoryController
{
    public function __invoke(Request $request): JsonResponse
    {
        if ($request->method() !== 'GET') {
            return response()->json(['error' => 'Method tidak diizinkan, gunakan GET'], 405);
        }
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        if ($request->filled('sessionId')) {
            $rows = DB::table('chat_messages')
                ->select('sender', 'text', 'created_at')
                ->where('session_id', $request->query('sessionId'))
                ->orderBy('id')
                ->get();
            return response()->json($rows);
        }

        $sessions = DB::table('chat_sessions as s')
            ->select('s.id as session_id', 's.created_at')
            ->selectSub(
                DB::table('chat_messages as m')->selectRaw('COUNT(*)')
                    ->whereColumn('m.session_id', 's.id'),
                'total_pesan'
            )
            ->orderByDesc('s.created_at')
            ->limit(100)
            ->get();

        return response()->json($sessions);
    }
}
