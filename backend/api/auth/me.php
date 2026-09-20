<?php
require_once __DIR__ . '/../../bootstrap.php';

requireMethod('GET');

$payload = requireAuth();

jsonResponse([
    'id' => $payload['sub'],
    'username' => $payload['username'],
    'role' => $payload['role'],
]);
