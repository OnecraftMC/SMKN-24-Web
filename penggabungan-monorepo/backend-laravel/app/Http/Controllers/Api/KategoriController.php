<?php

namespace App\Http\Controllers\Api;

use App\Support\LegacyJwt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KategoriController
{
    private const MODULES = [
        'agenda', 'berita', 'pengumuman', 'guru', 'galeri',
        'fasilitas', 'arsip', 'jadwal', 'bk', 'prestasi',
    ];

    public function __invoke(Request $request): JsonResponse
    {
        if (!$this->authorized($request)) {
            $message = $request->bearerToken()
                ? 'Token tidak valid atau sudah kedaluwarsa.'
                : 'Token tidak ditemukan. Silakan login.';
            return response()->json(['error' => $message], 401);
        }

        return match ($request->method()) {
            'GET' => $this->index($request),
            'POST' => $this->store($request),
            default => response()->json(['error' => 'Method tidak diizinkan.'], 405),
        };
    }

    private function index(Request $request): JsonResponse
    {
        $module = trim((string) $request->query('module', ''));
        if (!in_array($module, self::MODULES, true)) {
            return response()->json(['error' => 'Modul kategori tidak valid.'], 400);
        }

        $categories = DB::table('admin_categories')
            ->where('module_name', $module)
            ->orderBy('category_name')
            ->pluck('category_name');

        return response()->json($categories);
    }

    private function store(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $module = $body['module'] ?? null;
        $name = $body['name'] ?? null;
        if (!is_string($module) || !in_array($module, self::MODULES, true)) {
            return response()->json(['error' => "Field 'module' tidak valid."], 400);
        }
        if (!is_string($name)) {
            return response()->json(['error' => "Field 'name' wajib berupa teks."], 400);
        }
        $name = trim($name);
        if ($name === '' || strlen($name) > 100) {
            return response()->json(['error' => "Field 'name' wajib diisi dan maksimal 100 karakter."], 400);
        }

        $inserted = DB::table('admin_categories')->insertOrIgnore([
            'module_name' => $module,
            'category_name' => $name,
        ]);
        $stored = DB::table('admin_categories')
            ->where('module_name', $module)
            ->where('category_name', $name)
            ->value('category_name');
        if (!is_string($stored)) {
            report(new \RuntimeException('Kategori tidak ditemukan setelah insert.'));
            return response()->json(['error' => 'Kategori gagal disimpan.'], 500);
        }

        return response()->json(['name' => $stored], $inserted === 1 ? 201 : 200);
    }

    private function authorized(Request $request): bool
    {
        return (new LegacyJwt((string) env('JWT_SECRET', '')))
            ->verify($request->bearerToken() ?? '') !== null;
    }
}
