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
    // tambahkan domain produksi frontend di sini, contoh:
    // 'https://smkn24jakarta.sch.id',
]);

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL_BASE', '/backend/uploads/'); // sesuaikan dengan path publik server
