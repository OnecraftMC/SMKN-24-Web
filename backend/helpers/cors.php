<?php
require_once __DIR__ . '/../config/config.php';

function applyCors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif (in_array('*', ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
