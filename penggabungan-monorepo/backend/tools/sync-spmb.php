<?php
/** Sinkronisasi manual/cron cache sumber SPMB dari URL yang disediakan operator. */
require_once __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');
require_once __DIR__ . '/../helpers/website.php';
require_once __DIR__ . '/../helpers/spmb_cache.php';

function syncSpmbCache(): int
{
    $path = spmbCachePath();
    $lock = @fopen($path . '.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        if (is_resource($lock)) {
            fclose($lock);
        }
        fwrite(STDERR, "Sinkronisasi SPMB sedang berjalan atau lock tidak dapat dibuat.\n");
        return 1;
    }

    try {
        $rawSources = getenv('SPMB_SOURCES');
        $sources = is_string($rawSources)
            ? array_values(array_unique(array_filter(array_map('trim', explode(',', $rawSources)))))
            : [];
        $sources = array_values(array_filter($sources, static fn(string $url): bool => filter_var($url, FILTER_VALIDATE_URL) !== false));
        if ($sources === []) {
            fwrite(STDERR, "SPMB_SOURCES kosong atau tidak berisi URL valid.\n");
            return 1;
        }

        $rawTimeout = getenv('SPMB_FETCH_TIMEOUT');
        $timeout = max(1, (int) (($rawTimeout !== false && $rawTimeout !== '') ? $rawTimeout : 10));
        $pages = fetchWebsiteUrls($sources, $timeout);
        $items = [];
        foreach ($sources as $source) {
            $html = $pages[$source] ?? '';
            $text = extractWebsiteText($html);
            if ($text === '') {
                continue;
            }
            $items[] = ['source' => $source, 'text' => wbTruncate($text, 6000)];
        }
        if ($items === []) {
            fwrite(STDERR, "Semua sumber SPMB gagal diambil atau tidak menghasilkan teks. Cache lama dipertahankan.\n");
            return 1;
        }

        $cache = ['fetched_at' => gmdate('c'), 'items' => $items];
        if (!spmbTulisCache($cache)) {
            fwrite(STDERR, "Cache SPMB gagal ditulis: $path\n");
            return 1;
        }
        fwrite(STDOUT, sprintf("Cache SPMB diperbarui: %d sumber.\n", count($items)));
        return 0;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    exit(syncSpmbCache());
}
