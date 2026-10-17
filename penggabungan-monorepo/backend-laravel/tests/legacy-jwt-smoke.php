<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Support\LegacyJwt;

$jwt = new LegacyJwt('shared-secret', 28800);
$token = $jwt->issue(['sub' => 24, 'username' => 'admin24'], 1000);
$payload = $jwt->verify($token, 1000);
if (($payload['sub'] ?? null) !== 24 || ($payload['iat'] ?? null) !== 1000 || ($payload['exp'] ?? null) !== 29800) {
    throw new RuntimeException('Legacy JWT issue/verify compatibility failed.');
}
if ($jwt->verify($token, 29801) !== null
    || $jwt->verify($token . 'tampered', 1001) !== null
    || (new LegacyJwt(''))->verify($token, 1001) !== null) {
    throw new RuntimeException('Legacy JWT accepted an expired or invalid token.');
}

echo "Legacy JWT compatibility checks passed.\n";
