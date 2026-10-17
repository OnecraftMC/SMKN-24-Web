<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use PDO;

final class LegacyAiRuntime
{
    private static bool $loaded = false;

    public static function load(): void
    {
        if (self::$loaded) {
            return;
        }

        $backend = dirname(base_path()) . DIRECTORY_SEPARATOR . 'backend';
        require_once $backend . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'config.php';
        require_once $backend . DIRECTORY_SEPARATOR . 'helpers' . DIRECTORY_SEPARATOR . 'ai.php';
        require_once $backend . DIRECTORY_SEPARATOR . 'helpers' . DIRECTORY_SEPARATOR . 'chat_analytics.php';
        require_once $backend . DIRECTORY_SEPARATOR . 'helpers' . DIRECTORY_SEPARATOR . 'chat_tools.php';
        require_once $backend . DIRECTORY_SEPARATOR . 'helpers' . DIRECTORY_SEPARATOR . 'website.php';
        require_once $backend . DIRECTORY_SEPARATOR . 'helpers' . DIRECTORY_SEPARATOR . 'sanitize_html.php';

        self::$loaded = true;
    }

    public static function withAssociativePdo(callable $callback): mixed
    {
        $pdo = DB::connection()->getPdo();
        $fetchMode = $pdo->getAttribute(PDO::ATTR_DEFAULT_FETCH_MODE);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        try {
            return $callback($pdo);
        } finally {
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, $fetchMode);
        }
    }
}
