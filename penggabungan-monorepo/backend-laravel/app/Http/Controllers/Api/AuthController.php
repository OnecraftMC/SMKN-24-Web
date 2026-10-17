<?php

namespace App\Http\Controllers\Api;

use App\Support\LegacyJwt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController
{
    public function login(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
        $password = is_string($body['password'] ?? null) ? $body['password'] : '';
        if ($username === '' || $password === '') {
            return response()->json(['error' => 'Username dan password wajib diisi.'], 400);
        }

        $user = DB::table('admin_users')->where('username', $username)->first();
        if (!$user || !password_verify($password, $user->password)) {
            return response()->json(['error' => 'Username atau password salah.'], 401);
        }

        $secret = (string) env('JWT_SECRET', '');
        if ($secret === '') {
            report(new \RuntimeException('JWT_SECRET belum dikonfigurasi untuk Laravel API.'));
            return response()->json(['error' => 'Konfigurasi server belum lengkap. Hubungi administrator.'], 500);
        }

        $token = (new LegacyJwt($secret))->issue([
            'sub' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (int) $user->id,
                'username' => $user->username,
                'nama' => $user->nama,
                'role' => $user->role,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $token = $this->bearerToken($request);
        $payload = $token ? (new LegacyJwt((string) env('JWT_SECRET', '')))->verify($token) : null;
        if (!$payload) {
            return response()->json([
                'error' => $token
                    ? 'Token tidak valid atau sudah kedaluwarsa.'
                    : 'Token tidak ditemukan. Silakan login.',
            ], 401);
        }

        $user = DB::table('admin_users')
            ->select('id', 'username', 'nama', 'role')
            ->where('id', (int) ($payload['sub'] ?? 0))
            ->first();
        if (!$user) {
            return response()->json(['error' => 'Akun admin tidak ditemukan.'], 401);
        }

        return response()->json([
            'id' => (int) $user->id,
            'username' => $user->username,
            'nama' => $user->nama,
            'role' => $user->role,
        ]);
    }

    private function bearerToken(Request $request): ?string
    {
        return preg_match('/Bearer\s+(.*)$/i', $request->header('Authorization', ''), $matches)
            ? $matches[1]
            : null;
    }
}
