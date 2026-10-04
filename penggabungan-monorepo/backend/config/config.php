<?php
/**
 * Konfigurasi umum aplikasi: CORS, JWT secret, dan API KEY untuk AI Chatbot.
 *
 * >>> DI SINI TEMPAT MENARUH API KEY AI <<<
 * Sebaiknya jangan hardcode di file ini untuk produksi — gunakan file .env
 * yang TIDAK di-commit ke git (lihat config/env.php di bawah untuk loader-nya).
 */

// -----------------------------------------------------------------------------
// Muat variabel dari file .env (jika ada) supaya API key tidak ter-hardcode
// -----------------------------------------------------------------------------
require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

// -----------------------------------------------------------------------------
// Lingkungan aplikasi
// -----------------------------------------------------------------------------
// "local"      -> pengembangan di komputer sendiri (default).
// "production" -> server publik. Wajib diisi di .env; JWT_SECRET harus diisi juga,
//                kalau tidak seluruh endpoint ditolak (lihat bootstrap.php).
define('APP_ENV', env('APP_ENV', 'local'));

// -----------------------------------------------------------------------------
// AI Chatbot Provider Configuration
// -----------------------------------------------------------------------------
// Pilih provider: "openai" atau "gemini" atau "anthropic"
define('AI_PROVIDER', env('AI_PROVIDER', 'openai'));

// TEMPAT API KEY DI SINI (lebih aman diisi lewat file .env, lihat .env.example)
define('OPENAI_API_KEY', env('OPENAI_API_KEY', ''));
define('OPENAI_MODEL', env('OPENAI_MODEL', 'gpt-4o-mini'));
define('OPENAI_BASE_URL', env('OPENAI_BASE_URL', 'https://api.openai.com/v1/chat/completions'));

define('GEMINI_API_KEY', env('GEMINI_API_KEY', ''));
define('GEMINI_MODEL', env('GEMINI_MODEL', 'gemini-1.5-flash'));

define('ANTHROPIC_API_KEY', env('ANTHROPIC_API_KEY', ''));
define('ANTHROPIC_MODEL', env('ANTHROPIC_MODEL', 'claude-3-5-haiku-latest'));

// System prompt untuk asisten AI sekolah
define('AI_SYSTEM_PROMPT', "Kamu adalah Asisten AI resmi SMKN 24 Jakarta. "
    . "Jawab pertanyaan seputar PPDB/SPMB, kurikulum, jurusan, fasilitas, jadwal, "
    . "dan informasi sekolah lain dengan ramah, singkat, dan jelas dalam Bahasa Indonesia. "
    . "Jika tidak tahu jawaban pastinya, arahkan pengguna untuk menghubungi pihak sekolah.");

// Balasan jujur yang dipakai ketika provider AI belum dikonfigurasi atau gagal.
// Teks ini BUKAN jawaban AI, jadi endpoint chat wajib menandainya secara
// eksplisit di respons (lihat api/chat/index.php) supaya tidak disamar.
define('AI_UNAVAILABLE_MESSAGE', "Maaf, asisten AI sedang tidak dapat diakses saat ini. "
    . "Silakan hubungi bagian Tata Usaha SMKN 24 Jakarta untuk informasi lebih lanjut.");

// -----------------------------------------------------------------------------
// AI BIMBINGAN KONSELING — sengaja terpisah dari AI_SYSTEM_PROMPT di atas.
//
// Backend punya dua kegunaan AI dengan tujuan berbeda, masing-masing dengan
// system prompt sendiri agar model tidak tercampur:
//   1. AI_SYSTEM_PROMPT   -> menjawab pertanyaan umum sekolah.
//   2. AI_BK_SYSTEM_PROMPT -> triase Bimbingan Konseling: merangkum keluhahan
//      siswa dan menilai tingkat kesusahannya untuk guru BK.
//
// Model BK diminta mengembalikan JSON supaya guru BK mendapat rangkuman dan
// tingkat kesulitan yang bisa langsung ditindaklanjuti.
// -----------------------------------------------------------------------------
define('AI_BK_SYSTEM_PROMPT', "Kamu adalah Counsellor AI untuk layanan Bimbingan Konseling "
    . "SMKN 24 Jakarta. Tugasmu SATU: mendengarkan keluhahan siswa, merangkumnya, "
    . "dan menilai seberapa mendesak masalah itu bagi siswa.\n\n"
    . "Aturan penting:\n"
    . "1. Jangan memberi saran terapi, diagnosis, atau solusi. Kamu hanya mencatat dan merangkum.\n"
    . "2. Balasan ke siswa harus hangat, empatik, dan singkat.\n"
    . "3. Jangan menyebut nama asli siswa di dalam ringkasan; pakai kata ganti seperti 'siswa'.\n"
    . "4. Jawab HANYA dengan objek JSON valid, tanpa teks tambahan dan tanpa pagar markdown.\n\n"
    . "Format JSON yang wajib kamu ikuti:\n"
    . "{\n"
    . "  \"ringkasan\": \"1-3 kalimat yang merangkum masalah siswa secara netral\",\n"
    . "  \"kategori\": \"salah satu dari: Akademik, Sosial, Keluarga, Ekonomi, Kecemasan, Kekerasan, Lainnya\",\n"
    . "  \"tingkat_kesulitan\": \"salah satu dari: Ringan, Sedang, Berat\",\n"
    . "  \"butuh_perhatian\": true atau false,\n"
    . "  \"balasan_siswa\": \"balasan hangat 2-3 kalimat yang mengakui perasaan siswa dan menyatakan tim BK akan menindaklanjuti\"\n"
    . "}\n\n"
    . "Panduan tingkat kesulitan:\n"
    . "- Ringan: masalah harian yang dapat ditangani dengan dukungan ringan.\n"
    . "- Sedang: mengganggu belajar atau hubungan yang berkepanjangan, perlu dijadwalkan.\n"
    . "- Berat: kesusahan berat, ada indikasi risiko keselamatan, perlu guru BK segera menangani.\n\n"
    . "Set butuh_perhatian menjadi true bila ada indikasi risiko keselamatan "
    . "(menyakiti diri, kekerasan, ancaman, atau tindakan kekerasan). Selain itu false.\n\n"
    . "Contoh jawaban yang benar untuk siswa yang kesulitan memahami pelajaran:"
    . "{\"ringkasan\":\"Siswa merasa kesulitan memahami materi pelajaran dan khawatir dengan nilai ujian.\","
    . "\"kategori\":\"Akademik\",\"tingkat_kesulitan\":\"Sedang\",\"butuh_perhatian\":false,"
    . "\"balasan_siswa\":\"Terima kasih sudah bercerita dengan jujur. Tim kami sudah membaca "
    . "dan akan menindaklanjuti ya.\"}");


// -----------------------------------------------------------------------------
// JWT / Session secret untuk auth admin
// -----------------------------------------------------------------------------
define('JWT_SECRET', env('JWT_SECRET', 'ganti-dengan-secret-key-yang-acak-dan-panjang'));
define('JWT_EXPIRY', 60 * 60 * 8); // 8 jam

// -----------------------------------------------------------------------------
// CORS - domain frontend yang diizinkan mengakses API ini
// -----------------------------------------------------------------------------
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://macdeep.my.id',
    // tambahkan domain produksi frontend di sini, contoh:
    // 'https://smkn24jakarta.sch.id',
]);

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL_BASE', '/backend/uploads/'); // sesuaikan dengan path publik server
