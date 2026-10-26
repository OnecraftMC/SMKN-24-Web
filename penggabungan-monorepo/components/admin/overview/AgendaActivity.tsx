"use client";

/**
 * Kolom kanan Overview: “Hari Ini & Berikutnya” (agenda 7 hari) dan
 * “Aktivitas Terbaru” (hanya konten — tanpa identitas siswa).
 *
 * Kegagalan per sumber tidak mengosongkan panel lain; umur memakai waktu
 * lokal dan label “tanpa waktu” adalah fakta, bukan warna peringatan.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AgendaDTO, BeritaDTO, PesanBKDTO } from "@/lib/admin/types";
import type { PrestasiAntrean, PengumumanRingkas, SumberState } from "@/lib/admin/moduleCounts";
import { tanggalLocal } from "@/lib/admin/moduleCounts";
import { formatNumber, frasaHari, hariSejak, tanggalBerita } from "./ringkasan";

type Props = {
  agenda: SumberState<AgendaDTO[]>;
  berita: SumberState<BeritaDTO[]>;
  pengumuman: SumberState<PengumumanRingkas>;
  bk: SumberState<PesanBKDTO[]>;
  prestasi: SumberState<PrestasiAntrean>;
};

const HARI_KE_DEPAN = 7;

function tanggalDariIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!cocok) return null;
  return new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
}

const FORMAT_HARI = new Intl.DateTimeFormat("id-ID", { day: "numeric" });
const FORMAT_BULAN = new Intl.DateTimeFormat("id-ID", { month: "short" });

export default function AgendaActivity(props: Props) {
  return (
    <div className="space-y-space-lg">
      <HariIniBerikutnya agenda={props.agenda} />
      <AktivitasTerbaru
        berita={props.berita}
        pengumuman={props.pengumuman}
        bk={props.bk}
        prestasi={props.prestasi}
      />
    </div>
  );
}

/* -------------------------- Hari Ini & Berikutnya ------------------------- */

function HariIniBerikutnya({ agenda }: { agenda: SumberState<AgendaDTO[]> }) {
  return (
    <section
      aria-labelledby="agenda-overview-heading"
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      <div className="flex items-baseline justify-between gap-space-sm">
        <h2
          id="agenda-overview-heading"
          className="font-title-md text-title-md font-bold text-on-surface"
        >
          Hari Ini &amp; Berikutnya
        </h2>
        <Link
          href="/admin/agenda"
          className="inline-flex min-h-9 items-center gap-1 font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
        >
          Agenda
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>

      {agenda.kind === "loading" ? (
        <div className="mt-space-md space-y-2" aria-busy="true">
          <span className="sr-only">Memuat agenda…</span>
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-10 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      ) : agenda.kind === "error" ? (
        <p role="alert" className="mt-space-md font-body-sm text-body-sm font-bold text-error">
          Gagal memuat agenda: {agenda.message}
        </p>
      ) : (
        <DaftarAgenda items={agenda.value} />
      )}
    </section>
  );
}

