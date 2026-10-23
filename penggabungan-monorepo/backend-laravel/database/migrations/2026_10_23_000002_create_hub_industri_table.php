<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('hub_industri')) {
            return;
        }

        Schema::create('hub_industri', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nama', 255);
            $table->string('logo', 500)->nullable();
            $table->text('alamat');
            $table->text('deskripsi');
            $table->string('link_label', 120)->nullable();
            $table->string('link_href', 500)->nullable();
            $table->integer('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->index(['aktif', 'urutan', 'id'], 'idx_hub_industri_publik');
        });
    }

    public function down(): void
    {
        // Additive feature: preserve partner records if application rolls back.
    }
};
