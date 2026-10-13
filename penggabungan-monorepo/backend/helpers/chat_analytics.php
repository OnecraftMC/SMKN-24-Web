<?php
/**
 * Klasifikasi telemetri chatbot — murni heuristik kata kunci, tanpa LLM.
 *
 * Dipanggil saat /api/chat menyimpan pesan (kategori, sentimen, flag di luar
 * konteks, status resolusi). Tidak pernah throw: gagal = default Umum/Netral.
 * Kategori mengikuti PRD fitur-tambahan.md §4.1.4 (+ "Umum" sebagai jaring).
 */

const CHAT_ANALYTICS_CATEGORIES = [
    'Akademik',
    'Fasilitas Sekolah',
    'PPDB / Pendaftaran',
    'Kegiatan & Agenda',
    'Guru & Staf',
    'Lainnya',
    'Di luar konteks',
];

/** Peta kata kunci -> kategori. Urutan penting: spesifik didahulukan. */
function chatCategoryKeywords(): array
{
    return [
        'PPDB / Pendaftaran' => ['ppdb', 'spmb', 'pendaftaran', 'zonasi', 'afirmasi', 'jalur', 'syarat', 'berkas', 'gelombang', 'kuota', 'seleksi', 'diterima'],
        'Akademik' => ['jurusan', 'kurikulum', 'pelajaran', 'mapel', 'ujian', 'uts', 'uas', 'nilai', 'rapor', 'rapot', 'pkl', 'praktek', 'praktik', 'ukom', 'ukk', 'jadwal pelajaran', 'semester', 'lulus', 'ijazah'],
        'Fasilitas Sekolah' => ['fasilitas', 'laboratorium', 'perpustakaan', 'perpus', 'kantin', 'lapangan', 'aula', 'musholla', 'mushola', 'toilet', 'parkir', 'wifi', 'asrama', 'uks'],
        'Kegiatan & Agenda' => ['kegiatan', 'agenda', 'ekstrakurikuler', 'ekskul', 'osis', 'pramuka', 'lomba', 'libur', 'upacara', 'wisuda', 'kunjungan', 'bazar'],
        'Guru & Staf' => ['guru', 'kepala sekolah', 'kepsek', 'wakil', 'wali kelas', 'tata usaha', 'staf', 'pengajar', 'konseling', 'bimbingan'],
    ];
}

/** Lowercase UTF-8; fallback strtolower bila ekstensi mbstring absen. */
function chatLower(string $text): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($text, 'UTF-8');
    }
    return strtolower($text);
}

/** Potong UTF-8; pola sama dengan strcut() di api/chat/index.php. */
function chatCut(string $s, int $max): string
{
    $s = trim($s);
    if (function_exists('mb_substr')) {
        return mb_substr($s, 0, $max);
    }
    if (preg_match('/^.{0,' . $max . '}/us', $s, $m)) {
        return $m[0];
    }
    return substr($s, 0, $max);
}

/** Tebak kategori dari teks pertanyaan user. */
function classifyChatCategory(string $text): string
{
    $hay = ' ' . chatLower($text) . ' ';
    foreach (chatCategoryKeywords() as $kategori => $katakunci) {
        foreach ($katakunci as $k) {
            if (str_contains($hay, $k)) {
                return $kategori;
            }
        }
    }
    return 'Lainnya';
}

/**
 * True bila pesan user di luar topik sekolah (PRD §4.1.1 "Diluar Konteks"):
 * topik asing yang jelas TANPA kata kunci kategori, atau basa-basi sangat
 * pendek tanpa kata kunci kategori.
 */
function classifyOutOfContext(string $text): bool
{
    $hay = chatLower(trim($text));
    if ($hay === '') {
        return true;
    }
    $topikAsing = [
        'presiden', 'pemilu', 'politik', 'artis', 'selebriti', 'sinetron',
        'judi', 'pinjol', 'resep', 'masakan', 'zodiak', 'ramalan',
        'saham', 'crypto', 'bitcoin', 'kpop', 'anime', 'drakor',
    ];
    foreach ($topikAsing as $k) {
        if (str_contains($hay, $k)) {
            // Tetap konteks sekolah bila ada kata kunci kategori.
            return classifyChatCategory($text) === 'Lainnya';
        }
    }
    $kata = preg_split('/\s+/u', $hay, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    if (count($kata) > 3) {
        return false;
    }
    foreach (['halo', 'hai', 'hello', 'pagi', 'siang', 'sore', 'malam', 'test', 'tes', 'ping'] as $k) {
        if (str_contains($hay, $k)) {
            return classifyChatCategory($text) === 'Lainnya';
        }
    }
    return false;
}

/**
 * Sentimen sederhana: positif | netral | negatif.
 * Terima kasih / puas = positif; kecewa / tidak membantu = negatif.
 */
function classifyChatSentiment(string $text): string
{
    $hay = ' ' . chatLower($text) . ' ';
    $skor = 0;
    foreach (['terima kasih', 'makasih', 'membantu', 'bagus', 'mantap', 'keren', 'puas', 'jelas', 'hebat', 'senang'] as $k) {
        if (str_contains($hay, $k)) {
            $skor += 1;
        }
    }
    foreach (['kecewa', 'buruk', 'jelek', 'gagal', 'bodoh', 'tidak membantu', 'nggak membantu', 'gak membantu', 'kurang', 'bingung', 'susah', 'sulit', 'salah', 'ngaco', 'tidak jelas', 'ribet'] as $k) {
        if (str_contains($hay, $k)) {
            $skor -= 1;
        }
    }
    if ($skor >= 1) {
        return 'positif';
    }
    if ($skor <= -1) {
        return 'negatif';
    }
    return 'netral';
}

/**
 * Status resolusi dari balasan bot:
 * escalated = diserahkan ke manusia; unanswered = ditolak filter konteks;
 * resolved = sisanya (balasan tampak menjawab).
 */
function classifyBotOutcome(string $reply, bool $aiAvailable): string
{
    if (!$aiAvailable) {
        return 'escalated';
    }
    $hay = chatLower($reply);
    foreach (['hubungi pihak sekolah', 'hubungi bagian tata usaha', 'tidak dapat diakses'] as $k) {
        if (str_contains($hay, $k)) {
            return 'escalated';
        }
    }
    foreach (['belum tersedia', 'di luar topik', 'tidak bisa membantu'] as $k) {
        if (str_contains($hay, $k)) {
            return 'unanswered';
        }
    }
    return 'resolved';
}

