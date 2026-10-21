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
            ->map(function (object $row): array {
                $status = $row->status_terakhir === null ? null : (string) $row->status_terakhir;
                return [
                    'pertanyaan' => (string) ($row->pertanyaan ?? ''),
                    'jumlah' => (int) $row->jumlah,
                    'kategori' => $row->kategori === null ? null : (string) $row->kategori,
                    'statusTerakhir' => $status,
                    // Label dua status yang dipakai UI: "Terjawab" vs
                    // "Tidak Terjawab/AI butuh info lebih lanjut".
                    'statusLabel' => $this->statusLabel($status),
                    'terakhir' => (string) $row->terakhir,
                ];
            });

        // Balasan bot yang butuh bantuan manusia / info lebih lanjut.
        $tidakTerjawab = $columns['status_resolusi']
            ? (clone $bots)->whereIn('status_resolusi', ['escalated', 'unanswered'])->count()
            : 0;

        $chatbotBK = $this->chatbotBK($from, $to);

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
                'terjawab' => $resolved,
                'tidakTerjawab' => $tidakTerjawab,
                'persenTerjawab' => $botCount > 0 ? (int) round($resolved / $botCount * 100) : 0,
                'persenTidakTerjawab' => $botCount > 0 ? (int) round($tidakTerjawab / $botCount * 100) : 0,
            ],
            'tren' => $trend,
            'kategori' => $categories,
            'sentimen' => $sentiment,
            'top' => $top,
            'chatbotBK' => $chatbotBK,
        ]);
    }

    /**
     * Label status dua-kolom untuk tabel "Top Pertanyaan".
     *
     * resolved   -> "Terjawab"
     * escalated  -> "Tidak Terjawab/AI butuh info lebih lanjut"
     * unanswered -> "Tidak Terjawab/AI butuh info lebih lanjut"
     * NULL/tidak dikenal -> "Belum ada status" (data lama belum diklasifikasi).
     */
    private function statusLabel(?string $status): string
    {
        if ($status === null || $status === '') {
            return 'Belum ada status';
        }
        return $status === 'resolved'
            ? 'Terjawab'
            : 'Tidak Terjawab/AI butuh info lebih lanjut';
    }

    /**
     * Analytics notifikasi otomatis Chatbot-BK (WhatsApp ke Guru BK).
     *
     * Sumber data nyata:
     *  - bk_wa_alert : jejak setiap percobaan kirim (Terkirim/Gagal/Dilewati).
     *  - pesan_bk    : antrean laporan BK (aktif / perlu intervensi / ditangani).
     *
     * Tabel belum ada (migration belum jalan) = semua angka nol, bukan error.
     *
     * @return array<string, mixed>
     */
    private function chatbotBK(string $from, string $to): array
    {
        $hasil = [
            'pengirim' => 'Chatbot-BK',
            'totalNotifikasi' => 0,
            'terkirim' => 0,
            'gagal' => 0,
            'dilewati' => 0,
            'terakhirKirim' => null,
            'terakhirStatus' => null,
            'laporanAktif' => 0,
            'perluIntervensi' => 0,
            'sudahDitangani' => 0,
            'ambang' => 0,
            'aktif' => false,
            'riwayat' => [],
        ];

        if (!Schema::hasTable('bk_wa_alert')) {
            return $hasil;
        }

        $rows = DB::table('bk_wa_alert')
            ->selectRaw('status, COUNT(*) AS jumlah')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->groupBy('status')
            ->get();
        foreach ($rows as $row) {
            $jumlah = (int) $row->jumlah;
            $hasil['totalNotifikasi'] += $jumlah;
            if ($row->status === 'Terkirim') {
                $hasil['terkirim'] += $jumlah;
            } elseif ($row->status === 'Gagal') {
                $hasil['gagal'] += $jumlah;
            } else {
                $hasil['dilewati'] += $jumlah;
            }
        }

        $terakhir = DB::table('bk_wa_alert')
            ->whereIn('status', ['Terkirim', 'Gagal'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();
        if ($terakhir !== null) {
            $hasil['terakhirKirim'] = (string) $terakhir->created_at;
            $hasil['terakhirStatus'] = (string) $terakhir->status;
        }

        $hasil['riwayat'] = DB::table('bk_wa_alert')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (object $row): array => [
                'id' => (int) $row->id,
                'jumlahLaporan' => (int) $row->jumlah_laporan,
                'target' => (string) $row->target,
                'pesan' => (string) ($row->pesan ?? ''),
                'status' => (string) $row->status,
                'error' => $row->error === null ? null : (string) $row->error,
                'tanggal' => (string) $row->created_at,
            ])
            ->all();

        if (Schema::hasTable('pesan_bk')) {
            $antrean = DB::table('pesan_bk')
                ->selectRaw(
                    'SUM(CASE WHEN status <> \'Selesai\' THEN 1 ELSE 0 END) AS aktif,'
                    . ' SUM(CASE WHEN status <> \'Selesai\' AND (butuh_perhatian = 1 OR tingkat_kesulitan = \'Berat\')'
                    . ' THEN 1 ELSE 0 END) AS perlu,'
                    . ' SUM(CASE WHEN status = \'Selesai\' THEN 1 ELSE 0 END) AS ditangani'
                )
                ->first();
            if ($antrean !== null) {
                $hasil['laporanAktif'] = (int) ($antrean->aktif ?? 0);
                $hasil['perluIntervensi'] = (int) ($antrean->perlu ?? 0);
                $hasil['sudahDitangani'] = (int) ($antrean->ditangani ?? 0);
            }
        }

        if (Schema::hasTable('bk_wa_setting')) {
            $setting = DB::table('bk_wa_setting')->where('id', 1)->first();
            if ($setting !== null) {
                $hasil['ambang'] = (int) $setting->threshold;
                $hasil['aktif'] = (bool) $setting->aktif;
            }
        }

        return $hasil;
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
