<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use App\Support\LegacyAiRuntime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AiController
{
    private const MODULES = [
        'berita' => ['judul' => true],
        'pengumuman' => ['judul' => true],
        'agenda' => ['judul' => true],
        'fasilitas' => ['judul' => true],
        'guru' => ['judul' => false],
        'galeri' => ['judul' => true],
    ];

    public function __invoke(Request $request): JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }
        LegacyAiRuntime::load();

        $body = $request->json()->all();
        $module = is_string($body['modul'] ?? null) ? trim($body['modul']) : '';
        if (!isset(self::MODULES[$module])) {
            return response()->json([
                'error' => "Field 'modul' harus salah satu dari: " . implode(', ', array_keys(self::MODULES)),
            ], 400);
        }

        $notes = is_string($body['catatan'] ?? null) ? trim($body['catatan']) : '';
        if ($notes === '') {
            return response()->json(['error' => 'Tuliskan catatan singkat dulu, lalu klik buat draf.'], 400);
        }
        if (mb_strlen($notes, 'UTF-8') > 2000) {
            return response()->json(['error' => 'Catatan terlalu panjang. Maksimal 2000 karakter.'], 400);
        }

        $options = aiFeatureOptions('content');
        if (!aiProviderConfigured($options)) {
            error_log('[SMKN24] Draf AI dilewati: API key provider belum diisi di .env.');

            return response()->json([
                'error' => AI_CONTENT_UNAVAILABLE_MESSAGE,
                'aiAvailable' => false,
                'reason' => 'not_configured',
            ], 503);
        }

        $messages = [
            [
                'role' => 'system',
                'content' => AI_CONTENT_SYSTEM_PROMPT . "\n\nModul yang diminta sekarang: '" . $module . "'.",
            ],
            ['role' => 'user', 'content' => "Catatan admin:\n\n" . $notes],
        ];
        try {
            $references = LegacyAiRuntime::withAssociativePdo(
                fn (\PDO $pdo): string => buildDraftReferences($pdo, $notes)
            );
            if ($references !== '') {
                $messages[1]['content'] .= "\n\n" . $references;
            }
        } catch (Throwable $error) {
            error_log('[SMKN24] Referensi draf AI dilewati: ' . $error->getMessage());
        }

        try {
            $raw = callAiProvider($messages, array_merge($options, [
                'max_tokens' => 1600,
                'temperature' => 0.7,
            ]));
            $parsed = extractJsonObject($raw);
        } catch (Throwable $error) {
            error_log('[SMKN24] Draf AI gagal: ' . $error->getMessage());

            return response()->json([
                'error' => AI_CONTENT_UNAVAILABLE_MESSAGE,
                'aiAvailable' => false,
                'reason' => 'provider_error',
            ], 502);
        }

        if ($parsed === null) {
            error_log('[SMKN24] Draf AI tidak mengembalikan JSON yang valid. Modul: ' . $module);

            return response()->json([
                'error' => 'Draf dari AI tidak dapat dibaca. Silakan coba lagi atau tulis manual.',
                'aiAvailable' => true,
                'reason' => 'invalid_response',
            ], 502);
        }

        $draft = $this->normalise($module, $parsed);
        $requiredField = self::MODULES[$module]['judul'] ? 'judul' : 'deskripsi';
        if (trim($draft[$requiredField]) === '') {
            return response()->json([
                'error' => 'Draf dari AI tidak memuat isi yang cukup. Silakan coba lagi atau tulis manual.',
                'aiAvailable' => true,
                'reason' => 'invalid_response',
            ], 502);
        }

        return response()->json(['draf' => $draft, 'aiAvailable' => true, 'reason' => null]);
    }

    private function normalise(string $module, array $data): array
    {
        return match ($module) {
            'berita' => [
                'judul' => $this->cleanText($data['judul'] ?? '', 255),
                'ringkasan' => $this->cleanText($data['ringkasan'] ?? '', 1000),
                'isi' => sanitizeBeritaHtml($data['isi'] ?? '', 20000),
            ],
            'pengumuman' => [
                'judul' => $this->cleanText($data['judul'] ?? '', 255),
                'isi' => $this->cleanText($data['isi'] ?? '', 5000),
                'badge' => $this->cleanText($data['badge'] ?? '', 100),
                'status' => $this->cleanText($data['status'] ?? '', 50),
            ],
            'agenda' => [
                'judul' => $this->cleanText($data['judul'] ?? '', 255),
                'badge' => $this->cleanText($data['badge'] ?? '', 100),
                'lokasi' => $this->cleanText($data['lokasi'] ?? '', 255),
                'deskripsi' => $this->cleanText($data['deskripsi'] ?? '', 2000),
            ],
            'fasilitas' => [
                'judul' => $this->cleanText($data['judul'] ?? '', 255),
                'deskripsi' => $this->cleanText($data['deskripsi'] ?? '', 1000),
            ],
            'guru' => [
                'jabatan' => $this->cleanText($data['jabatan'] ?? '', 255),
                'deskripsi' => $this->cleanText($data['deskripsi'] ?? '', 1000),
            ],
            'galeri' => ['judul' => $this->cleanText($data['judul'] ?? '', 255)],
        };
    }

    private function cleanText(mixed $value, int $maxLength): string
    {
        if (is_array($value) || is_bool($value) || $value === null) {
            return '';
        }

        $text = trim((string) $value);
        $text = preg_replace('/[ \t]+/', ' ', $text) ?? $text;
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return mb_strlen($text, 'UTF-8') > $maxLength
            ? mb_substr($text, 0, $maxLength, 'UTF-8')
            : $text;
    }
}
