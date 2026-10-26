<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kelulusan')) {
            return;
        }

        Schema::create('kelulusan', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nisn', 10)->unique();
            $table->string('nama_siswa', 150);
            $table->string('kelas', 80);
            $table->string('jurusan', 100);
            $table->unsignedSmallInteger('tahun_lulus');
            $table->enum('status', ['Lulus', 'Tidak Lulus']);
            $table->boolean('aktif')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->index(['aktif', 'tahun_lulus'], 'idx_kelulusan_publik');
        });
    }

    public function down(): void
    {
        // Pertahankan data hasil input sekolah saat rollback aplikasi.
    }
};
