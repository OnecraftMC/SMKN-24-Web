export interface BeritaDTO {
  id: number;
  judul: string;
  kategori: string;
  tanggal: string;
  tanggalIso: string;
  gambar: string | null;
  ringkasan: string | null;
  isi: string | null;
  status: "draft" | "terbit" | null;
  utama: boolean;
}

export interface PengumumanDTO {
  id: number;
  judul: string;
  isi: string | null;
  tanggal: string;
  tanggalIso: string;
  kategori: string;
  penting: boolean;
  gambar: string | null;
  badge: string | null;
  status: string | null;
  linkLabel: string | null;
  linkHref: string | null;
  icon: string | null;
  actionIcon: string | null;
  variant: string | null;
  tampilBeranda: boolean;
}

export interface AgendaDTO {
  id: number;
  judul: string;
  tanggal: string;
  tglMulai: string;
  tglSelesai: string | null;
  waktu: string | null;
  lokasi: string | null;
  badge: string | null;
  deskripsi: string | null;
  gambar: string | null;
  tampilBeranda: boolean;
}

export interface GuruDTO {
  id: number;
  nama: string;
  jabatan: string;
  deskripsi: string | null;
  kategori: string;
  gambar: string | null;
  urutan: number;
}

export interface FasilitasDTO {
  id: number;
  judul: string;
  deskripsi: string | null;
  gambar: string | null;
}

export interface GaleriDTO {
  id: number;
  judul: string;
  kategori: string;
  gambar: string;
}

export interface JadwalDTO {
  pagi: string[];
  siang: string[];
}

export interface BeritaView extends Omit<BeritaDTO, "gambar"> {
  gambar: string | null;
  slug: string;
  tanggalTampil: string;
}

export interface PengumumanView extends Omit<PengumumanDTO, "gambar"> {
  gambar: string | null;
  deskripsi: string;
}

export interface AgendaView extends AgendaDTO {
  day: number;
  month: string;
  title: string;
  desc: string;
  time: string;
}

export interface GuruView {
  id: number;
  name: string;
  title: string;
  desc: string;
  category: string;
  image: string | null;
}

export interface FasilitasView {
  id: number;
  title: string;
  desc: string;
  image: string | null;
}

export interface GaleriView {
  id: number;
  title: string;
  category: string;
  image: string | null;
}

export function assetUrl(path: string | null, backendUrl: string): string | null {
  if (!path) return null;
  try {
    return new URL(path, new URL(backendUrl).origin).toString();
  } catch {
    return null;
  }
}

export function formatDateId(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Slug URL segment (tanpa prefix /berita/) — dipakai halaman detail
// (app/berita/[slug]/page.tsx) untuk mencocokkan params dan oleh komponen
// untuk membangun tautan `/berita/${slug}`.
export function slugBerita(item: Pick<BeritaDTO, "id" | "judul">): string {
  return `${slugify(item.judul)}-${item.id}`;
}

export function mapBerita(item: BeritaDTO, backendUrl: string): BeritaView {
  return {
    ...item,
    gambar: assetUrl(item.gambar, backendUrl),
    slug: slugBerita(item),
    tanggalTampil: formatDateId(item.tanggalIso),
  };
}

export function mapPengumuman(item: PengumumanDTO, backendUrl: string): PengumumanView {
  return {
    ...item,
    gambar: assetUrl(item.gambar, backendUrl),
    deskripsi: item.isi ?? "",
  };
}

export function mapAgenda(item: AgendaDTO): AgendaView {
  const date = new Date(`${item.tglMulai}T00:00:00Z`);
  const dateRange = item.tglSelesai && item.tglSelesai !== item.tglMulai
    ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone: "UTC" }).format(date)} - ${formatDateId(item.tglSelesai)}`
    : formatDateId(item.tglMulai);
  return {
    ...item,
    day: Number.isNaN(date.getTime()) ? 0 : date.getUTCDate(),
    month: Number.isNaN(date.getTime())
      ? ""
      : new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(date).replace(".", "").toUpperCase(),
    title: item.judul,
    desc: item.deskripsi || dateRange,
    time: [item.waktu, item.lokasi].filter(Boolean).join(" • "),
  };
}

export function mapGuru(item: GuruDTO, backendUrl: string): GuruView {
  return {
    id: item.id,
    name: item.nama,
    title: item.jabatan,
    desc: item.deskripsi ?? "",
    category: item.kategori,
    image: assetUrl(item.gambar, backendUrl),
  };
}

export function mapFasilitas(item: FasilitasDTO, backendUrl: string): FasilitasView {
  return {
    id: item.id,
    title: item.judul,
    desc: item.deskripsi ?? "",
    image: assetUrl(item.gambar, backendUrl),
  };
}

export function mapGaleri(item: GaleriDTO, backendUrl: string): GaleriView {
  return {
    id: item.id,
    title: item.judul,
    category: item.kategori,
    image: assetUrl(item.gambar, backendUrl),
  };
}
