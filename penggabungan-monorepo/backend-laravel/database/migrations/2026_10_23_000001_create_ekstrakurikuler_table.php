<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ekstrakurikuler')) {
            return;
        }

        Schema::create('ekstrakurikuler', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nama', 150);
            $table->text('deskripsi')->nullable();
            $table->string('logo', 500)->nullable();
            $table->string('kategori', 100)->nullable();
            $table->string('pembina', 150)->nullable();
            $table->string('jadwal', 150)->nullable();
            $table->string('lokasi', 150)->nullable();
            $table->boolean('unggulan')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        // Data contoh agar halaman /ekstrakurikuler tidak kosong pada pemasangan
        // baru. Admin bebas mengganti logo/info atau menghapusnya.
        $now = now();
        DB::table('ekstrakurikuler')->insert([
            [
                'nama' => 'Paskibra',
                'deskripsi' => 'Pasukan Pengibar Bendera melatih kedisiplinan, kepemimpinan, dan rasa cinta tanah air melalui latihan baris-berbaris serta protokol upacara.',
                'logo' => '/images/ekstrakurikuler/paskibra.svg',
                'kategori' => 'Kepemimpinan',
                'pembina' => 'Pembina Kesiswaan',
                'jadwal' => 'Sabtu, 08.00 - 10.00 WIB',
                'lokasi' => 'Lapangan Utama',
                'unggulan' => true,
                'created_at' => $now,
            ],
            [
                'nama' => 'Pramuka',
                'deskripsi' => 'Gerakan Pramuka membentuk karakter mandiri, gotong royong, dan peduli lingkungan lewat kegiatan kepramukaan yang menyenangkan.',
                'logo' => '/images/ekstrakurikuler/pramuka.svg',
                'kategori' => 'Kepemimpinan',
                'pembina' => 'Kak Pembina Pramuka',
                'jadwal' => 'Jumat, 14.00 - 16.00 WIB',
                'lokasi' => 'Aula Serbaguna',
                'unggulan' => true,
                'created_at' => $now,
            ],
            [
                'nama' => 'PMR',
                'deskripsi' => 'Palang Merah Remaja membekali siswa dengan pertolongan pertama, kesehatan remaja, dan kesiapsiagaan bencana.',
                'logo' => '/images/ekstrakurikuler/pmr.svg',
                'kategori' => 'Sosial',
                'pembina' => 'Tim Kesehatan Sekolah',
                'jadwal' => 'Rabu, 14.30 - 16.00 WIB',
                'lokasi' => 'Ruang UKS',
                'unggulan' => false,
                'created_at' => $now,
            ],
            [
                'nama' => 'Basket',
                'deskripsi' => 'Klub basket mengembangkan teknik dasar, kerja sama tim, dan kebugaran melalui latihan rutin serta sparring antarsekolah.',
                'logo' => '/images/ekstrakurikuler/basket.svg',
                'kategori' => 'Olahraga',
                'pembina' => 'Pelatih Basket',
                'jadwal' => 'Selasa & Kamis, 15.30 - 17.00 WIB',
                'lokasi' => 'Lapangan Basket',
                'unggulan' => true,
                'created_at' => $now,
            ],
            [
                'nama' => 'Futsal',
                'deskripsi' => 'Futsal menjadi wadah siswa menyalurkan minat olahraga, membangun sportivitas, dan bersiap mengikuti turnamen pelajar.',
                'logo' => '/images/ekstrakurikuler/futsal.svg',
                'kategori' => 'Olahraga',
                'pembina' => 'Pelatih Futsal',
                'jadwal' => 'Senin & Jumat, 15.30 - 17.00 WIB',
                'lokasi' => 'Lapangan Futsal',
                'unggulan' => false,
                'created_at' => $now,
            ],
            [
                'nama' => 'Tari Tradisional',
                'deskripsi' => 'Sanggar tari melestarikan seni tari Nusantara sekaligus menyiapkan penampilan untuk acara sekolah dan festival budaya.',
                'logo' => '/images/ekstrakurikuler/tari.svg',
                'kategori' => 'Seni',
                'pembina' => 'Guru Seni Budaya',
                'jadwal' => 'Kamis, 14.00 - 16.00 WIB',
                'lokasi' => 'Studio Tari',
                'unggulan' => true,
                'created_at' => $now,
            ],
            [
                'nama' => 'Paduan Suara',
                'deskripsi' => 'Paduan suara melatih teknik vokal, harmonisasi, dan kepercayaan diri untuk tampil pada upacara serta kompetisi.',
                'logo' => '/images/ekstrakurikuler/paduan-suara.svg',
                'kategori' => 'Seni',
                'pembina' => 'Guru Musik',
                'jadwal' => 'Rabu, 14.00 - 15.30 WIB',
                'lokasi' => 'Ruang Musik',
                'unggulan' => false,
                'created_at' => $now,
            ],
            [
                'nama' => 'Jurnalistik',
                'deskripsi' => 'Ekstrakurikuler jurnalistik mengasah kemampuan menulis, fotografi, dan produksi konten untuk media sekolah.',
                'logo' => '/images/ekstrakurikuler/jurnalistik.svg',
                'kategori' => 'Akademik',
                'pembina' => 'Tim Humas Sekolah',
                'jadwal' => 'Jumat, 13.00 - 15.00 WIB',
                'lokasi' => 'Laboratorium Komputer',
                'unggulan' => false,
                'created_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        // Additive feature: jangan hapus tabel otomatis saat rollback aplikasi,
        // karena data eskul yang sudah diisi admin akan hilang.
    }
};
