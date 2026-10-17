<?php

return [
    'default' => env('DB_CONNECTION', 'mysql'),
    'mutation_guard_environment' => env('APP_ENV', 'local'),
    'allow_remote_db_mutations' => env('ALLOW_REMOTE_DB_MUTATIONS', false),
    'allow_destructive_remote_db_commands' => env('ALLOW_DESTRUCTIVE_REMOTE_DB_COMMANDS', false),
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'smkn24'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                (defined('Pdo\\Mysql::ATTR_SSL_CA')
                    ? constant('Pdo\\Mysql::ATTR_SSL_CA')
                    : PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],
    ],
    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],
    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
    ],
];
