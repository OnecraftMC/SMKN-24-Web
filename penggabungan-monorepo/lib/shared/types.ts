// =============================================================================
// packages/shared/types.ts
// Field names standardized per PROMPT_STANDARISASI_DATA.md
// =============================================================================

// ---------------------------------------------------------------------------
// Berita (News)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (beritaData, beritaUtama),
//   apps/main-web/app/api/berita/route.ts,
//   apps/main-web/components/kabar/FeaturedNews.tsx (beritaUtama)

export interface Berita {
  id: number;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar: string;
  ringkasan: string;
}

// beritaUtama tidak punya id — dilaporkan sebagai isu terbuka.
export interface BeritaUtama {
  judul: string;
  kategori: string;
  tanggal: string;
  gambar: string;
  ringkasan: string;
}

// Bentuk berita di admin list.
// Dipakai di: apps/main-web/components/admin/pages/BeritaList.tsx
export interface BeritaAdmin {
  judul: string;
  kategori: string;
  tanggal: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Pengumuman (Announcement)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (pengumumanData),
//   apps/main-web/app/api/pengumuman/route.ts

export interface Pengumuman {
  id: number;
  judul: string;
  tanggal: string;
  kategori: string;
  // Catatan: field `isi` dan `penting` ada di admin/Pengumuman.tsx tapi
  // TIDAK ada di data.ts — dilaporkan sebagai isu terbuka.
}

// Bentuk pengumuman di PapanPengumuman.tsx (presentational, tidak import data.ts).
// Dipakai di: apps/main-web/components/beranda/PapanPengumuman.tsx
export interface PengumumanBeranda {
  id: number;
  badge: string;
  status: string | null;
  judul: string;
  deskripsi: string;
  linkLabel: string;
  linkHref: string;
  icon: string;
  actionIcon: string;
  variant: string;
}

// Bentuk pengumuman di admin page.
// Dipakai di: apps/main-web/components/admin/pages/Pengumuman.tsx
export interface PengumumanAdmin {
  judul: string;
  isi: string;
  tanggal: string;
  penting: boolean;
  gambar?: string;
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (agendaData),
//   apps/main-web/app/api/agenda/route.ts

export interface Agenda {
  id: number;
  judul: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
}

// Bentuk agenda di AgendaKegiatan.tsx (presentational, tidak import data.ts).
// Dipakai di: apps/main-web/components/beranda/AgendaKegiatan.tsx
export interface AgendaBeranda {
  id: number;
  day: number;
  month: string;
  badge: string;
  title: string;
  desc: string;
  time: string;
}

// Bentuk agenda di admin page.
// Dipakai di: apps/main-web/components/admin/pages/Agenda.tsx
// Catatan: tglMulai/tglSelesai berbeda bentuk dari data.ts (tanggal tunggal) —
// dilaporkan sebagai isu terbuka, tidak diubah.
export interface AgendaAdmin {
  judul: string;
  tglMulai: string;
  tglSelesai: string;
  lokasi: string;
  gambar?: string;
}

// ---------------------------------------------------------------------------
// Guru (Teacher)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (guruData),
//   apps/main-web/components/profil/DewanGuru.tsx

export interface Guru {
  id: number;
  nama: string;
  jabatan: string;
  deskripsi: string;
  kategori: string;
  gambar: string;
}

// ---------------------------------------------------------------------------
// Jadwal (Schedule)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (JADWAL_DATA),
//   apps/main-web/app/api/jadwal/route.ts,
//   apps/main-web/components/akademik/JadwalMatriks.tsx
// JADWAL_DATA dan admin/Jadwal.tsx TIDAK disentuh per instruksi.

export type JurusanKey = 'perhotelan' | 'boga' | 'busana' | 'pplg' | 'pariwisata';

export interface JadwalSesi {
  pagi: string[];
  siang: string[];
}

export type JadwalData = Record<JurusanKey, JadwalSesi>;

// Bentuk jadwal di admin page (row-based).
// Dipakai di: apps/main-web/components/admin/pages/Jadwal.tsx
export interface JadwalAdminRow {
  jam: string;
  waktu: string;
  mapel: string;
  guru: string;
}

// ---------------------------------------------------------------------------
// Galeri (Gallery)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (galeriData),
//   apps/main-web/components/kabar/GaleriVisual.tsx

export interface Galeri {
  id: number;
  judul: string;
  kategori: string;
  gambar: string;
}

// Bentuk galeri di admin page.
// Dipakai di: apps/main-web/components/admin/pages/Galeri.tsx
export interface GaleriAdmin {
  gambar: string;
  judul: string;
}

// ---------------------------------------------------------------------------
// Fasilitas (Facility)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/lib/data.ts (fasilitasData),
//   apps/main-web/components/profil/FasilitasKampus.tsx

export interface Fasilitas {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string;
}

// ---------------------------------------------------------------------------
// PesanBK (Counseling Request)
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/components/akademik/FormBK.tsx (formData state),
//   apps/main-web/components/admin/pages/BK.tsx (inline pengaduan)

export interface PesanBKInput {
  nama: string;
  kelas: string;
  noHp: string;
  keperluan: string;
  pesan: string;
}

export interface PesanBK {
  nama: string;
  kelas: string;
  keperluan: string;
  pesan: string;
  tanggal: string;
  status: string;
}

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------
// Dipakai di: apps/main-web/components/chatbot/ChatMessages.tsx

export interface ChatMessage {
  id: string | number;
  sender: 'user' | 'bot';
  text: string;
}