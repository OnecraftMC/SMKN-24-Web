<?php

namespace App\Http\Controllers\Api;

use App\Support\CanteenSellerToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CanteenSellerAuthController
{
    public function __invoke(Request $request, CanteenSellerToken $tokens): JsonResponse
    {
        $body = $request->json()->all();
        $action = $body['action'] ?? 'login';
        if ($action === 'login') {
            $username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
            $password = is_string($body['password'] ?? null) ? $body['password'] : '';
            $user = DB::table('canteen_users as u')
                ->join('canteen_stands as s', 's.id', '=', 'u.stand_id')
                ->where('u.username', $username)
                ->select('u.id', 'u.stand_id', 'u.username', 'u.password_hash', 'u.full_name',
                    'u.must_change_password', 'u.is_active', 's.name as stand_name')
                ->first();
            if (!$user || !(int) $user->is_active || !password_verify($password, $user->password_hash)) {
                return response()->json(['error' => 'Nama pengguna atau kata sandi salah.'], 401);
            }
            if (trim((string) env('JWT_SECRET', '')) === '') {
                return response()->json(['error' => 'Konfigurasi sesi penjual belum tersedia.'], 503);
            }

            DB::table('canteen_users')->where('id', $user->id)->update(['last_login_at' => now()]);

            return response()->json([
                'token' => $tokens->issue((int) $user->id, (int) $user->stand_id),
                'mustChangePassword' => (bool) $user->must_change_password,
                'user' => [
                    'id' => (int) $user->id,
                    'username' => $user->username,
                    'fullName' => $user->full_name,
                    'standId' => (int) $user->stand_id,
                    'standName' => $user->stand_name,
                ],
            ]);
        }
        if ($action === 'change_password') {
            $claims = $tokens->verify($request->bearerToken() ?? '');
            if ($claims === null) {
                return response()->json(['error' => 'Sesi penjual tidak valid atau sudah kedaluwarsa.'], 401);
            }
            $current = is_string($body['currentPassword'] ?? null) ? $body['currentPassword'] : '';
            $new = is_string($body['newPassword'] ?? null) ? $body['newPassword'] : '';
            if (strlen($new) < 10 || strlen($new) > 128) {
                return response()->json(['error' => 'Kata sandi baru harus 10–128 karakter.'], 422);
            }
            $user = DB::table('canteen_users')
                ->where('id', (int) $claims['sub'])
                ->where('is_active', 1)
                ->first(['password_hash']);
            if (!$user || !password_verify($current, $user->password_hash)) {
                return response()->json(['error' => 'Kata sandi saat ini tidak sesuai.'], 401);
            }
            DB::table('canteen_users')->where('id', (int) $claims['sub'])->update([
                'password_hash' => password_hash($new, PASSWORD_DEFAULT),
                'must_change_password' => 0,
            ]);

            return response()->json(['updated' => true]);
        }

        return response()->json(['error' => 'Aksi tidak dikenali.'], 400);
    }
}
