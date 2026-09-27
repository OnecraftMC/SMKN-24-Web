// Lapisan data contoh untuk kondisi BACKEND_URL belum terkonfigurasi (build Vercel
// tanpa env, atau clone lokal). Bentuk objek sengaja disamakan dengan tipe View di
// packages/shared/mappers.ts supaya komponen tidak perlu tahu sumber datanya.
//
// CATATAN: isi file ini adalah data arsip/contoh (bertahun 2024), bukan data
// sekolah yang terverifikasi. Begitu BACKEND_URL terisi, halaman otomatis memakai
// data asli dari backend dan file ini tidak lagi dipakai.

import {
  agendaBerandaData,
  beritaData,
  beritaUtama,
  fasilitasData,
  guruData,
  JADWAL_DATA,
  pengumumanBerandaData,
} from "./data";
import { beritaHref } from "../../../packages/shared/mappers";
import type {
  AgendaView,
  BeritaView,
  FasilitasView,
  GuruView,
  JadwalDTO,
  PengumumanView,
} from "../../../packages/shared/mappers";
import type { JurusanKey } from "./types";

export function beritaContoh(): BeritaView[] {
  return beritaData.map((item) => ({
    ...item,
    tanggalIso: "",
    isi: item.ringkasan,
    status: "terbit",
    utama: false,
    slug: beritaHref(item),
    tanggalTampil: item.tanggal,
  }));
}

export function beritaUtamaContoh(): BeritaView {
  return {
    id: 0,
    ...beritaUtama,
    tanggalIso: "",
    isi: beritaUtama.ringkasan,
    status: "terbit",
    utama: true,
    slug: beritaHref({ id: 0, judul: beritaUtama.judul }),
    tanggalTampil: beritaUtama.tanggal,
  };
}

export function pengumumanContoh(): PengumumanView[] {
  return pengumumanBerandaData.map((item) => ({
    id: item.id,
    judul: item.judul,
    isi: item.deskripsi,
    deskripsi: item.deskripsi,
    tanggal: "2024-11-15",
    tanggalIso: "",
    kategori: "Umum",
    penting: item.status !== null,
    gambar: null,
    badge: item.badge,
    status: item.status,
    linkLabel: item.linkLabel,
    linkHref: item.linkHref,
    icon: item.icon,
    actionIcon: item.actionIcon,
    variant: item.variant,
    tampilBeranda: true,
  }));
}

export function agendaContoh(): AgendaView[] {
  return agendaBerandaData.map((item) => ({
    id: item.id,
    judul: item.title,
    tanggal: "2024-11-12",
    tglMulai: "2024-11-12",
    tglSelesai: null,
    waktu: item.time,
    lokasi: null,
    badge: item.badge,
    deskripsi: item.desc,
    gambar: null,
    tampilBeranda: true,
    day: item.day,
    month: item.month,
    title: item.title,
    desc: item.desc,
    time: item.time,
  }));
}

export function guruContoh(): GuruView[] {
  return guruData.map((item) => ({
    id: item.id,
    name: item.nama,
    title: item.jabatan,
    desc: item.deskripsi,
    category: item.kategori,
    image: item.gambar,
  }));
}

export function fasilitasContoh(): FasilitasView[] {
  return fasilitasData.map((item) => ({
    id: item.id,
    title: item.judul,
    desc: item.deskripsi,
    image: item.gambar,
  }));
}

// Galeri sengaja dikosongkan: satu-satunya aset di lib/data.ts adalah data-URL
// base64 yang tidak bisa dilayani `next/image` (butuh `unoptimized`). Komponen
// GaleriVisual menampilkan pesan status dari `error` yang diteruskan halaman.
export function galeriContoh(): never[] {
  return [];
}

export function jadwalContoh(): Record<JurusanKey, JadwalDTO> {
  return JADWAL_DATA;
}

/** Bentuk kosong untuk kasus backend hidup tetapi gagal merespons. */
export const JADWAL_KOSONG = {} as Record<JurusanKey, JadwalDTO>;