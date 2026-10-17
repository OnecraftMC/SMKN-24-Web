<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use App\Support\LegacyAiRuntime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ChatInsightsController
{
    public function __invoke(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        LegacyAiRuntime::load();
        $this->ensureTables();

        return match ($request->method()) {
            'GET' => $this->index(),
            'POST' => $this->generate($request),
            'PUT' => $this->update($request),
            default => response()->json(['error' => 'Method tidak diizinkan, gunakan GET/POST/PUT'], 405),
        };
    }

    private function index(): JsonResponse
    {
        $active = DB::table('chat_insights')
            ->where('status', 'baru')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();
        $history = DB::table('chat_insights')
            ->where('status', '<>', 'baru')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'aktif' => $active->map(fn (object $row): array => $this->formatInsight((array) $row))->values(),
            'riwayat' => $history->map(fn (object $row): array => $this->formatInsight((array) $row))->values(),
        ]);
    }

    private function update(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $id = (int) ($body['id'] ?? 0);
        $status = $body['status'] ?? '';
        if ($id <= 0) {
            return response()->json(['error' => "Field 'id' wajib diisi."], 400);
        }
        if (!in_array($status, ['baru', 'selesai', 'diabaikan'], true)) {
            return response()->json(['error' => "Field 'status' harus baru|selesai|diabaikan."], 400);
        }

        if (DB::table('chat_insights')->where('id', $id)->update(['status' => $status]) === 0) {
            return response()->json(['error' => 'Insight tidak ditemukan.'], 404);
        }

        return response()->json(['ok' => true]);
    }

    private function generate(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $days = (string) ($body['periode'] ?? '7');
        if (!in_array($days, ['7', '30'], true)) {
            return response()->json(['error' => "Field 'periode' harus 7|30."], 400);
        }

        $until = now()->startOfDay();
        $from = $until->copy()->subDays((int) $days - 1);
        $fromDate = $from->toDateString();
        $untilDate = $until->toDateString();
        $summary = $this->buildSummary($fromDate, $untilDate);
        $insights = $this->llmInsights($summary);
        $source = 'ai';
        if ($insights === null) {
            $insights = $this->heuristicInsights($summary);
            $source = 'heuristik';
        }

        $saved = [];
        foreach (array_slice($insights, 0, 5) as $insight) {
            $type = in_array($insight['tipe'] ?? '', ['tren', 'konten_kurang', 'rekomendasi', 'teknis', 'faq'], true)
                ? $insight['tipe']
                : 'rekomendasi';
            $title = chatCut(trim((string) ($insight['judul'] ?? '')), 255);
            $text = trim((string) ($insight['isi'] ?? ''));
            if ($title === '' || $text === '') {
                continue;
            }

            $id = DB::table('chat_insights')->insertGetId([
                'tipe' => $type,
                'judul' => $title,
                'isi' => $text,
                'sumber' => $source,
                'periode_mulai' => $fromDate,
                'periode_selesai' => $untilDate,
            ]);
            $saved[] = $this->formatInsight([
                'id' => $id,
                'tipe' => $type,
                'judul' => $title,
                'isi' => $text,
                'sumber' => $source,
                'periode_mulai' => $fromDate,
                'periode_selesai' => $untilDate,
                'status' => 'baru',
                'created_at' => now()->toDateTimeString(),
            ]);
        }

        $this->logAnalytics("periode={$days}h sumber={$source} n=" . count($saved));

        return response()->json(['insights' => $saved, 'sumber' => $source]);
    }

    private function ensureTables(): void
    {
        DB::statement("CREATE TABLE IF NOT EXISTS chat_insights (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tipe ENUM('tren','konten_kurang','rekomendasi','teknis','faq') NOT NULL,
            judul VARCHAR(255) NOT NULL,
            isi TEXT NOT NULL,
            sumber ENUM('ai','heuristik') NOT NULL DEFAULT 'heuristik',
            periode_mulai DATE NULL,
            periode_selesai DATE NULL,
            status ENUM('baru','selesai','diabaikan') NOT NULL DEFAULT 'baru',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_chat_insights_status (status)
        ) ENGINE=InnoDB");
        DB::statement("CREATE TABLE IF NOT EXISTS chat_analytics_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            aksi ENUM('generate_insight','export_csv','export_pdf') NOT NULL,
            detail VARCHAR(255) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_chat_analytics_log_aksi (aksi)
        ) ENGINE=InnoDB");
    }

    private function formatInsight(array $row): array
    {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'tipe' => (string) ($row['tipe'] ?? 'rekomendasi'),
            'judul' => (string) ($row['judul'] ?? ''),
            'isi' => (string) ($row['isi'] ?? ''),
            'sumber' => (string) ($row['sumber'] ?? 'heuristik'),
            'periodeMulai' => $row['periode_mulai'] ?? null,
            'periodeSelesai' => $row['periode_selesai'] ?? null,
            'status' => (string) ($row['status'] ?? 'baru'),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }

    private function logAnalytics(string $detail): void
    {
        try {
            DB::table('chat_analytics_log')->insert([
                'aksi' => 'generate_insight',
                'detail' => chatCut($detail, 255),
            ]);
        } catch (Throwable $error) {
            error_log('[SMKN24] Log analytics dilewati: ' . $error->getMessage());
        }
    }

    private function buildSummary(string $from, string $until): array
    {
        $messages = DB::table('chat_messages');
        $summary = [
            'periode' => "$from s.d. $until",
            'totalSesi' => DB::table('chat_sessions')->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])->count(),
            'totalPertanyaan' => (clone $messages)->where('sender', 'user')->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])->count(),
            'kategori' => [],
            'sentimen' => [],
            'top' => [],
            'eskalasi' => 0,
            'luarKonteks' => 0,
            'negatif' => 0,
        ];

        if (Schema::hasColumn('chat_messages', 'kategori')) {
            $summary['kategori'] = DB::table('chat_messages')
                ->selectRaw("COALESCE(kategori,'Lainnya') AS nama, COUNT(*) AS n")
                ->where('sender', 'user')
                ->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])
                ->groupBy('kategori')
                ->orderByDesc('n')
                ->limit(6)
                ->get()
                ->map(static fn (object $row): array => ['nama' => (string) $row->nama, 'n' => (int) $row->n])
                ->all();
        }
        if (Schema::hasColumn('chat_messages', 'sentimen')) {
            foreach (DB::table('chat_messages')
                ->selectRaw("COALESCE(sentimen,'netral') AS nama, COUNT(*) AS n")
                ->where('sender', 'user')
                ->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])
                ->groupBy('sentimen')
                ->get() as $row) {
                $summary['sentimen'][(string) $row->nama] = (int) $row->n;
                if ($row->nama === 'negatif') {
                    $summary['negatif'] = (int) $row->n;
                }
            }
        }
        if (Schema::hasColumn('chat_messages', 'di_luar_konteks')) {
            $summary['luarKonteks'] = (clone $messages)
                ->where('sender', 'user')
                ->where('di_luar_konteks', 1)
                ->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])
                ->count();
        }
        if (Schema::hasColumn('chat_messages', 'status_resolusi')) {
            $summary['eskalasi'] = (clone $messages)
                ->where('sender', 'bot')
                ->where('status_resolusi', 'escalated')
                ->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])
                ->count();
        }

        $summary['top'] = DB::table('chat_messages')
            ->selectRaw('text AS t, COUNT(*) AS n')
            ->where('sender', 'user')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $until])
            ->groupBy('text')
            ->orderByDesc('n')
            ->limit(10)
            ->get()
            ->map(static fn (object $row): array => ['tanya' => chatCut((string) $row->t, 160), 'n' => (int) $row->n])
            ->all();

        return $summary;
    }

    private function llmInsights(array $summary): ?array
    {
        $options = aiFeatureOptions('content');
        if (!aiProviderConfigured($options)) {
            error_log('[SMKN24] Insight AI dilewati: API key provider belum diisi di .env.');
            return null;
        }

        $prompt = 'Kamu analis data website SMKN 24 Jakarta. Dari ringkasan analytics chatbot berikut,'
            . " susun 3-5 insight ringkas dalam Bahasa Indonesia yang actionable untuk admin sekolah.\n"
            . 'Ringkasan: ' . json_encode($summary, JSON_UNESCAPED_UNICODE) . "\n"
            . 'Aturan: tiap insight bertipe salah satu tren|konten_kurang|rekomendasi|teknis|faq;'
            . ' judul maks 80 karakter; isi 1-3 kalimat konkret (sebut angka bila ada).'
            . ' Jangan mengarang data di luar ringkasan.'
            . ' Kembalikan HANYA array JSON: [{"tipe":"...","judul":"...","isi":"..."}].';
        try {
            $raw = callAiProvider(
                [['role' => 'user', 'content' => $prompt]],
                array_merge($options, ['max_tokens' => 1200, 'temperature' => 0.4])
            );
            $parsed = extractJsonObject($raw);
        } catch (Throwable $error) {
            error_log('[SMKN24] Insight AI gagal: ' . $error->getMessage());
            return null;
        }

        if (!is_array($parsed)) {
            return null;
        }
        $items = array_is_list($parsed) ? $parsed : ($parsed['insights'] ?? null);
        if (!is_array($items) || $items === []) {
            return null;
        }

        $valid = [];
        foreach ($items as $item) {
            if (!is_array($item) || trim((string) ($item['judul'] ?? '')) === '' || trim((string) ($item['isi'] ?? '')) === '') {
                continue;
            }
            $valid[] = [
                'tipe' => (string) ($item['tipe'] ?? 'rekomendasi'),
                'judul' => (string) $item['judul'],
                'isi' => (string) $item['isi'],
            ];
        }

        return $valid === [] ? null : $valid;
    }

    private function heuristicInsights(array $summary): array
    {
        $out = [];
        if (!empty($summary['kategori'])) {
            $top = $summary['kategori'][0];
            $out[] = [
                'tipe' => 'tren',
                'judul' => "Topik teratas: {$top['nama']} ({$top['n']} pertanyaan)",
                'isi' => "Kategori {$top['nama']} paling sering ditanyakan pada periode {$summary['periode']}. Pastikan info terkait mudah ditemukan di website.",
            ];
        }
        if ($summary['eskalasi'] > 0) {
            $out[] = [
                'tipe' => 'konten_kurang',
                'judul' => "{$summary['eskalasi']} jawaban diteruskan ke manusia",
                'isi' => "Sebanyak {$summary['eskalasi']} balasan bot berujung eskalasi. Periksa pertanyaan pemicunya dan lengkapi konten/FAQ terkait.",
            ];
        }
        if ($summary['luarKonteks'] > 0) {
            $out[] = [
                'tipe' => 'teknis',
                'judul' => "{$summary['luarKonteks']} pertanyaan di luar konteks",
                'isi' => "Filter konteks menolak {$summary['luarKonteks']} pertanyaan. Bila topiknya berulang dan relevan, pertimbangkan memperluas cakupan jawaban.",
            ];
        }
        if ($summary['negatif'] > 0) {
            $out[] = [
                'tipe' => 'teknis',
                'judul' => "{$summary['negatif']} pesan bernada negatif",
                'isi' => "Ada {$summary['negatif']} pesan user bernada negatif pada periode ini. Tinjau balasan bot pada sesi tersebut untuk perbaikan.",
            ];
        }
        if (!empty($summary['top'])) {
            $top = $summary['top'][0];
            $out[] = [
                'tipe' => 'faq',
                'judul' => "Kandidat FAQ: \"{$top['tanya']}\" ({$top['n']}x)",
                'isi' => "Pertanyaan ini muncul {$top['n']} kali. Jadikan FAQ atau pengumuman agar chatbot dan pengunjung terbantu.",
            ];
        }
        if ($out === []) {
            $out[] = [
                'tipe' => 'rekomendasi',
                'judul' => "Belum cukup data ({$summary['totalSesi']} sesi)",
                'isi' => "Chatbot mencatat {$summary['totalSesi']} sesi pada periode {$summary['periode']}. Insight akan lebih kaya setelah chatbot lebih sering dipakai pengunjung.",
            ];
        }

        return $out;
    }
}
