<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChatAnalyticsController
{
    public function __invoke(Request $request): JsonResponse
    {
        if ($request->method() !== 'GET') {
            return response()->json(['error' => 'Method tidak diizinkan, gunakan GET'], 405);
        }
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        [$from, $to] = $this->period($request->query('dari'), $request->query('sampai'));
        if ($from === null || $to === null) {
            return response()->json(['error' => 'Rentang periode maksimal 93 hari.'], 400);
        }
        $columns = [];
        foreach (['kategori', 'sentimen', 'di_luar_konteks', 'status_resolusi'] as $column) {
            $columns[$column] = Schema::hasColumn('chat_messages', $column);
        }
        $sessions = DB::table('chat_sessions');
        $messages = DB::table('chat_messages');
        $sessionCount = (clone $sessions)->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])->count();
        $todayCount = (clone $sessions)->whereDate('created_at', today())->count();
        $users = (clone $messages)->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$from, $to]);
        $bots = (clone $messages)->where('sender', 'bot')->whereBetween(DB::raw('DATE(created_at)'), [$from, $to]);
        $userCount = (clone $users)->count();
        $botCount = (clone $bots)->count();
        $resolved = $columns['status_resolusi']
            ? (clone $bots)->where('status_resolusi', 'resolved')->count() : 0;
        $escalated = $columns['status_resolusi']
            ? (clone $bots)->where('status_resolusi', 'escalated')->count() : 0;
        $outOfContext = $columns['di_luar_konteks']
            ? (clone $users)->where('di_luar_konteks', 1)->count() : 0;

        $trend = DB::table('chat_sessions')
            ->selectRaw('DATE(created_at) AS tanggal, COUNT(*) AS sesi')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('tanggal')
            ->get()
            ->map(fn (object $row): array => [
                'tanggal' => (string) $row->tanggal,
                'sesi' => (int) $row->sesi,
            ]);
        $categories = $columns['kategori']
            ? DB::table('chat_messages')->selectRaw("COALESCE(kategori, 'Lainnya') AS kategori, COUNT(*) AS jumlah")
                ->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
                ->groupByRaw("COALESCE(kategori, 'Lainnya')")->orderByDesc('jumlah')->get()
                ->map(fn (object $row): array => ['kategori' => (string) $row->kategori, 'jumlah' => (int) $row->jumlah])
            : collect();
        $sentiment = ['positif' => 0, 'netral' => 0, 'negatif' => 0];
        if ($columns['sentimen']) {
            DB::table('chat_messages')->selectRaw("COALESCE(sentimen, 'netral') AS sentimen, COUNT(*) AS jumlah")
                ->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
                ->groupByRaw("COALESCE(sentimen, 'netral')")->get()
                ->each(function (object $row) use (&$sentiment): void {
                    if (array_key_exists($row->sentimen, $sentiment)) {
                        $sentiment[$row->sentimen] = (int) $row->jumlah;
                    }
                });
        }

        $top = DB::table('chat_messages as m')
            ->selectRaw('m.text AS pertanyaan, COUNT(*) AS jumlah, MAX(m.created_at) AS terakhir')
            ->when($columns['kategori'], fn ($query) => $query->addSelect(DB::raw('MAX(m.kategori) AS kategori')),
                fn ($query) => $query->addSelect(DB::raw('NULL AS kategori')))
            ->when($columns['status_resolusi'],
                fn ($query) => $query->selectRaw(
                    "(SELECT b.status_resolusi FROM chat_messages b
                     WHERE b.session_id = (
                         SELECT latest.session_id FROM chat_messages latest
                         WHERE latest.text = m.text AND latest.sender = 'user'
                           AND DATE(latest.created_at) BETWEEN ? AND ?
                         ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1
                     ) AND b.sender = 'bot'
                     ORDER BY b.id DESC LIMIT 1) AS status_terakhir",
                    [$from, $to]
                ),
                fn ($query) => $query->addSelect(DB::raw('NULL AS status_terakhir')))
            ->where('m.sender', 'user')->whereBetween(DB::raw('DATE(m.created_at)'), [$from, $to])
            ->groupBy('m.text')->orderByDesc('jumlah')->orderByDesc('terakhir')->limit(10)->get()
            ->map(fn (object $row): array => [
                'pertanyaan' => (string) ($row->pertanyaan ?? ''),
                'jumlah' => (int) $row->jumlah,
                'kategori' => $row->kategori === null ? null : (string) $row->kategori,
                'statusTerakhir' => $row->status_terakhir === null ? null : (string) $row->status_terakhir,
                'terakhir' => (string) $row->terakhir,
            ]);

        return response()->json([
            'periode' => ['dari' => $from, 'sampai' => $to],
            'metrik' => [
                'totalSesi' => $sessionCount,
                'aktifHariIni' => $todayCount,
                'totalPertanyaan' => $userCount,
                'totalJawaban' => $botCount,
                'dijawab' => $resolved,
                'persenDijawab' => $botCount > 0 ? (int) round($resolved / $botCount * 100) : 0,
                'eskalasi' => $escalated,
                'persenEskalasi' => $botCount > 0 ? (int) round($escalated / $botCount * 100) : 0,
                'luarKonteks' => $outOfContext,
                'persenLuarKonteks' => $userCount > 0 ? (int) round($outOfContext / $userCount * 100) : 0,
            ],
            'tren' => $trend,
            'kategori' => $categories,
            'sentimen' => $sentiment,
            'top' => $top,
        ]);
    }

    private function period(mixed $from, mixed $to): array
    {
        $today = new DateTimeImmutable('today');
        $end = $this->parseDate($to) ?? $today;
        $start = $this->parseDate($from) ?? $today->modify('-6 days');
        if ($start > $end) {
            [$start, $end] = [$end, $start];
        }
        if ($start->diff($end)->days > 93) {
            return [null, null];
        }
        return [$start->format('Y-m-d'), $end->format('Y-m-d')];
    }

    private function parseDate(mixed $value): ?DateTimeImmutable
    {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return $date && $date->format('Y-m-d') === $value ? $date : null;
    }
}
