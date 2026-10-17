<?php

if (!function_exists('env')) {
    function env(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);

        return $value === false ? $default : $value;
    }
}

putenv('JWT_SECRET=canteen-seller-smoke-secret');
require __DIR__ . '/../app/Support/CanteenSellerToken.php';

$tokens = new App\Support\CanteenSellerToken();
$token = $tokens->issue(17, 4);
$claims = $tokens->verify($token);
if (($claims['sub'] ?? null) !== 17 || ($claims['stand_id'] ?? null) !== 4) {
    throw new RuntimeException('Seller token did not round-trip its identity claims.');
}

$last = substr($token, -1);
$tampered = substr($token, 0, -1) . ($last === 'a' ? 'b' : 'a');
if ($tokens->verify($tampered) !== null) {
    throw new RuntimeException('Tampered seller token was accepted.');
}

putenv('JWT_SECRET=');
if ($tokens->verify($token) !== null) {
    throw new RuntimeException('Seller token was accepted without a configured secret.');
}

echo "Canteen seller token checks passed.\n";
