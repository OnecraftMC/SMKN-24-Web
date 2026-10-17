<?php

namespace App\Http\Controllers\Api;

use App\Support\AdminApi;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CanteenAdminController
{
    public function __invoke(Request $request): JsonResponse
    {
        $claims = (new \App\Support\LegacyJwt((string) env('JWT_SECRET', '')))
            ->verify($request->bearerToken() ?? '');
        if ($claims === null) {
            return AdminApi::unauthorized($request);
        }
        if (!in_array($claims['role'] ?? '', ['admin', 'superadmin'], true)) {
            return response()->json(['error' => 'Akses khusus administrator diperlukan.'], 403);
        }

        if ($request->isMethod('GET')) {
            return $this->index((string) $request->query('resource', 'stands'));
        }
        $body = $request->json()->all();

        return match ($request->method()) {
            'POST' => $this->create($body),
            'PUT' => $this->update($body),
            default => response()->json(['error' => 'Method tidak diizinkan.'], 405),
        };
    }

    private function index(string $resource): JsonResponse
    {
        if ($resource === 'stands') {
            $rows = DB::table('canteen_stands as s')
                ->select('s.*')
                ->selectSub(DB::table('canteen_users as u')->selectRaw('COUNT(*)')
                    ->whereColumn('u.stand_id', 's.id')->where('u.is_active', 1), 'seller_count')
                ->selectSub(DB::table('canteen_menu_items as m')->selectRaw('COUNT(*)')
                    ->whereColumn('m.stand_id', 's.id'), 'menu_count')
                ->orderByDesc('s.id')
                ->get()
                ->map(static function (object $row): object {
                    foreach (['id', 'is_active', 'seller_count', 'menu_count'] as $field) {
                        $row->{$field} = (int) $row->{$field};
                    }

                    return $row;
                });

            return response()->json(['stands' => $rows]);
        }
        if ($resource === 'sellers') {
            $rows = DB::table('canteen_users as u')
                ->join('canteen_stands as s', 's.id', '=', 'u.stand_id')
                ->select('u.id', 'u.stand_id as standId', 's.name as standName', 'u.username',
                    'u.full_name as fullName', 'u.is_active as isActive',
                    'u.must_change_password as mustChangePassword', 'u.last_login_at as lastLoginAt')
                ->orderByDesc('u.id')
                ->get()
                ->map(static function (object $row): object {
                    foreach (['id', 'standId', 'isActive', 'mustChangePassword'] as $field) {
                        $row->{$field} = (int) $row->{$field};
                    }

                    return $row;
                });

            return response()->json(['sellers' => $rows]);
        }
        if ($resource === 'menu') {
            $rows = DB::table('canteen_menu_items as m')
                ->join('canteen_stands as s', 's.id', '=', 'm.stand_id')
                ->select('m.id', 'm.stand_id as standId', 's.name as standName', 'm.name', 'm.description',
                    'm.category', 'm.price', 'm.image_url as imageUrl', 'm.is_available as isAvailable',
                    'm.sort_order as sortOrder')
                ->orderBy('s.name')
                ->orderBy('m.sort_order')
                ->orderBy('m.id')
                ->get()
                ->map(static function (object $row): object {
                    foreach (['id', 'standId', 'price', 'isAvailable', 'sortOrder'] as $field) {
                        $row->{$field} = (int) $row->{$field};
                    }

                    return $row;
                });

            return response()->json(['menu' => $rows]);
        }

        return response()->json(['error' => 'Resource tidak ditemukan.'], 404);
    }

    private function create(array $body): JsonResponse
    {
        $action = $body['action'] ?? '';
        if ($action === 'create_stand') {
            $name = $this->requiredString($body, 'name', 120);
            $asciiName = function_exists('iconv') ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) : $name;
            $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $asciiName ?: $name), '-'));
            if ($slug === '') {
                $slug = 'stand-' . bin2hex(random_bytes(3));
            }
            $base = substr($slug, 0, 70);
            $slug = $base;
            for ($suffix = 2; DB::table('canteen_stands')->where('slug', $slug)->exists(); $suffix++) {
                $slug = $base . '-' . $suffix;
            }
            $id = DB::table('canteen_stands')->insertGetId([
                'slug' => $slug,
                'name' => $name,
                'description' => $this->optionalString($body, 'description'),
                'image_url' => $this->optionalString($body, 'imageUrl') ?: null,
                'is_active' => !empty($body['isActive']) ? 1 : 0,
            ]);

            return response()->json(['created' => true, 'id' => $id, 'slug' => $slug], 201);
        }
        if ($action === 'create_seller') {
            $standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
            $username = trim((string) ($body['username'] ?? ''));
            $fullName = $this->requiredString($body, 'fullName', 120);
            if (!$standId || !preg_match('/\A[a-zA-Z0-9._-]{3,60}\z/', $username)) {
                return response()->json(['error' => 'Pilih stand dan username 3–60 karakter (huruf, angka, titik, _ atau -).'], 422);
            }
            if (!DB::table('canteen_stands')->where('id', $standId)->where('is_active', 1)->exists()) {
                return response()->json(['error' => 'Stand tidak tersedia.'], 422);
            }
            $temporary = bin2hex(random_bytes(10)) . 'Aa!';
            try {
                DB::table('canteen_users')->insert([
                    'stand_id' => $standId,
                    'username' => $username,
                    'password_hash' => password_hash($temporary, PASSWORD_DEFAULT),
                    'full_name' => $fullName,
                ]);
            } catch (QueryException $error) {
                if ((string) $error->getCode() === '23000') {
                    return response()->json(['error' => 'Username sudah digunakan.'], 409);
                }
                throw $error;
            }

            return response()->json(['created' => true, 'temporaryPassword' => $temporary], 201);
        }
        if ($action === 'reset_password') {
            $sellerId = filter_var($body['sellerId'] ?? null, FILTER_VALIDATE_INT);
            if (!$sellerId) {
                return response()->json(['error' => 'Akun penjual tidak valid.'], 422);
            }
            $temporary = bin2hex(random_bytes(10)) . 'Aa!';
            if (DB::table('canteen_users')->where('id', $sellerId)->update([
                'password_hash' => password_hash($temporary, PASSWORD_DEFAULT),
                'must_change_password' => 1,
            ]) === 0) {
                return response()->json(['error' => 'Akun penjual tidak ditemukan.'], 404);
            }

            return response()->json(['temporaryPassword' => $temporary]);
        }
        if ($action === 'create_menu') {
            $standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
            $name = $this->requiredString($body, 'name', 140);
            $category = $body['category'] ?? '';
            $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
            if (!$standId || !in_array($category, ['food', 'drink'], true) || !$price || $price < 1000 || $price > 1000000) {
                return response()->json(['error' => 'Data menu tidak valid.'], 422);
            }
            $id = DB::table('canteen_menu_items')->insertGetId([
                'stand_id' => $standId,
                'name' => $name,
                'description' => $this->optionalString($body, 'description'),
                'category' => $category,
                'price' => $price,
                'image_url' => $this->optionalString($body, 'imageUrl') ?: null,
                'is_available' => !empty($body['isAvailable']) ? 1 : 0,
                'sort_order' => (int) ($body['sortOrder'] ?? 0),
            ]);

            return response()->json(['created' => true, 'id' => $id], 201);
        }

        return response()->json(['error' => 'Aksi tidak dikenali.'], 400);
    }

    private function update(array $body): JsonResponse
    {
        $action = $body['action'] ?? '';
        if ($action === 'update_stand') {
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            $name = $this->requiredString($body, 'name', 120);
            if (!$id) {
                return response()->json(['error' => 'Stand tidak valid.'], 422);
            }
            DB::table('canteen_stands')->where('id', $id)->update([
                'name' => $name,
                'description' => $this->optionalString($body, 'description'),
                'image_url' => $this->optionalString($body, 'imageUrl') ?: null,
                'is_active' => !empty($body['isActive']) ? 1 : 0,
            ]);

            return response()->json(['updated' => true]);
        }
        if ($action === 'update_menu') {
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            $name = $this->requiredString($body, 'name', 140);
            $category = $body['category'] ?? '';
            $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
            if (!$id || !in_array($category, ['food', 'drink'], true) || !$price || $price < 1000 || $price > 1000000) {
                return response()->json(['error' => 'Data menu tidak valid.'], 422);
            }
            DB::table('canteen_menu_items')->where('id', $id)->update([
                'name' => $name,
                'description' => $this->optionalString($body, 'description'),
                'category' => $category,
                'price' => $price,
                'image_url' => $this->optionalString($body, 'imageUrl') ?: null,
                'is_available' => !empty($body['isAvailable']) ? 1 : 0,
                'sort_order' => (int) ($body['sortOrder'] ?? 0),
            ]);

            return response()->json(['updated' => true]);
        }

        return response()->json(['error' => 'Aksi tidak dikenali.',], 400);
    }

    private function requiredString(array $body, string $key, int $max): string
    {
        $value = is_string($body[$key] ?? null) ? trim($body[$key]) : '';
        if ($value === '' || mb_strlen($value, 'UTF-8') > $max) {
            abort(response()->json(['error' => "Kolom $key wajib diisi (maksimal $max karakter)."], 422));
        }

        return $value;
    }

    private function optionalString(array $body, string $key): string
    {
        return is_string($body[$key] ?? null) ? trim($body[$key]) : '';
    }
}
