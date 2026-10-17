<?php

namespace App\Support;

final class RemoteDatabaseMutationGuard
{
    private const MUTATING_COMMANDS = [
        'db:seed',
        'db:wipe',
        'migrate',
        'migrate:fresh',
        'migrate:refresh',
        'migrate:reset',
        'migrate:rollback',
    ];

    private const DESTRUCTIVE_REMOTE_COMMANDS = [
        'db:seed',
        'db:wipe',
        'migrate:fresh',
        'migrate:refresh',
        'migrate:reset',
        'migrate:rollback',
    ];

    public static function denialReason(
        array $arguments,
        string $environment,
        array $connections,
        string $defaultConnection,
        mixed $allowRemoteMutations,
        mixed $allowDestructiveRemoteCommands,
    ): ?string {
        $commands = array_values(array_intersect($arguments, self::MUTATING_COMMANDS));
        if ($commands === []) {
            return null;
        }
        if ($commands[0] === 'migrate' && in_array('--pretend', $arguments, true)) {
            return null;
        }

        $target = self::remoteTarget($arguments, $connections, $defaultConnection);
        if ($target === null) {
            return 'Database connection cannot be verified; refusing a non-production database mutation.';
        }
        if (!$target) {
            return null;
        }

        if (in_array($commands[0], self::DESTRUCTIVE_REMOTE_COMMANDS, true)
            && !self::enabled($allowDestructiveRemoteCommands)) {
            return 'Blocked destructive command against a remote database. Set '
                . 'ALLOW_DESTRUCTIVE_REMOTE_DB_COMMANDS=true only for an explicitly approved operation.';
        }

        if (strtolower($environment) === 'production'
            || self::enabled($allowRemoteMutations)) {
            return null;
        }

        return 'Blocked database mutation: this non-production environment targets a remote database. '
            . 'Use a local database, or set ALLOW_REMOTE_DB_MUTATIONS=true temporarily for an intentional '
            . 'staging operation. Never use this override for production.';
    }

    public static function requestDenialReason(
        string $method,
        string $environment,
        array $connections,
        string $defaultConnection,
        mixed $allowRemoteMutations,
    ): ?string {
        if (in_array(strtoupper($method), ['GET', 'HEAD', 'OPTIONS'], true)
            || strtolower($environment) === 'production'
            || self::enabled($allowRemoteMutations)) {
            return null;
        }

        $target = self::remoteTarget([], $connections, $defaultConnection);
        if ($target === false) {
            return null;
        }
        if ($target === null) {
            return 'Write requests are disabled because the database target cannot be verified.';
        }

        return 'Write requests are disabled while a non-production environment targets a remote database. '
            . 'Use a local/staging database or explicitly approve the remote staging target.';
    }

    private static function remoteTarget(
        array $arguments,
        array $connections,
        string $defaultConnection,
    ): ?bool {
        $connectionName = $defaultConnection;
        foreach ($arguments as $index => $argument) {
            if (str_starts_with($argument, '--database=')) {
                $connectionName = substr($argument, strlen('--database='));
            } elseif ($argument === '--database' && isset($arguments[$index + 1])) {
                $connectionName = $arguments[$index + 1];
            }
        }

        $connection = $connections[$connectionName] ?? null;
        if (!is_array($connection)) {
            return null;
        }
        if (strtolower((string) ($connection['driver'] ?? '')) === 'sqlite') {
            return false;
        }

        $url = $connection['url'] ?? null;
        if (is_string($url) && $url !== '') {
            $parsed = parse_url($url);
            if (!is_array($parsed) || !isset($parsed['host'])) {
                return null;
            }
            $host = strtolower($parsed['host']);
        } else {
            $host = strtolower(trim((string) ($connection['host'] ?? '')));
        }

        if ($host === '' && !empty($connection['unix_socket'])) {
            return false;
        }

        return $host !== '' && in_array($host, ['localhost', '127.0.0.1', '::1'], true)
            ? false
            : true;
    }

    private static function enabled(mixed $value): bool
    {
        return $value === true || (is_string($value) && strtolower(trim($value)) === 'true');
    }
}
