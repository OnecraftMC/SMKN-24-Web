<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use RuntimeException;

final class PrivateUploads
{
    public function store(UploadedFile $file, array $types): array
    {
        if (!$file->isValid() || $file->getSize() < 1 || $file->getSize() > 10 * 1024 * 1024) {
            throw new UploadException('File tidak valid atau melebihi batas 10 MB.', 413);
        }

        $originalName = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $originalName = trim((string) preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName));
        if ($originalName === '' || strlen($originalName) > 180) {
            throw new UploadException('Nama file tidak valid.', 400);
        }

        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!isset($types[$extension])) {
            throw new UploadException('Format file tidak didukung.', 400);
        }

        $mime = $file->getMimeType();
        if (!is_string($mime) || !in_array($mime, $types[$extension], true)) {
            throw new UploadException('Isi file tidak sesuai dengan format yang diizinkan.', 400);
        }
        $this->validateContents($extension, $file->getRealPath());

        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
        $path = $this->directory() . DIRECTORY_SEPARATOR . $storedName;
        if (!move_uploaded_file($file->getRealPath(), $path)) {
            throw new UploadException('File lolos validasi tetapi gagal disimpan.', 500);
        }
        if (!chmod($path, 0600)) {
            if (!unlink($path)) {
                report(new RuntimeException('File privat gagal dibersihkan setelah chmod gagal.'));
            }
            throw new UploadException('Izin file privat tidak dapat dibatasi.', 500);
        }

        return [
            'storedName' => $storedName,
            'originalName' => $originalName,
            'mime' => $mime,
            'size' => (int) $file->getSize(),
        ];
    }

    public function bkDirectory(): string
    {
        $directory = $this->directory() . DIRECTORY_SEPARATOR . 'bk-evidence';
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new UploadException('Penyimpanan bukti BK belum dapat disiapkan.', 500);
        }
        $real = realpath($directory);
        if ($real === false || !chmod($real, 0700)) {
            throw new UploadException('Penyimpanan bukti BK tidak tersedia.', 500);
        }

        return rtrim($real, DIRECTORY_SEPARATOR);
    }

    public function storeBkMedia(UploadedFile $file, bool $audio = false): array
    {
        $size = (int) $file->getSize();
        $maxSize = $audio ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        if (!$file->isValid() || $size < 1 || $size > $maxSize) {
            throw new UploadException(
                $audio ? 'Pesan suara maksimal 10 MB.' : 'Setiap foto bukti maksimal 5 MB.',
                413
            );
        }

        $mime = $file->getMimeType();
        if ($audio) {
            $mime = [
                'video/webm' => 'audio/webm',
                'video/mp4' => 'audio/mp4',
                'video/ogg' => 'audio/ogg',
            ][$mime] ?? $mime;
            $extensions = [
                'audio/webm' => 'webm',
                'audio/ogg' => 'ogg',
                'audio/mp4' => 'm4a',
                'audio/mpeg' => 'mp3',
                'audio/wav' => 'wav',
                'application/ogg' => 'ogg',
            ];
        } else {
            $extensions = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ];
        }
        if (!is_string($mime) || !isset($extensions[$mime])) {
            throw new UploadException(
                $audio ? 'Format pesan suara tidak didukung browser/server ini.' : 'Bukti harus berupa foto JPG, PNG, atau WEBP.',
                400
            );
        }
        if (!$audio && @getimagesize($file->getRealPath()) === false) {
            throw new UploadException('Bukti harus berupa foto JPG, PNG, atau WEBP.', 400);
        }

        $storedName = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
        $destination = $this->bkDirectory() . DIRECTORY_SEPARATOR . $storedName;
        try {
            $file->move($this->bkDirectory(), $storedName);
        } catch (\Throwable $error) {
            report($error);
            throw new UploadException('File media lolos validasi tetapi gagal disimpan.', 500);
        }
        if (!chmod($destination, 0600)) {
            if (!unlink($destination)) {
                report(new RuntimeException('File BK gagal dibersihkan setelah chmod gagal.'));
            }
            throw new UploadException('Izin file media tidak dapat dibatasi.', 500);
        }

        return [
            'storedName' => $storedName,
            'mime' => $mime,
            'size' => $size,
            'label' => $audio ? 'Pesan suara' : 'Foto bukti',
        ];
    }

    public function deleteBkMedia(string $storedName): bool
    {
        if (!preg_match('/\A[a-f0-9]{32}\.(jpg|png|webp|webm|ogg|m4a|mp3|wav)\z/', $storedName)) {
            return false;
        }
        $path = $this->bkDirectory() . DIRECTORY_SEPARATOR . $storedName;

        return !file_exists($path) || (is_file($path) && unlink($path));
    }

    public function delete(?string $storedName): bool
    {
        if ($storedName === null) {
            return true;
        }
        if (!preg_match('/\A[a-f0-9]{32}\.(pdf|docx|jpg|jpeg|png)\z/', $storedName)) {
            return false;
        }
        $path = $this->directory() . DIRECTORY_SEPARATOR . $storedName;
        return !file_exists($path) || (is_file($path) && unlink($path));
    }

    public function download(string $storedName, string $originalName, string $mime)
    {
        if (!preg_match('/\A[a-f0-9]{32}\.(pdf|docx|jpg|jpeg|png)\z/', $storedName)) {
            return null;
        }
        $directory = $this->directory();
        $path = realpath($directory . DIRECTORY_SEPARATOR . $storedName);
        if ($path === false || dirname($path) !== $directory || !is_file($path)) {
            return null;
        }

        return response()->download($path, $originalName, [
            'Content-Type' => $mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function enforceRateLimit(string $scope, int $limit, int $windowSeconds, string $ip): void
    {
        $directory = $this->directory() . DIRECTORY_SEPARATOR . 'rate-limits';
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new UploadException('Pembatasan pengajuan tidak tersedia saat ini.', 503);
        }
        $key = hash_hmac('sha256', $scope . ':' . ($ip ?: 'unknown'), (string) env('JWT_SECRET', ''));
        $path = $directory . DIRECTORY_SEPARATOR . $key . '.json';
        $handle = fopen($path, 'c+');
        if ($handle === false || !flock($handle, LOCK_EX)) {
            if (is_resource($handle)) {
                fclose($handle);
            }
            throw new UploadException('Pembatasan pengajuan tidak tersedia saat ini.', 503);
        }

        try {
            chmod($path, 0600);
            $contents = stream_get_contents($handle);
            $timestamps = $contents === '' ? [] : json_decode($contents, true);
            if (!is_array($timestamps)) {
                throw new UploadException('Data pembatasan pengajuan tidak dapat dibaca.', 503);
            }
            $now = time();
            $timestamps = array_values(array_filter(
                $timestamps,
                static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - $windowSeconds
            ));
            if (count($timestamps) >= $limit) {
                $retryAfter = max(1, $timestamps[0] + $windowSeconds - $now);
                throw new UploadException('Batas pengajuan sementara tercapai. Silakan coba lagi nanti.', 429, $retryAfter);
            }
            $timestamps[] = $now;
            $encoded = json_encode($timestamps);
            if ($encoded === false || !rewind($handle) || !ftruncate($handle, 0)
                || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
                throw new UploadException('Status pembatasan pengajuan gagal disimpan.', 503);
            }
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function directory(): string
    {
        $configured = trim((string) env('PRIVATE_UPLOAD_DIR', ''));
        $isAbsolute = str_starts_with($configured, DIRECTORY_SEPARATOR)
            || preg_match('/\A[A-Za-z]:[\\\\\/]/', $configured) === 1;
        $directory = $configured === ''
            ? storage_path('app/private')
            : ($isAbsolute ? $configured : base_path($configured));
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new UploadException('Penyimpanan dokumen privat belum dapat disiapkan.', 500);
        }

        $real = realpath($directory);
        if ($real === false || !chmod($real, 0700)) {
            throw new UploadException('Penyimpanan dokumen privat tidak tersedia.', 500);
        }
        $public = realpath(public_path());
        if ($public !== false && str_starts_with(
            strtolower($real . DIRECTORY_SEPARATOR),
            strtolower(rtrim($public, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR)
        )) {
            throw new UploadException('Penyimpanan dokumen harus berada di luar document root.', 500);
        }

        return rtrim($real, DIRECTORY_SEPARATOR);
    }

    private function validateContents(string $extension, string $path): void
    {
        if ($extension === 'pdf') {
            $handle = fopen($path, 'rb');
            $signature = $handle === false ? false : fread($handle, 5);
            if (is_resource($handle)) {
                fclose($handle);
            }
            if ($signature !== '%PDF-') {
                throw new UploadException('File PDF tidak memiliki tanda tangan PDF yang valid.', 400);
            }
            return;
        }
        if (in_array($extension, ['jpg', 'jpeg', 'png'], true)) {
            $image = @getimagesize($path);
            $expected = $extension === 'png' ? IMAGETYPE_PNG : IMAGETYPE_JPEG;
            if ($image === false || $image[2] !== $expected) {
                throw new UploadException('File gambar tidak valid.', 400);
            }
            return;
        }
        if ($extension !== 'docx' || !class_exists(\ZipArchive::class)) {
            throw new UploadException('Validasi dokumen DOCX tidak tersedia di server.', 503);
        }

        $archive = new \ZipArchive();
        if ($archive->open($path) !== true) {
            throw new UploadException('File DOCX bukan paket Office Open XML yang valid.', 400);
        }
        $seenContentTypes = false;
        $seenDocument = false;
        $expandedSize = 0;
        for ($i = 0; $i < $archive->numFiles; $i++) {
            $stat = $archive->statIndex($i);
            if (!is_array($stat)) {
                $archive->close();
                throw new UploadException('File DOCX tidak dapat divalidasi.', 400);
            }
            $name = strtolower(str_replace('\\', '/', $stat['name']));
            if (str_contains($name, '/../') || str_contains($name, '/vbaproject.bin')) {
                $archive->close();
                throw new UploadException('Dokumen DOCX berisi path atau konten yang tidak diizinkan.', 400);
            }
            $seenContentTypes = $seenContentTypes || str_ends_with($name, '/[content_types].xml');
            $seenDocument = $seenDocument || str_ends_with($name, '/word/document.xml');
            $expandedSize += (int) $stat['size'];
            if ($expandedSize > 25 * 1024 * 1024 || $i >= 500) {
                $archive->close();
                throw new UploadException('Isi DOCX melebihi batas keamanan.', 400);
            }
        }
        $archive->close();
        if (!$seenContentTypes || !$seenDocument) {
            throw new UploadException('File DOCX bukan dokumen Word yang valid.', 400);
        }
    }
}
