<?php

namespace App\Http\Controllers\Api;

use App\Support\LegacyAiRuntime;
use App\Support\PrivateUploads;
use App\Support\UploadException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class BkChatController
{
    public function __invoke(Request $request, PrivateUploads $uploads): JsonResponse
    {
        LegacyAiRuntime::load();
        $body = $request->isMethod('post') && str_starts_with(
            (string) $request->header('Content-Type'),
            'multipart/form-data'
        )
            ? (json_decode((string) $request->input('payload', ''), true) ?: [])
            : $request->json()->all();

        $messages = $body['messages'] ?? null;
        if (!is_array($messages) || $messages === []) {
            return response()->json(['error' => "Field 'messages' wajib diisi dan tidak boleh kosong"], 400);
        }

        $mode = $body['mode'] ?? 'finalize';
        if (!in_array($mode, ['chat', 'finalize'], true)) {
            return response()->json(['error' => 'Mode percakapan tidak valid.'], 400);
        }
        if (count($messages) > 50) {
            return response()->json(['error' => 'Percakapan terlalu panjang untuk dikirim.'], 400);
        }

        $studentTexts = [];
        $conversation = [];
        $transcript = [];
        $totalBytes = 0;
        foreach ($messages as $message) {
            if (!is_array($message)) {
                return response()->json(['error' => 'Format pesan tidak valid.'], 400);
            }
            $role = $message['role'] ?? $message['sender'] ?? '';
            $text = is_string($message['text'] ?? null) ? trim($message['text']) : '';
            if (!in_array($role, ['user', 'bot'], true) || $text === '') {
                continue;
            }
            if (strlen($text) > 4000) {
                return response()->json(['error' => 'Pesan terlalu panjang.'], 400);
            }
            $totalBytes += strlen($text);
            if ($totalBytes > 8000) {
                return response()->json(['error' => 'Percakapan terlalu panjang. Ringkas sebagian lalu coba lagi.'], 400);
            }
            if ($role === 'user') {
                $studentTexts[] = $text;
            }
            $conversation[] = [
                'role' => $role === 'user' ? 'user' : 'assistant',
                'content' => $text,
            ];
            $transcript[] = ['sender' => $role, 'text' => $text];
        }

        if ($mode === 'chat') {
            if ($studentTexts === [] || end($conversation)['role'] !== 'user') {
                return response()->json(['error' => 'Kirim pesan sebelum meminta balasan konselor.'], 400);
            }
            try {
                $reply = callAiProvider(
                    array_merge(
                        [['role' => 'system', 'content' => AI_BK_CONVERSATION_SYSTEM_PROMPT]],
                        array_slice($conversation, -16)
                    ),
                    array_merge(aiFeatureOptions('bk'), ['max_tokens' => 350])
                );
                if ($reply === '') {
                    throw new \RuntimeException('AI BK mengembalikan balasan kosong.');
                }

                return response()->json(['message' => $reply]);
            } catch (Throwable $error) {
                error_log('[SMKN24] Balasan percakapan AI BK gagal: ' . $error->getMessage());

                return response()->json([
                    'error' => 'Konselor AI belum dapat membalas. Pesanmu belum terkirim; coba lagi.',
                ], 503);
            }
        }

        $photos = $request->file('photos', []);
        if ($photos instanceof \Illuminate\Http\UploadedFile) {
            $photos = [$photos];
        }
        if (!is_array($photos)) {
            return response()->json(['error' => 'Format unggahan foto tidak valid.'], 400);
        }
        if (count($photos) > 2) {
            return response()->json(['error' => 'Maksimal dua foto bukti.'], 400);
        }
        $audio = $request->file('audio');
        if ($studentTexts === [] && $photos === [] && !$audio) {
            return response()->json(['error' => 'Ceritakan masalah atau lampirkan foto/pesan suara.'], 400);
        }

        if ($photos !== []) {
            $studentTexts[] = '[Pengadu melampirkan foto bukti untuk ditinjau Guru BK.]';
        }
        if ($audio) {
            $studentTexts[] = '[Pengadu melampirkan pesan suara; audio perlu didengarkan Guru BK.]';
        }
        $name = is_string($body['nama'] ?? null) ? trim($body['nama']) : '';
        $class = is_string($body['kelas'] ?? null) ? trim($body['kelas']) : '';
        $deviceId = is_string($body['deviceId'] ?? null) ? trim($body['deviceId']) : '';
        if (!preg_match('/\A[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}\z/i', $deviceId)) {
            $deviceId = '';
        }

        $story = implode("\n", $studentTexts);
        $storedUploads = [];
        try {
            foreach ($photos as $photo) {
                if (!$photo instanceof \Illuminate\Http\UploadedFile) {
                    throw new UploadException('Foto bukti gagal diunggah.', 400);
                }
                $storedUploads[] = $uploads->storeBkMedia($photo);
            }
            if ($audio) {
                $storedUploads[] = $uploads->storeBkMedia($audio, true);
            }
            [$summary, $category, $severity, $needsAttention] = $this->summarise($studentTexts);
            $id = DB::table('pesan_bk')->insertGetId([
                'nama' => $name !== '' ? $name : 'Anonim',
                'kelas' => $class !== '' ? $class : '-',
                'no_hp' => null,
                'keperluan' => 'Konsultasi melalui AI',
                'pesan' => $story,
                'ringkasan' => $summary,
                'tingkat_kesulitan' => $severity,
                'kategori' => $category,
                'butuh_perhatian' => $needsAttention ? 1 : 0,
                'transkrip' => json_encode($transcript, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'device_id' => $deviceId !== '' ? $deviceId : null,
                'media_json' => json_encode($storedUploads, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);

            return response()->json([
                'message' => 'Percakapan berhasil dikirim ke Guru BK.',
                'id' => $id,
            ], 201);
        } catch (UploadException $error) {
            $this->cleanupUploads($uploads, $storedUploads);

            return response()->json(['error' => $error->getMessage()], $error->getCode());
        } catch (Throwable $error) {
            $this->cleanupUploads($uploads, $storedUploads);
            throw $error;
        }
    }

    private function cleanupUploads(PrivateUploads $uploads, array $storedUploads): void
    {
        foreach ($storedUploads as $upload) {
            if (!$uploads->deleteBkMedia($upload['storedName'])) {
                error_log('[SMKN24] Gagal membersihkan lampiran BK yang tidak tersimpan.');
            }
        }
    }

    private function summarise(array $studentTexts): array
    {
        $summary = null;
        $category = null;
        $severity = null;
        $needsAttention = false;

        try {
            $response = callAiProvider([
                ['role' => 'system', 'content' => AI_BK_SYSTEM_PROMPT],
                ['role' => 'user', 'content' => "Ringkas laporan berikut untuk Guru BK:\n\n" . implode("\n", $studentTexts)],
            ], aiFeatureOptions('bk'));
            $data = extractJsonObject($response);
            if ($data !== null) {
                $summary = trim(is_string($data['ringkasan'] ?? null) ? $data['ringkasan'] : '') ?: null;
                $category = $this->normaliseCategory($data['kategori'] ?? '');
                $severity = $this->normaliseSeverity($data['tingkat_kesulitan'] ?? '');
                $needsAttention = !empty($data['butuh_perhatian']);
            } else {
                error_log('[SMKN24] AI BK tidak mengembalikan JSON yang valid.');
            }
        } catch (Throwable $error) {
            error_log('[SMKN24] AI BK gagal merangkum laporan: ' . $error->getMessage());
        }

        if ($summary === null) {
            $text = trim(preg_replace('/\s+/', ' ', implode(' ', $studentTexts)) ?? '');
            $summary = 'Siswa melaporkan: ' . (strlen($text) > 300 ? substr($text, 0, 297) . '...' : $text);
        }

        return [$summary, $category, $severity, $needsAttention];
    }

    private function normaliseSeverity(mixed $value): ?string
    {
        return match (strtolower(trim((string) $value))) {
            'ringan' => 'Ringan',
            'sedang' => 'Sedang',
            'berat' => 'Berat',
            default => null,
        };
    }

    private function normaliseCategory(mixed $value): string
    {
        foreach (['Akademik', 'Sosial', 'Keluarga', 'Ekonomi', 'Kecemasan', 'Kekerasan', 'Lainnya'] as $category) {
            if (strcasecmp(trim((string) $value), $category) === 0) {
                return $category;
            }
        }

        return 'Lainnya';
    }
}
