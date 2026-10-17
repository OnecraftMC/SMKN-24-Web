<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->createLegacyCoreTables();
        $this->createAdminCategories();
        $this->addCategoryColumns();
        $this->addMissingColumns();
        $this->createArchivesAndAchievements();
        $this->backfillExistingCategories();
        $this->createKnowledge();
        $this->createChatAnalytics();
        $this->createSchedules();
        $this->createCanteen();
    }

    public function down(): void
    {
        // Keep additive schema and user data when rolling back application code.
    }

    private function createAdminCategories(): void
    {
        if (!Schema::hasTable('admin_categories')) {
            Schema::create('admin_categories', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('module_name', 32);
                $table->string('category_name', 100);
                $table->timestamp('created_at')->useCurrent();
                $table->unique(['module_name', 'category_name'], 'uq_admin_category');
            });
        }
    }

    private function createLegacyCoreTables(): void
    {
        if (!Schema::hasTable('admin_users')) {
            Schema::create('admin_users', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('username', 50)->unique();
                    $table->string('password', 255);
                    $table->string('nama', 100);
                    $table->string('role', 20)->default('admin');
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('berita')) {
            Schema::create('berita', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('judul', 255);
                    $table->string('kategori', 100);
                    $table->date('tanggal');
                    $table->string('gambar', 500)->nullable();
                    $table->text('ringkasan')->nullable();
                    $table->longText('isi')->nullable();
                    $table->enum('status', ['draft', 'terbit'])->default('terbit');
                    $table->boolean('utama')->default(false);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (!Schema::hasTable('pengumuman')) {
            Schema::create('pengumuman', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('judul', 255);
                    $table->text('isi')->nullable();
                    $table->date('tanggal');
                    $table->string('kategori', 100);
                    $table->boolean('penting')->default(false);
                    $table->string('gambar', 500)->nullable();
                    $table->string('badge', 100)->nullable();
                    $table->string('status', 50)->nullable();
                    $table->string('link_label', 150)->nullable();
                    $table->string('link_href', 255)->nullable();
                    $table->string('icon', 100)->nullable();
                    $table->string('action_icon', 100)->nullable();
                    $table->string('variant', 50)->nullable();
                    $table->boolean('tampil_beranda')->default(false);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (!Schema::hasTable('agenda')) {
            Schema::create('agenda', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('judul', 255);
                    $table->date('tgl_mulai');
                    $table->date('tgl_selesai')->nullable();
                    $table->string('waktu', 100)->nullable();
                    $table->string('lokasi', 255)->nullable();
                    $table->string('badge', 100)->nullable();
                    $table->text('deskripsi')->nullable();
                    $table->string('gambar', 500)->nullable();
                    $table->boolean('tampil_beranda')->default(false);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (!Schema::hasTable('guru')) {
            Schema::create('guru', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('nama', 150);
                    $table->string('jabatan', 255);
                    $table->text('deskripsi')->nullable();
                    $table->string('kategori', 100);
                    $table->string('gambar', 500)->nullable();
                    $table->integer('urutan')->default(0);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (!Schema::hasTable('jadwal')) {
            Schema::create('jadwal', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->enum('jurusan', ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata']);
                    $table->enum('sesi', ['pagi', 'siang']);
                    $table->integer('urutan')->default(0);
                    $table->string('mapel', 255);
                    $table->string('jam', 50)->nullable();
                    $table->string('waktu', 50)->nullable();
                    $table->string('guru', 150)->nullable();
                    $table->unique(['jurusan', 'sesi', 'urutan'], 'uniq_slot');
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('galeri')) {
            Schema::create('galeri', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('judul', 255);
                    $table->string('kategori', 100);
                    $table->string('gambar', 500);
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('fasilitas')) {
            Schema::create('fasilitas', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('judul', 255);
                    $table->text('deskripsi')->nullable();
                    $table->string('gambar', 500)->nullable();
                    $table->boolean('unggulan')->default(false);
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('pesan_bk')) {
            Schema::create('pesan_bk', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('nama', 150);
                    $table->string('kelas', 50);
                    $table->string('no_hp', 30)->nullable();
                    $table->string('keperluan', 255);
                    $table->text('pesan');
                    $table->enum('status', ['Baru', 'Diproses', 'Selesai'])->default('Baru');
                    $table->timestamp('tanggal')->useCurrent();
            });
        }

        if (!Schema::hasTable('aspirasi')) {
            Schema::create('aspirasi', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('nama', 150)->nullable();
                    $table->string('email', 150)->nullable();
                    $table->string('kategori', 100)->nullable();
                    $table->text('pesan');
                    $table->enum('status', ['Baru', 'Ditinjau', 'Selesai'])->default('Baru');
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('chat_sessions')) {
            Schema::create('chat_sessions', function (Blueprint $table): void {
                    $table->string('id', 64)->primary();
                    $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('chat_messages')) {
            Schema::create('chat_messages', function (Blueprint $table): void {
                    $table->increments('id');
                    $table->string('session_id', 64);
                    $table->enum('sender', ['user', 'bot']);
                    $table->text('text');
                    $table->timestamp('created_at')->useCurrent();
                    $table->foreign('session_id')->references('id')->on('chat_sessions')->cascadeOnDelete();
            });
        }
    }

    private function addCategoryColumns(): void
    {
        foreach (['agenda', 'fasilitas', 'jadwal', 'pesan_bk', 'prestasi'] as $name) {
            if (Schema::hasTable($name) && !Schema::hasColumn($name, 'kategori')) {
                Schema::table($name, function (Blueprint $table): void {
                    $table->string('kategori', 100)->nullable();
                });
            }
        }

        if (Schema::hasTable('fasilitas') && !Schema::hasColumn('fasilitas', 'unggulan')) {
            Schema::table('fasilitas', function (Blueprint $table): void {
                $table->boolean('unggulan')->default(false);
            });
        }
    }

    private function addMissingColumns(): void
    {
        if (Schema::hasTable('pesan_bk')) {
            $columns = [
                'ringkasan' => fn (Blueprint $table) => $table->text('ringkasan')->nullable(),
                'tingkat_kesulitan' => fn (Blueprint $table) => $table->enum('tingkat_kesulitan', ['Ringan', 'Sedang', 'Berat'])->nullable(),
                'butuh_perhatian' => fn (Blueprint $table) => $table->boolean('butuh_perhatian')->default(false),
                'transkrip' => fn (Blueprint $table) => $table->mediumText('transkrip')->nullable(),
                'device_id' => fn (Blueprint $table) => $table->string('device_id', 64)->nullable(),
                'media_json' => fn (Blueprint $table) => $table->mediumText('media_json')->nullable(),
            ];

            foreach ($columns as $name => $addColumn) {
                if (!Schema::hasColumn('pesan_bk', $name)) {
                    Schema::table('pesan_bk', $addColumn);
                }
            }

            if (!Schema::hasIndex('pesan_bk', 'idx_pesan_bk_device')) {
                Schema::table('pesan_bk', function (Blueprint $table): void {
                    $table->index(['device_id', 'tanggal'], 'idx_pesan_bk_device');
                });
            }
        }

        if (!Schema::hasTable('chat_messages')) {
            return;
        }

        $columns = [
            'kategori' => fn (Blueprint $table) => $table->string('kategori', 40)->nullable(),
            'sentimen' => fn (Blueprint $table) => $table->enum('sentimen', ['positif', 'netral', 'negatif'])->nullable(),
            'di_luar_konteks' => fn (Blueprint $table) => $table->boolean('di_luar_konteks')->nullable(),
            'status_resolusi' => fn (Blueprint $table) => $table->enum('status_resolusi', ['resolved', 'escalated', 'unanswered'])->nullable(),
        ];

        foreach ($columns as $name => $addColumn) {
            if (!Schema::hasColumn('chat_messages', $name)) {
                Schema::table('chat_messages', $addColumn);
            }
        }
    }

    private function createArchivesAndAchievements(): void
    {
        if (!Schema::hasTable('arsip')) {
            Schema::create('arsip', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('judul', 255);
                $table->text('deskripsi')->nullable();
                $table->string('kategori', 100)->default('Akademik');
                $table->string('nama_file', 180);
                $table->string('storage_key', 40)->unique();
                $table->string('mime_type', 100);
                $table->unsignedInteger('ukuran_file');
                $table->boolean('aktif')->default(false);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->index(['aktif', 'id'], 'idx_arsip_publik');
            });
        }

        if (!Schema::hasTable('prestasi')) {
            Schema::create('prestasi', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('nisn', 20);
                $table->string('nama_siswa', 150);
                $table->string('kelas', 80);
                $table->string('jurusan', 100);
                $table->string('perlombaan', 255);
                $table->string('tingkat', 100);
                $table->date('tanggal_lomba');
                $table->string('penyelenggara', 200);
                $table->string('prestasi', 150);
                $table->text('deskripsi')->nullable();
                $table->string('nama_file', 180)->nullable();
                $table->string('storage_key', 40)->nullable()->unique();
                $table->string('mime_type', 100)->nullable();
                $table->unsignedInteger('ukuran_file')->nullable();
                $table->enum('status', ['Baru', 'Ditinjau', 'Disetujui', 'Ditolak'])->default('Baru');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->timestamp('reviewed_at')->nullable();
                $table->string('kategori', 100)->nullable();
                $table->index(['status', 'created_at'], 'idx_prestasi_status_created');
            });
        }
    }

    private function backfillExistingCategories(): void
    {
        foreach ([
            'agenda' => 'agenda',
            'berita' => 'berita',
            'pengumuman' => 'pengumuman',
            'guru' => 'guru',
            'galeri' => 'galeri',
            'fasilitas' => 'fasilitas',
            'arsip' => 'arsip',
            'jadwal' => 'jadwal',
            'bk' => 'pesan_bk',
            'prestasi' => 'prestasi',
        ] as $module => $sourceTable) {
            if (!Schema::hasTable($sourceTable) || !Schema::hasColumn($sourceTable, 'kategori')) {
                continue;
            }

            $categories = DB::table($sourceTable)
                ->whereNotNull('kategori')
                ->whereRaw("TRIM(kategori) <> ''")
                ->distinct()
                ->pluck('kategori');

            foreach ($categories as $category) {
                DB::table('admin_categories')->insertOrIgnore([
                    'module_name' => $module,
                    'category_name' => $category,
                ]);
            }
        }
    }

    private function createKnowledge(): void
    {
        if (Schema::hasTable('knowledge')) {
            return;
        }

        Schema::create('knowledge', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('judul', 255)->unique('uniq_knowledge_judul');
            $table->enum('kategori', ['PPDB', 'Jurusan', 'Jadwal', 'Fasilitas', 'Umum'])->default('Umum');
            $table->text('konten');
            $table->string('tags', 255)->default('');
            $table->string('sumber', 255)->default('');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    private function createChatAnalytics(): void
    {
        if (!Schema::hasTable('chat_insights')) {
            Schema::create('chat_insights', function (Blueprint $table): void {
                $table->increments('id');
                $table->enum('tipe', ['tren', 'konten_kurang', 'rekomendasi', 'teknis', 'faq']);
                $table->string('judul', 255);
                $table->text('isi');
                $table->enum('sumber', ['ai', 'heuristik'])->default('heuristik');
                $table->date('periode_mulai')->nullable();
                $table->date('periode_selesai')->nullable();
                $table->enum('status', ['baru', 'selesai', 'diabaikan'])->default('baru');
                $table->timestamp('created_at')->useCurrent();
                $table->index('status', 'idx_chat_insights_status');
            });
        }

        if (!Schema::hasTable('chat_analytics_log')) {
            Schema::create('chat_analytics_log', function (Blueprint $table): void {
                $table->increments('id');
                $table->enum('aksi', ['generate_insight', 'export_csv', 'export_pdf']);
                $table->string('detail', 255)->default('');
                $table->timestamp('created_at')->useCurrent();
                $table->index('aksi', 'idx_chat_analytics_log_aksi');
            });
        }
    }

    private function createSchedules(): void
    {
        if (!Schema::hasTable('jadwal_kelas')) {
            Schema::create('jadwal_kelas', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('nama', 80)->unique();
                $table->enum('jurusan', ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata']);
                $table->unsignedTinyInteger('tingkat');
                $table->unsignedTinyInteger('rombel');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->unique(['jurusan', 'tingkat', 'rombel'], 'uniq_jadwal_kelas');
            });
        }

        if (!Schema::hasTable('jadwal_pelajaran')) {
            Schema::create('jadwal_pelajaran', function (Blueprint $table): void {
                $table->increments('id');
                $table->unsignedInteger('kelas_id');
                $table->enum('hari', ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']);
                $table->time('jam_mulai');
                $table->time('jam_selesai');
                $table->string('mapel', 255);
                $table->string('guru', 150)->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->index(['kelas_id', 'hari', 'jam_mulai', 'jam_selesai'], 'idx_jadwal_harian');
                $table->foreign('kelas_id', 'fk_jadwal_pelajaran_kelas')
                    ->references('id')->on('jadwal_kelas')
                    ->restrictOnDelete()->cascadeOnUpdate();
            });
        }
    }

    private function createCanteen(): void
    {
        if (!Schema::hasTable('canteen_stands')) {
            Schema::create('canteen_stands', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('slug', 80)->unique();
                $table->string('name', 120);
                $table->text('description')->nullable();
                $table->string('image_url', 500)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (!Schema::hasTable('canteen_users')) {
            Schema::create('canteen_users', function (Blueprint $table): void {
                $table->increments('id');
                $table->unsignedInteger('stand_id');
                $table->string('username', 60)->unique();
                $table->string('password_hash', 255);
                $table->string('full_name', 120);
                $table->boolean('is_active')->default(true);
                $table->boolean('must_change_password')->default(true);
                $table->dateTime('last_login_at')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->foreign('stand_id', 'fk_canteen_users_stand')->references('id')->on('canteen_stands');
            });
        }

        if (!Schema::hasTable('canteen_menu_items')) {
            Schema::create('canteen_menu_items', function (Blueprint $table): void {
                $table->increments('id');
                $table->unsignedInteger('stand_id');
                $table->string('name', 140);
                $table->string('description', 500)->nullable();
                $table->enum('category', ['food', 'drink']);
                $table->unsignedInteger('price');
                $table->string('image_url', 500)->nullable();
                $table->boolean('is_available')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->index(['stand_id', 'is_available', 'sort_order'], 'idx_canteen_menu_stand');
                $table->foreign('stand_id', 'fk_canteen_menu_stand')->references('id')->on('canteen_stands');
            });
        }

        if (!Schema::hasTable('canteen_orders')) {
            Schema::create('canteen_orders', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->string('order_no', 40)->unique();
                $table->unsignedInteger('stand_id');
                $table->string('buyer_name', 120);
                $table->string('buyer_class', 60);
                $table->enum('fulfillment', ['delivery', 'pickup']);
                $table->unsignedInteger('subtotal');
                $table->unsignedInteger('delivery_fee')->default(0);
                $table->unsignedInteger('total');
                $table->enum('status', ['awaiting_payment', 'received', 'preparing', 'ready', 'completed', 'cancelled'])
                    ->default('awaiting_payment');
                $table->enum('payment_status', ['pending', 'paid', 'failed', 'expired', 'refunded'])->default('pending');
                $table->char('buyer_token_hash', 64);
                $table->dateTime('paid_at')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->index(['stand_id', 'payment_status', 'status', 'created_at'], 'idx_canteen_orders_seller');
                $table->foreign('stand_id', 'fk_canteen_orders_stand')->references('id')->on('canteen_stands');
            });
        }

        if (!Schema::hasTable('canteen_order_items')) {
            Schema::create('canteen_order_items', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('order_id');
                $table->unsignedInteger('menu_item_id')->nullable();
                $table->string('item_name', 140);
                $table->unsignedInteger('unit_price');
                $table->unsignedSmallInteger('quantity');
                $table->unsignedInteger('line_total');
                $table->foreign('order_id', 'fk_canteen_order_items_order')
                    ->references('id')->on('canteen_orders')->cascadeOnDelete();
                $table->foreign('menu_item_id', 'fk_canteen_order_items_menu')
                    ->references('id')->on('canteen_menu_items')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('canteen_payments')) {
            Schema::create('canteen_payments', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('order_id')->unique();
                $table->string('provider', 40)->default('midtrans_snap');
                $table->string('transaction_id', 120)->nullable();
                $table->string('snap_token', 255)->nullable();
                $table->string('redirect_url', 1000)->nullable();
                $table->string('provider_status', 60)->nullable();
                $table->unsignedInteger('amount');
                $table->json('raw_notification')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->foreign('order_id', 'fk_canteen_payments_order')
                    ->references('id')->on('canteen_orders')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('canteen_payment_events')) {
            Schema::create('canteen_payment_events', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('order_id');
                $table->string('event_key', 160)->unique();
                $table->string('provider_status', 60);
                $table->timestamp('received_at')->useCurrent();
                $table->index('order_id', 'idx_canteen_payment_events_order');
                $table->foreign('order_id', 'fk_canteen_payment_events_order')
                    ->references('id')->on('canteen_orders')->cascadeOnDelete();
            });
        }
    }
};
