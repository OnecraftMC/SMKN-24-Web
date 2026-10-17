<?php

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Support\RemoteDatabaseMutationGuard;

$connections = [
    'mysql' => ['driver' => 'mysql', 'host' => 'db.example.test'],
    'local' => ['driver' => 'mysql', 'host' => '127.0.0.1'],
    'remote-url' => ['driver' => 'mysql', 'url' => 'mysql://user:pass@db.example.test/school'],
];

$checks = [
    'blocks migrations to remote database from local environment' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], 'local', $connections, 'mysql', 'false', 'false') !== null,
    'defaults safely when application environment is missing' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], '', $connections, 'mysql', 'false', 'false') !== null,
    'allows local database migrations' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], 'local', $connections, 'local', 'false', 'false') === null,
    'allows migration dry runs on remote database' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate', '--pretend'], 'local', $connections, 'mysql', 'false', 'false') === null,
    'allows explicitly approved staging mutations' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], 'local', $connections, 'mysql', true, false) === null,
    'allows production migration commands' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], 'production', $connections, 'mysql', 'false', 'false') === null,
    'blocks seeds against remote database from local environment' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'db:seed'], 'local', $connections, 'mysql', 'false', 'false') !== null,
    'detects remote host in database URL' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate'], 'local', $connections, 'remote-url', 'false', 'false') !== null,
    'does not block read-only commands' =>
        RemoteDatabaseMutationGuard::denialReason(['artisan', 'migrate:status'], 'local', $connections, 'mysql', 'false', 'false') === null,
    'protects explicit remote connection selection' =>
        RemoteDatabaseMutationGuard::denialReason(
            ['artisan', 'migrate', '--database=remote-url'],
            'local',
            $connections,
            'local',
            'false',
            'false',
        ) !== null,
    'refuses unknown database connections' =>
        RemoteDatabaseMutationGuard::denialReason(
            ['artisan', 'migrate', '--database=missing'],
            'local',
            $connections,
            'local',
            'false',
            'false',
        ) !== null,
    'blocks destructive commands against remote production database' =>
        RemoteDatabaseMutationGuard::denialReason(
            ['artisan', 'migrate:fresh', '--force'],
            'production',
            $connections,
            'mysql',
            'false',
            'false',
        ) !== null,
    'allows explicitly approved destructive remote operation' =>
        RemoteDatabaseMutationGuard::denialReason(
            ['artisan', 'migrate:rollback'],
            'production',
            $connections,
            'mysql',
            'false',
            true,
        ) === null,
    'blocks local API writes against remote database' =>
        RemoteDatabaseMutationGuard::requestDenialReason(
            'POST',
            'local',
            $connections,
            'mysql',
            'false',
        ) !== null,
    'allows local API writes against local database' =>
        RemoteDatabaseMutationGuard::requestDenialReason(
            'POST',
            'local',
            $connections,
            'local',
            'false',
        ) === null,
    'preserves remote public reads from local environment' =>
        RemoteDatabaseMutationGuard::requestDenialReason(
            'GET',
            'local',
            $connections,
            'mysql',
            'false',
        ) === null,
    'allows explicitly approved staging API writes' =>
        RemoteDatabaseMutationGuard::requestDenialReason(
            'POST',
            'local',
            $connections,
            'mysql',
            true,
        ) === null,
];

foreach ($checks as $name => $passed) {
    if (!$passed) {
        fwrite(STDERR, "FAIL {$name}\n");
        exit(1);
    }
}

printf("Remote database mutation guard checks passed (%d checks).\n", count($checks));
