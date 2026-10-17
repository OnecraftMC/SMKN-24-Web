<?php

$apiDirectory = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'api';
$routeFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'routes' . DIRECTORY_SEPARATOR . 'api.php';

$legacyRoutes = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($apiDirectory, FilesystemIterator::SKIP_DOTS)
);
foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }
    $legacyRoutes[] = str_replace(DIRECTORY_SEPARATOR, '/', substr($file->getPathname(), strlen($apiDirectory) + 1));
}
sort($legacyRoutes);

$source = file_get_contents($routeFile);
if (!is_string($source)) {
    throw new RuntimeException('Laravel API route file could not be read.');
}
preg_match_all(
    "/Route::(?:get|post|match)\\(\\s*(?:\\[[^\\]]*\\]\\s*,\\s*)?['\"]([^'\"]+)['\"]/i",
    $source,
    $matches
);
$laravelRoutes = array_map(
    static fn (string $route): string => ltrim($route, '/'),
    $matches[1] ?? []
);
sort($laravelRoutes);

$missing = array_values(array_diff($legacyRoutes, $laravelRoutes));
$extra = array_values(array_diff($laravelRoutes, $legacyRoutes));
if ($missing !== [] || $extra !== []) {
    throw new RuntimeException(
        'Legacy API route mismatch. Missing: ' . implode(', ', $missing)
        . '; extra: ' . implode(', ', $extra)
    );
}

printf("Laravel route coverage matches all %d legacy endpoints.\n", count($legacyRoutes));
