/**
 * Tipe data dashboard admin.
 *
 * PENTING: tipe di sini mengikuti BENTUK NYATA respons backend PHP
 * (`backend/api/<nama-resource>/index.php` → fungsi `formatRow`), bukan bentuk
 * presentasional komponen website publik (`apps/main-web/components/...`).
 * Perbedaan nama field (mis. `nama` vs `name`, `jabatan` vs `title`) diselesaikan
 * dengan mapper eksplisit di sisi komponen admin — jangan mengubah kontrak backend.
 *
 * Catatan B1–B6 merujuk daftar perbaikan backend pada `laporan inspeksi.md` Bagian D.
 */

// -----------------------------------------------------------------------------
// Autentikasi  (POST /api/auth/login.php, GET /api/auth/me.php)
// -----------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  username: string;
  /**
   * Hanya dikirim oleh response login. `/api/auth/me.php` belum mengirim `nama`
   * (perbaikan B1), sehingga nilai ini perlu di-cache dari login.
   */
  nama?: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

// -----------------------------------------------------------------------------
// Berita  (berita: full CRUD, flag `utama` untuk highlight)
// -----------------------------------------------------------------------------

export type BeritaStatus = "draft" | "terbit";

export interface BeritaDTO {
  id: number;
  judul: string;
  kategori: string;
  /** String tampil dari backend, mis. "28 October 2024". Jangan dipakai untuk input date. */
  tanggal: string;
  /** ISO "YYYY-MM-DD" untuk form edit; sejak perbaikan B2 dikirim backend. */
  tanggalIso?: string;
  gambar: string | null;
  ringkasan: string | null;
  isi: string | null;
  status: BeritaStatus | null;
  /** Flag highlight. Sejak B6 backend menegakkan hanya satu berita utama. */
  utama: boolean;
  /** True bila isi mengandung HTML (editor rich-text). */
  isiHtml?: boolean;
}

// -----------------------------------------------------------------------------
// Pengumuman  (pengumuman: full CRUD + papan informasi beranda)
// -----------------------------------------------------------------------------

export interface PengumumanDTO {
  id: number;
  judul: string;
  isi: string | null;
  /** String tampil (bulan Inggris). Pakai `tanggalIso` untuk form. */
  tanggal: string;
  /** ISO "YYYY-MM-DD" (perbaikan B2). */
  tanggalIso?: string;
  kategori: string;
  penting: boolean;
  gambar: string | null;
  badge: string | null;
  /** Label status bebas, mis. "Mendesak". */
  status: string | null;
  linkLabel: string | null;
  linkHref: string | null;
  /** Nama ikon Material Symbols, mis. "attach_file" (dipakai papan beranda). */
  icon: string | null;
  actionIcon: string | null;
  /** Varian kartu beranda, mis. "secondary" | "default". */
  variant: string | null;
  /** Sejak perbaikan B3 ikut dikirim pada response GET. */
  tampilBeranda?: boolean;
}

// -----------------------------------------------------------------------------
// Agenda  (agenda: full CRUD)
// -----------------------------------------------------------------------------

export interface AgendaDTO {
  id: number;
  judul: string;
  /** Rentang terformat berbahasa Inggris, mis. "2 - 6 December 2024" (B2). */
  tanggal: string;
  /** ISO "YYYY-MM-DD" — dipakai form edit admin. */
  tglMulai: string;
  tglSelesai: string | null;
  waktu: string | null;
  lokasi: string | null;
  badge: string | null;
  kategori: string | null;
  deskripsi: string | null;
  gambar: string | null;
  /** Diturunkan backend dari tgl_mulai untuk kartu beranda. */
  day: number;
  /** Singkatan bulan bahasa Inggris, mis. "DEC" (frontend memformat sendiri jika perlu). */
  month: string;
  /** Sejak perbaikan B3 ikut dikirim pada response GET. */
  tampilBeranda?: boolean;
}

// -----------------------------------------------------------------------------
// Guru  (guru: full CRUD)
// -----------------------------------------------------------------------------

