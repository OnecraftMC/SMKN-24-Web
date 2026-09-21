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
  /** Terformat ulang oleh backend, mis. "28 October 2024" (B2: akan menjadi ISO). */
  tanggal: string;
  gambar: string | null;
  ringkasan: string | null;
  isi: string | null;
  status: BeritaStatus | null;
  /** Flag highlight/headline. Belum dijamin tunggal oleh backend (B6). */
  utama: boolean;
}

// -----------------------------------------------------------------------------
// Pengumuman  (pengumuman: full CRUD + papan informasi beranda)
// -----------------------------------------------------------------------------

export interface PengumumanDTO {
  id: number;
  judul: string;
  isi: string | null;
  tanggal: string;
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
  /** Belum dikirim oleh GET (perbaikan B3), padahal POST/PUT menerimanya. */
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
  deskripsi: string | null;
  gambar: string | null;
  /** Diturunkan backend dari tgl_mulai untuk kartu beranda. */
  day: number;
  /** Singkatan bulan bahasa Inggris, mis. "DEC" (B2: perlu versi Indonesia). */
  month: string;
  /** Belum dikirim oleh GET, padahal POST/PUT menerimanya. */
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
}

// -----------------------------------------------------------------------------
// Jadwal pembelajaran  (slot unik: jurusan + sesi + urutan)
// -----------------------------------------------------------------------------

export type JurusanKey = "perhotelan" | "boga" | "busana" | "pplg" | "pariwisata";
export type SesiKey = "pagi" | "siang";

export interface JadwalRowDTO {
  id: number;
  jurusan: JurusanKey;
  sesi: SesiKey;
  /** Posisi jam ke-berapa (0..4) — bagian dari unique key. */
  urutan: number;
  mapel: string;
  jam: string | null;
  waktu: string | null;
  guru: string | null;
}

/** Bentuk matriks jadwal publik: hanya nama mapel per sesi. */
export interface JadwalMatriksDTO {
  pagi: string[];
  siang: string[];
}

// -----------------------------------------------------------------------------
// Inbox: Pesan BK & Aspirasi
// -----------------------------------------------------------------------------

export type StatusPesanBK = "Baru" | "Diproses" | "Selesai";

export interface PesanBKDTO {
  id: number;
  nama: string;
  kelas: string;
  noHp: string | null;
  keperluan: string;
  pesan: string;
  status: StatusPesanBK;
  tanggal: string;
}

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

