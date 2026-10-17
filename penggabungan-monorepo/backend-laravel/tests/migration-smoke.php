<?php

if (!extension_loaded('pdo_sqlite') || !extension_loaded('sqlite3') || !extension_loaded('mbstring')) {
    fwrite(STDERR, "Enable pdo_sqlite, sqlite3, and mbstring to run this migration smoke test.\n");
    exit(2);
}

require dirname(__DIR__) . '/vendor/autoload.php';

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

config([
    'database.default' => 'sqlite',
    'database.connections.sqlite' => [
        'driver' => 'sqlite',
        'database' => ':memory:',
        'prefix' => '',
        'foreign_key_constraints' => true,
    ],
]);

Illuminate\Support\Facades\DB::purge('sqlite');
$schema = Illuminate\Support\Facades\Schema::connection('sqlite');
$schema->create('pesan_bk', function (Illuminate\Database\Schema\Blueprint $table): void {
    $table->increments('id');
    $table->string('nama');
    $table->timestamp('tanggal')->useCurrent();
});
$schema->create('chat_messages', function (Illuminate\Database\Schema\Blueprint $table): void {
    $table->increments('id');
    $table->string('session_id');
    $table->string('sender');
    $table->text('text');
    $table->timestamp('created_at')->useCurrent();
});
$schema->create('berita', function (Illuminate\Database\Schema\Blueprint $table): void {
    $table->increments('id');
    $table->string('kategori');
});
$schema->create('fasilitas', function (Illuminate\Database\Schema\Blueprint $table): void {
    $table->increments('id');
    $table->string('gambar')->nullable();
});

Illuminate\Support\Facades\DB::table('pesan_bk')->insert([
    'nama' => 'fixture',
    'tanggal' => '2026-10-17 00:00:00',
]);
Illuminate\Support\Facades\DB::table('berita')->insert(['kategori' => 'Fixture category']);

$status = Illuminate\Support\Facades\Artisan::call('migrate', [
    '--database' => 'sqlite',
    '--force' => true,
    '--no-interaction' => true,
]);
echo Illuminate\Support\Facades\Artisan::output();
if ($status !== 0) {
    exit($status);
}

foreach ([
    'admin_categories', 'arsip', 'prestasi', 'knowledge', 'chat_insights',
    'chat_analytics_log', 'jadwal_kelas', 'jadwal_pelajaran', 'canteen_stands',
    'canteen_users', 'canteen_menu_items', 'canteen_orders', 'canteen_order_items',
    'canteen_payments', 'canteen_payment_events',
] as $table) {
    if (!$schema->hasTable($table)) {
        throw new RuntimeException("Migration did not create {$table}.");
    }
}

foreach (['ringkasan', 'tingkat_kesulitan', 'kategori', 'butuh_perhatian', 'transkrip', 'device_id', 'media_json'] as $column) {
    if (!$schema->hasColumn('pesan_bk', $column)) {
        throw new RuntimeException("Missing BK column {$column}.");
    }
}
foreach (['kategori', 'sentimen', 'di_luar_konteks', 'status_resolusi'] as $column) {
    if (!$schema->hasColumn('chat_messages', $column)) {
        throw new RuntimeException("Missing analytics column {$column}.");
    }
}
if (!$schema->hasIndex('pesan_bk', 'idx_pesan_bk_device')) {
    throw new RuntimeException('BK history index is missing.');
}

$foreignKeys = Illuminate\Support\Facades\DB::select('PRAGMA foreign_key_list("jadwal_pelajaran")');
if (count($foreignKeys) !== 1 || $foreignKeys[0]->table !== 'jadwal_kelas') {
    throw new RuntimeException('Schedule foreign key is invalid.');
}
$originalRowExists = Illuminate\Support\Facades\DB::table('pesan_bk')->where('nama', 'fixture')->exists();
$categoryWasBackfilled = Illuminate\Support\Facades\DB::table('admin_categories')
    ->where('module_name', 'berita')
    ->where('category_name', 'Fixture category')
    ->exists();
if (!$originalRowExists || !$categoryWasBackfilled) {
    throw new RuntimeException('Migration modified existing data or failed category backfill.');
}

$migration = require dirname(__DIR__) . '/database/migrations/2026_10_17_000001_align_legacy_backend_schema.php';
$migration->up();
$migration->up();
if (!Illuminate\Support\Facades\DB::table('pesan_bk')->where('nama', 'fixture')->exists()) {
    throw new RuntimeException('Repeated migration did not preserve existing data.');
}

config([
    'database.default' => 'sqlite_fresh',
    'database.connections.sqlite_fresh' => [
        'driver' => 'sqlite',
        'database' => ':memory:',
        'prefix' => '',
        'foreign_key_constraints' => true,
    ],
]);
Illuminate\Support\Facades\DB::purge('sqlite_fresh');
$freshStatus = Illuminate\Support\Facades\Artisan::call('migrate', [
    '--database' => 'sqlite_fresh',
    '--force' => true,
    '--no-interaction' => true,
]);
echo Illuminate\Support\Facades\Artisan::output();
if ($freshStatus !== 0) {
    exit($freshStatus);
}

foreach ([
    'admin_users', 'berita', 'pengumuman', 'agenda', 'guru', 'jadwal', 'galeri',
    'fasilitas', 'pesan_bk', 'aspirasi', 'chat_sessions', 'chat_messages',
] as $table) {
    if (!Illuminate\Support\Facades\Schema::connection('sqlite_fresh')->hasTable($table)) {
        throw new RuntimeException("Fresh migration did not create core table {$table}.");
    }
}
if (Illuminate\Support\Facades\DB::connection('sqlite_fresh')->table('berita')->exists()
    || Illuminate\Support\Facades\DB::connection('sqlite_fresh')->table('jadwal_kelas')->exists()) {
    throw new RuntimeException('Fresh migration unexpectedly inserted sample content.');
}

echo "SQLite migration smoke passed: legacy upgrade, fresh database, tables, columns, indexes, foreign keys, category backfill, data retention, no demo data, and idempotency.\n";
