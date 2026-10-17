<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use DateTimeImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChatExportController
{
    public function __invoke(Request $request)
    {
        if ($request->method() !== 'GET') {
            return response()->json(['error' => 'Method tidak diizinkan, gunakan GET'], 405);
        }
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $today = new DateTimeImmutable('today');
        $from = $this->validDate($request->query('dari')) ?? $today->modify('-6 days');
        $to = $this->validDate($request->query('sampai')) ?? $today;
        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }
        $fromText = $from->format('Y-m-d');
        $toText = $to->format('Y-m-d');
        $hasCategory = Schema::hasColumn('chat_messages', 'kategori');
        $hasStatus = Schema::hasColumn('chat_messages', 'status_resolusi');
        $hasOutOfContext = Schema::hasColumn('chat_messages', 'di_luar_konteks');
        $scalar = fn (string $table, string $sender): int => DB::table($table)
            ->where('sender', $sender)->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])->count();
        $sessions = DB::table('chat_sessions')->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])->count();
        $users = $scalar('chat_messages', 'user');
        $bots = $scalar('chat_messages', 'bot');
        $resolved = $hasStatus ? DB::table('chat_messages')->where('sender', 'bot')->where('status_resolusi', 'resolved')->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])->count() : 0;
        $escalated = $hasStatus ? DB::table('chat_messages')->where('sender', 'bot')->where('status_resolusi', 'escalated')->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])->count() : 0;
        $outside = $hasOutOfContext ? DB::table('chat_messages')->where('sender', 'user')->where('di_luar_konteks', 1)->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])->count() : 0;

        $rows = [
            ['METRIK', 'Nilai', '', ''],
            ['Periode', $fromText, $toText, ''],
            ['Total sesi', (string) $sessions, '', ''],
            ['Total pertanyaan user', (string) $users, '', ''],
            ['Total jawaban bot', (string) $bots, '', ''],
            ['Dijawab', (string) $resolved, '', ''],
            ['Eskalasi ke manusia', (string) $escalated, '', ''],
            ['Di luar konteks', (string) $outside, '', ''],
            ['', '', '', ''],
            ['TOP PERTANYAAN', 'Jumlah', 'Kategori', 'Status terakhir'],
        ];
        $topQuery = DB::table('chat_messages')->selectRaw('text, COUNT(*) AS jumlah')
            ->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])
            ->groupBy('text')->orderByDesc('jumlah')->limit(50);
        if ($hasCategory) {
            $topQuery->addSelect(DB::raw('MAX(kategori) AS kategori'));
        }
        foreach ($topQuery->get() as $item) {
            $rows[] = [mb_substr((string) $item->text, 0, 300), (string) (int) $item->jumlah,
                $hasCategory ? (string) ($item->kategori ?? '') : '', ''];
        }
        $rows[] = ['', '', '', ''];
        $rows[] = ['KATEGORI', 'Jumlah', '', ''];
        if ($hasCategory) {
            DB::table('chat_messages')->selectRaw("COALESCE(kategori, 'Lainnya') AS kategori, COUNT(*) AS jumlah")
                ->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])
                ->groupByRaw("COALESCE(kategori, 'Lainnya')")->orderByDesc('jumlah')->get()
                ->each(fn (object $item) => $rows[] = [(string) $item->kategori, (string) (int) $item->jumlah, '', '']);
        }
        $rows[] = ['', '', '', ''];
        $rows[] = ['TREN HARIAN', 'Sesi', '', ''];
        DB::table('chat_sessions')->selectRaw('DATE(created_at) AS tanggal, COUNT(*) AS jumlah')
            ->whereBetween(DB::raw('DATE(created_at)'), [$fromText, $toText])
            ->groupByRaw('DATE(created_at)')->orderBy('tanggal')->get()
            ->each(fn (object $item) => $rows[] = [(string) $item->tanggal, (string) (int) $item->jumlah, '', '']);

        if (Schema::hasTable('chat_analytics_log')) {
            DB::table('chat_analytics_log')->insert([
                'aksi' => 'export_csv',
                'detail' => "periode={$fromText}..{$toText}",
            ]);
        }

        $filename = "chatbot-analytics-{$fromText}_{$toText}.csv";
        return response()->streamDownload(static function () use ($rows): void {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            foreach ($rows as $row) {
                fputcsv($output, $row);
            }
            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=utf-8']);
    }

    private function validDate(mixed $raw): ?DateTimeImmutable
    {
        if (!is_string($raw) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
            return null;
        }
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $raw);
        return $date && $date->format('Y-m-d') === $raw ? $date : null;
    }
}
