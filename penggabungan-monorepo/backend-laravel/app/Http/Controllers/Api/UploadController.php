<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class UploadController
{
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public function __invoke(Request $request): JsonResponse
    {
        if ($request->method() !== 'POST') {
            return response()->json(['error' => 'Method tidak diizinkan, gunakan POST'], 405);
        }
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $file = $request->file('gambar');
        if (!$file || !$file->isValid()) {
            return response()->json(['error' => $file ? 'Gagal mengunggah gambar.' : 'Tidak ada file yang diunggah'], 400);
        }
        $mime = $file->getMimeType();
        if (!isset(self::TYPES[$mime])) {
            return response()->json(['error' => 'Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.'], 400);
        }
        if ($file->getSize() > 5 * 1024 * 1024) {
            return response()->json(['error' => 'Ukuran file maksimal 5MB.'], 400);
        }
        $image = @getimagesize($file->getRealPath());
        if ($image === false) {
            return response()->json(['error' => 'Isi file bukan gambar yang valid.'], 400);
        }

        $configuredDirectory = trim((string) env('PUBLIC_UPLOAD_DIR', ''));
        $directory = $configuredDirectory !== ''
            ? $configuredDirectory
            : base_path('../backend/uploads');
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            report(new RuntimeException('Direktori upload publik tidak dapat disiapkan.'));
            return response()->json(['error' => 'Penyimpanan gambar belum tersedia.'], 500);
        }
        $extension = self::TYPES[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        if (!$file->move($directory, $filename)) {
            return response()->json(['error' => 'Gagal menyimpan file di server.'], 500);
        }

        $urlBase = rtrim((string) env('UPLOAD_URL_BASE', '/backend/uploads/'), '/') . '/';
        return response()->json(['url' => $urlBase . $filename]);
    }
}
