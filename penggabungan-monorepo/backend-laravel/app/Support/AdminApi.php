<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class AdminApi
{
    public static function authorized(Request $request): bool
    {
        return (new LegacyJwt((string) env('JWT_SECRET', '')))
            ->verify($request->bearerToken() ?? '') !== null;
    }

    public static function unauthorized(Request $request): JsonResponse
    {
        return response()->json([
            'error' => $request->bearerToken()
                ? 'Token tidak valid atau sudah kedaluwarsa.'
                : 'Token tidak ditemukan. Silakan login.',
        ], 401);
    }

    public static function category(string $module, mixed $category): string|null|JsonResponse
    {
        if ($category === null || $category === '') {
            return null;
        }
        if (!is_string($category)) {
            return response()->json(['error' => 'Kategori harus berupa teks.'], 400);
        }

        $category = trim($category);
        if ($category === '' || strlen($category) > 100) {
            return response()->json(['error' => 'Kategori harus berisi maksimal 100 karakter.'], 400);
        }

        $stored = DB::table('admin_categories')
            ->where('module_name', $module)
            ->where('category_name', $category)
            ->value('category_name');

        return is_string($stored)
            ? $stored
            : response()->json([
                'error' => 'Kategori belum terdaftar. Tambahkan kategori terlebih dahulu.',
            ], 400);
    }
}
