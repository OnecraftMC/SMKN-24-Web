<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use App\Support\PrivateUploads;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BkMediaController
{
    public function __invoke(Request $request, PrivateUploads $uploads): BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        if (!AdminApi::authorized($request)) {
            return AdminApi::unauthorized($request);
        }

        $file = (string) $request->query('file', '');
        if (!preg_match('/\A[a-f0-9]{32}\.(jpg|png|webp|webm|ogg|m4a|mp3|wav)\z/', $file)) {
            return response()->json(['error' => 'Lampiran tidak ditemukan.'], 404);
        }

        $directory = $uploads->bkDirectory();
        $path = realpath($directory . DIRECTORY_SEPARATOR . $file);
        if ($path === false || dirname($path) !== $directory || !is_file($path) || !is_readable($path)) {
            return response()->json(['error' => 'Lampiran tidak ditemukan.'], 404);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo === false ? false : finfo_file($finfo, $path);
        if ($finfo !== false) {
            finfo_close($finfo);
        }
        $allowed = [
            'image/jpeg', 'image/png', 'image/webp',
            'audio/webm', 'video/webm', 'audio/ogg', 'audio/mp4', 'video/mp4',
            'audio/mpeg', 'audio/wav', 'audio/x-wav', 'application/ogg',
        ];
        if (!is_string($mime) || !in_array($mime, $allowed, true)) {
            return response()->json(['error' => 'Format lampiran tidak didukung.'], 415);
        }

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="lampiran-bk"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }
}