export interface GuruDTO {
  id: number;
  nama: string;
  jabatan: string;
  deskripsi: string | null;
  /** Taksonomi bebas, mis. "Pimpinan" | "Keahlian" | "BK" (perlu disepakati). */
  kategori: string;
  gambar: string | null;
  /** Belum dikirim oleh GET (perbaikan B4), padahal POST/PUT menerimanya. */
  urutan?: number;
}

// -----------------------------------------------------------------------------
// Galeri & Fasilitas
// -----------------------------------------------------------------------------

export interface GaleriDTO {
  id: number;
  judul: string;
  kategori: string;
  gambar: string;
}

export interface FasilitasDTO {
  id: number;
  judul: string;
  deskripsi: string | null;
  gambar: string | null;
  kategori: string | null;
  unggulan: boolean;
}

export interface HubIndustriDTO {
  id: number;
  nama: string;
  logo: string | null;
  alamat: string;
  deskripsi: string;
  linkLabel: string | null;
  linkHref: string | null;
  urutan: number;
  aktif: boolean;
}

export interface EkstrakurikulerDTO {
  id: number;
  nama: string;
  deskripsi: string | null;
  logo: string | null;
  kategori: string | null;
  pembina: string | null;
  jadwal: string | null;
  lokasi: string | null;
  unggulan: boolean;
}

// -----------------------------------------------------------------------------
// Jadwal mingguan per kelas, hari, dan rentang jam pelajaran
// -----------------------------------------------------------------------------

export type JurusanKey = "perhotelan" | "boga" | "busana" | "pplg" | "pariwisata";

export interface JadwalKelasDTO {
  id: number;
  nama: string;
  jurusan: JurusanKey;
  tingkat: number;
}

export interface JadwalRowDTO {
  id: number;
  kelasId: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  guru: string | null;
}

export interface JadwalDataDTO {
  classes: JadwalKelasDTO[];
  schedules: JadwalRowDTO[];
}

// -----------------------------------------------------------------------------
// Inbox: Pesan BK
// -----------------------------------------------------------------------------

export type StatusPesanBK = "Baru" | "Diproses" | "Selesai";

export interface BKEvidenceDTO {
  storedName: string;
  mime: string;
  size: number;
  label: string;
}

export interface PesanBKDTO {
  id: number;
  nama: string;
  kelas: string;
  noHp: string | null;
  keperluan: string;
  pesan: string;
  status: StatusPesanBK;
  kategori: string | null;
  tanggal: string;

  // ---- Hasil triase Counsellor AI (Bimbingan Konseling) ----
  /** Ringkasan netral masalah, ditulis AI dari cerita siswa. */
  ringkasan: string | null;
  /** 'Ringan' | 'Sedang' | 'Berat' — guru BK mengurutkan dari sini. */
  tingkatKesulitan: TingkatKesulitanBK | null;
  /** true bila ada indikasi risiko keselamatan - selalu didahulukan. */
  butuhPerhatian: boolean;
  /** Transkrip percakapan siswa dengan counseller AI (JSON string). */
  transkrip: string | null;
  /** true bila pesan terhubung ke riwayat perangkat siswa untuk balasan portal. */
  canReply: boolean;
  /** Lampiran bukti privat; file hanya dapat dibaca admin terautentikasi. */
  media: BKEvidenceDTO[];
}

export interface ArsipDTO {
  id: number;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  namaFile: string;
  ukuranFile: number;
  aktif: boolean;
  createdAt: string;
  downloadUrl: string;
}