function DaftarAgenda({ items }: { items: AgendaDTO[] }) {
  const sekarang = new Date();
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const batas = new Date(hariIni);
  batas.setDate(batas.getDate() + HARI_KE_DEPAN);
  const isoHariIni = tanggalLocal(hariIni);
  const isoBatas = tanggalLocal(batas);

  const tampil = items
    .filter((item) => {
      const selesai = item.tglSelesai ?? item.tglMulai;
      return selesai >= isoHariIni && item.tglMulai <= isoBatas;
    })
    .sort((a, b) => a.tglMulai.localeCompare(b.tglMulai))
    .slice(0, 5);

  if (tampil.length === 0) {
    return (
      <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
        Tidak ada agenda dalam {HARI_KE_DEPAN} hari ke depan.
      </p>
    );
  }

  return (
    <ul className="mt-space-md divide-y divide-surface-container">
      {tampil.map((item) => {
        const tanggal = tanggalDariIso(item.tglMulai);
        const hariIniItem = item.tglMulai <= isoHariIni && (item.tglSelesai ?? item.tglMulai) >= isoHariIni;
        return (
          <li
            key={item.id}
            className="flex items-start gap-space-sm py-2.5 first:pt-0 last:pb-0"
          >
            <span className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-surface-container-low py-1.5 text-center">
              <span className="font-title-sm text-title-sm font-bold leading-none text-primary tabular-nums">
                {tanggal ? FORMAT_HARI.format(tanggal) : "—"}
              </span>
              <span className="mt-0.5 font-label-sm text-label-sm uppercase leading-none text-on-surface-variant">
                {tanggal ? FORMAT_BULAN.format(tanggal) : ""}
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-body-sm text-body-sm font-bold text-on-surface">
                  {item.judul}
                </p>
                {hariIniItem && (
                  <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-container">
                    Hari ini
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                {item.waktu ? `${item.waktu} WIB` : "tanpa waktu"}
                {item.lokasi ? ` · ${item.lokasi}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------- Aktivitas Terbaru --------------------------- */

type Aktivitas = { key: string; judul: string; meta: string };

function AktivitasTerbaru({
  berita,
  pengumuman,
  bk,
  prestasi,
}: Omit<Props, "agenda">) {
  const aktivitas: Aktivitas[] = [];
  let adaGagal = false;

  // Berita terbit terakhir.
  if (berita.kind === "ok") {
    const terbit = berita.value
      .filter((item) => item.status !== "draft")
      .map((item) => ({ item, tanggal: tanggalBerita(item) }))
      .filter((entry): entry is { item: BeritaDTO; tanggal: Date } => entry.tanggal !== null)
      .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());
    if (terbit.length > 0) {
      aktivitas.push({
        key: "berita",
        judul: terbit[0].item.judul,
        meta: `Berita terbit · ${frasaHari(hariSejak(terbit[0].item.tanggalIso))}`,
      });
    }
  } else if (berita.kind === "error") {
    adaGagal = true;
  }

  // Pengumuman terbaru.
  if (pengumuman.kind === "ok") {
    const urut = [...pengumuman.value.items].sort((a, b) =>
      (b.tanggalIso ?? "").localeCompare(a.tanggalIso ?? ""),
    );
    if (urut.length > 0) {
      aktivitas.push({
        key: "pengumuman",
        judul: urut[0].judul,
        meta: `Pengumuman · ${frasaHari(hariSejak(urut[0].tanggalIso))}`,
      });
    }
  } else if (pengumuman.kind === "error") {
    adaGagal = true;
  }

  // Prestasi masuk (anonim).
  if (prestasi.kind === "ok" && prestasi.value.baru > 0) {
    const terbaru = prestasi.value.items
      .map((item) => hariSejak(item.createdAt))
      .filter((umur): umur is number => umur !== null)
      .sort((a, b) => a - b)[0];
    aktivitas.push({
      key: "prestasi",
      judul: `${formatNumber(prestasi.value.baru)} pengajuan prestasi baru`,
      meta: terbaru !== undefined ? `Terbaru ${frasaHari(terbaru)}` : "Menunggu penilaian",
    });
  } else if (prestasi.kind === "error") {
    adaGagal = true;
  }

  // Pesan BK masuk (anonim).
  if (bk.kind === "ok") {
    const baru = bk.value
      .filter((pesan) => pesan.status === "Baru")
      .map((pesan) => hariSejak(pesan.tanggal))
      .filter((umur): umur is number => umur !== null)
      .sort((a, b) => a - b);
    if (baru.length > 0) {
      aktivitas.push({
        key: "bk",
        judul: `${formatNumber(baru.length)} pesan konseling baru`,
        meta: `Masuk terbaru ${frasaHari(baru[0])}`,
      });
    }
  } else if (bk.kind === "error") {
    adaGagal = true;
  }

  return (
    <section
      aria-labelledby="aktivitas-overview-heading"
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      <h2
        id="aktivitas-overview-heading"
        className="font-title-md text-title-md font-bold text-on-surface"
      >
        Aktivitas Terbaru
      </h2>

      {aktivitas.length === 0 ? (
        <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
          {adaGagal
            ? "Sebagian aktivitas gagal dimuat."
            : "Belum ada aktivitas konten."}
        </p>
      ) : (
        <ul className="mt-space-md space-y-2.5">
          {aktivitas.map((item) => (
            <li key={item.key} className="relative pl-4">
              <span
                aria-hidden
                className="absolute left-0 top-2 size-1.5 rounded-full bg-secondary"
              />
              <p className="truncate font-body-sm text-body-sm font-bold text-on-surface">
                {item.judul}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{item.meta}</p>
            </li>
          ))}
        </ul>
      )}

      {adaGagal && aktivitas.length > 0 && (
        <p className="mt-space-sm font-label-sm text-label-sm font-bold text-error">
          Sebagian aktivitas gagal dimuat.
        </p>
      )}
    </section>
  );
}