export interface KelulusanDTO {
  id: number;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jurusan: string;
  tahunLulus: number;
  status: "Lulus" | "Tidak Lulus";
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatusPrestasi = "Baru" | "Ditinjau" | "Disetujui" | "Ditolak";

export interface PrestasiDTO {
  id: number;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jurusan: string;
  perlombaan: string;
  tingkat: string;
  tanggalLomba: string;
  penyelenggara: string;
  prestasi: string;
  deskripsi: string | null;
  namaFile: string | null;
  adaBukti: boolean;
  status: StatusPrestasi;
  kategori: string | null;
  createdAt: string;
  reviewedAt: string | null;
  downloadUrl: string | null;
}

/**
 * @deprecated Aspirasi dihapus dari UI (P4.1/P4.6, 2026-10-04). Tipe ini hanya
 * dipertahankan agar data lama di backend tetap terbaca bila diperlukan;
 * jangan dipakai untuk fitur baru.
 */

/** Tingkat kesulitan hasil triase AI. */
export type TingkatKesulitanBK = "Ringan" | "Sedang" | "Berat";

/**
 * Bobot urgensi untuk mengurutkan daftar di panel admin.
 * Makin besar makin diprioritaskan.
 */
export const BOBOT_KESULITAN: Record<TingkatKesulitanBK, number> = {
  Ringan: 1,
  Sedang: 2,
  Berat: 3,
};

export type StatusAspirasi = "Baru" | "Ditinjau" | "Selesai";

export interface AspirasiDTO {
  id: number;
  nama: string | null;
  email: string | null;
  kategori: string | null;
  pesan: string;
  status: StatusAspirasi;
  created_at: string;
}

/** @deprecated Lihat catatan pada `StatusAspirasi`. */

// -----------------------------------------------------------------------------
// Riwayat chatbot (read-only)
// -----------------------------------------------------------------------------

export interface ChatSessionDTO {
  session_id: string;
  created_at: string;
  /** MySQL COUNT() dikembalikan sebagai string oleh PDO. */
  total_pesan: string | number;
}

export interface ChatMessageDTO {
  sender: "user" | "bot";
  text: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Analytics chatbot (GET /api/chat/analytics.php, /insights.php)
// -----------------------------------------------------------------------------

export interface ChatMetrik {
  totalSesi: number;
  aktifHariIni: number;
  totalPertanyaan: number;
  totalJawaban: number;
  dijawab: number;
  persenDijawab: number;
  eskalasi: number;
  persenEskalasi: number;
  luarKonteks: number;
  persenLuarKonteks: number;
  /** Balasan bot berstatus "resolved" (sama dengan `dijawab`). */
  terjawab: number;
  /** Balasan bot berstatus "escalated"/"unanswered" — butuh info/intervensi. */
  tidakTerjawab: number;
  persenTerjawab: number;
  persenTidakTerjawab: number;
}

export interface ChatTren {
  tanggal: string;
  sesi: number;
}

export interface ChatKategori {
  kategori: string;
  jumlah: number;
}

export interface ChatTop {
  pertanyaan: string;
  jumlah: number;
  kategori: string | null;
  statusTerakhir: string | null;
  /**
   * Label dua status yang sudah dipetakan backend:
   * "Terjawab" atau "Tidak Terjawab/AI butuh info lebih lanjut"
   * (atau "Belum ada status" untuk data lama tanpa klasifikasi).
   * Opsional: backend lama belum mengirim label ini.
   */
  statusLabel?: string;
  terakhir: string;
}

/** Satu entri notifikasi otomatis Chatbot-BK (jejak bk_wa_alert). */
export interface ChatbotBKEntry {
  id: number;
  jumlahLaporan: number;
  target: string;
  pesan: string;
  status: "Terkirim" | "Gagal" | "Dilewati" | string;
  error: string | null;
  tanggal: string;
}

/** Analytics notifikasi otomatis Chatbot-BK (WhatsApp ke Guru BK). */
export interface ChatbotBKAnalytics {
  /** Nama persona pengirim ("Chatbot-BK"). */
  pengirim: string;
  /** Total percobaan notifikasi pada periode (termasuk yang dilewati). */
  totalNotifikasi: number;
  terkirim: number;
  gagal: number;
  dilewati: number;
  /** Timestamp notifikasi terakhir yang benar-benar dicoba (null bila belum). */
  terakhirKirim: string | null;
  terakhirStatus: string | null;
  /** Antrean laporan BK yang masih terbuka. */
  laporanAktif: number;
  /** Laporan terbuka yang perlu intervensi manusia. */
  perluIntervensi: number;
  /** Laporan yang sudah berstatus Selesai. */
  sudahDitangani: number;
  /** Ambang eskalasi yang aktif. */
  ambang: number;
  /** Apakah notifikasi otomatis sedang aktif. */
  aktif: boolean;
  /** 10 entri notifikasi terakhir pada periode. */
  riwayat: ChatbotBKEntry[];
}

export interface ChatAnalyticsResponse {
  periode: { dari: string; sampai: string };
  metrik: ChatMetrik;
  tren: ChatTren[];
  kategori: ChatKategori[];
  sentimen: { positif: number; netral: number; negatif: number };
  top: ChatTop[];
  /**
   * Analytics notifikasi otomatis Chatbot-BK. Opsional karena backend lama
   * (belum ada migrasi/endpoint baru) tidak mengirim blok ini.
   */
  chatbotBK?: ChatbotBKAnalytics;
}

export type ChatInsightTipe = "tren" | "konten_kurang" | "rekomendasi" | "teknis" | "faq";

export interface ChatInsight {
  id: number;
  tipe: ChatInsightTipe;
  judul: string;
  isi: string;
  sumber: "ai" | "heuristik";
  periodeMulai: string | null;
  periodeSelesai: string | null;
  status: "baru" | "selesai" | "diabaikan";
  createdAt: string;
}

export interface ChatInsightsResponse {
  aktif: ChatInsight[];
  riwayat: ChatInsight[];
}

// -----------------------------------------------------------------------------
// Notifikasi WhatsApp Guru BK (GET/POST /api/bk/wa-config.php)
// -----------------------------------------------------------------------------

export type WaProvider = "fonnte" | "wablas";

export interface BkWaSetting {
  target: string;
  aktif: boolean;
  threshold: number;
  provider: WaProvider;
  sumber: "database" | "env";
  jumlah_laporan_terbuka: number;
  /** Nama persona pengirim pesan ("Chatbot-BK"). */
  pengirim: string;
  /** Status singkat sang agen, siap ditampilkan di UI. */
  status_agen: string;
  /** Pratinjau isi pesan hari ini (tidak dikirim). */
  preview_pesan: string;
  /** Jumlah pesan yang pernah dikirim ke Guru BK. */
  total_terkirim: number;
  /** Timestamp pengiriman terakhir (null bila belum pernah). */
  terakhir_kirim: string | null;
  /** Status pengiriman terakhir. */
  terakhir_status: string | null;
}

export interface BkWaTestResult {
  ok: boolean;
  status: string;
  detail: string;
  jumlah: number;
  target: string;
  provider: WaProvider;
}

// -----------------------------------------------------------------------------
// Memori Chatbot — dataset knowledge (GET/POST/PUT/DELETE /api/knowledge/index.php)
// -----------------------------------------------------------------------------

export type KnowledgeKategori = "PPDB" | "Jurusan" | "Jadwal" | "Fasilitas" | "Umum";

/** Entri list: konten dipotong backend (kolom `potongan`). */
export interface KnowledgeDTO {
  id: number;
  judul: string;
  kategori: KnowledgeKategori;
  tags: string;
  sumber: string;
  potongan: string;
  updated_at: string | null;
}

/** Entri penuh dari GET ?id= — untuk dialog edit. */
export interface KnowledgeEntri extends KnowledgeDTO {
  konten: string;
}

/** Baris pratinjau hasil parse POST ?preview=1 (belum tersimpan). */
export interface KnowledgePreviewRow {
  judul: string;
  kategori: KnowledgeKategori;
  potongan: string;
  tags: string;
  sumber: string;
}

export interface KnowledgePreviewResponse {
  dibaca: number;
  valid: KnowledgePreviewRow[];
  gagal: string[];
}

export interface KnowledgeImportResponse {
  dibaca: number;
  tersimpan: number;
  baru: number;
  diperbarui: number;
  gagal: string[];
  catatan: string[];
  total: number;
  file: string;
}

export interface KnowledgeListResponse {
  entri: KnowledgeDTO[];
  total: number;
}
