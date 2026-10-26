"use client";

/**
 * Antrean Keputusan — satu permukaan berbingkai, tiga jalur bertumpuk.
 *
 * Urutan jalur mengikuti pekerjaan manusia: Pesan BK (prioritas backend:
 * `butuhPerhatian`, lalu Berat/Sedang/Ringan, lalu terbaru), Pengajuan
 * Prestasi, lalu Berita Draft. Tidak ada skor prioritas lintas domain.
 *
 * Privasi: baris BK dan prestasi hanya memuat metadata non-identitas
 * (kategori, tingkat, perlombaan, umur, ada/tidak bukti). Nama/NISN/isi
 * pesan tetap eksklusif di /admin/bk dan /admin/prestasi.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BeritaDTO, PesanBKDTO } from "@/lib/admin/types";
import type { PrestasiAntrean, SumberState } from "@/lib/admin/moduleCounts";
import { formatNumber, frasaHari, hariSejak, tanggalBerita } from "./ringkasan";

const MAKS_BARIS = 3;

const URUT_TINGKAT: Record<string, number> = { Berat: 0, Sedang: 1, Ringan: 2 };

type Props = {
  bk: SumberState<PesanBKDTO[]>;
  prestasi: SumberState<PrestasiAntrean>;
  berita: SumberState<BeritaDTO[]>;
};

export default function DecisionQueues({ bk, prestasi, berita }: Props) {
  return (
    <section
      aria-labelledby="antrean-keputusan-heading"
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      <h2
        id="antrean-keputusan-heading"
        className="font-title-md text-title-md font-bold text-on-surface"
      >
        Antrean Keputusan
      </h2>
      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
        Tiga hal yang menunggu keputusan manusia — dihitung dan diurutkan dari
        data sekolah, tanpa identitas siswa.
      </p>

      <div className="mt-space-md divide-y divide-surface-container">
        <JalurBK bk={bk} />
        <JalurPrestasi prestasi={prestasi} />
        <JalurDraft berita={berita} />
      </div>
    </section>
  );
}

/* ------------------------------- kerangka -------------------------------- */

function Jalur({
  judul,
  meta,
  href,
  cta,
  children,
}: {
  judul: string;
  meta: string;
  href: string;
  cta: string;
  children: ReactNode;
}) {
  return (
    <div className="py-space-md first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-space-md gap-y-1">
        <h3 className="font-title-sm text-title-sm font-bold text-on-surface">{judul}</h3>
        <div className="flex flex-wrap items-center gap-x-space-md gap-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant">{meta}</p>
          <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-1 font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {cta}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="mt-space-sm">{children}</div>
    </div>
  );
}

function Baris({
  judul,
  tag,
  meta,
  href,
  aksi,
}: {
  judul: string;
  tag?: ReactNode;
  meta: string;
  href: string;
  aksi: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-2 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-body-sm text-body-sm font-bold text-on-surface">
            {judul}
          </p>
          {tag}
        </div>
        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{meta}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-9 items-center rounded-lg border border-outline-variant px-3 font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {aksi}
      </Link>
    </li>
  );
}

function SkeletonBaris() {
  return (
    <div className="space-y-2 py-1" aria-busy="true">
      <span className="sr-only">Memuat antrean…</span>
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-4 animate-pulse rounded bg-surface-container" />
      ))}
    </div>
  );
}

function Gagal({ pesan }: { pesan: string }) {
  return (
    <p role="alert" className="font-body-sm text-body-sm font-bold text-error">
      Gagal memuat: {pesan}
    </p>
  );
}

function Kosong({ children }: { children: ReactNode }) {
  return <p className="font-body-sm text-body-sm text-on-surface-variant">{children}</p>;
}

function Sisa({ jumlah }: { jumlah: number }) {
  if (jumlah <= 0) return null;
  return (
    <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
      +{formatNumber(jumlah)} lainnya
    </p>
  );
}

/* -------------------------------- jalur BK -------------------------------- */

function JalurBK({ bk }: { bk: SumberState<PesanBKDTO[]> }) {
  if (bk.kind === "loading") {
    return (
      <Jalur judul="Pesan BK" meta="memuat" href="/admin/bk" cta="Buka inbox">
        <SkeletonBaris />
      </Jalur>
    );
  }

  if (bk.kind === "error") {
    return (
      <Jalur judul="Pesan BK" meta="gagal" href="/admin/bk" cta="Buka inbox">
        <Gagal pesan={bk.message} />
      </Jalur>
    );
  }

  const baru = bk.value.filter((pesan) => pesan.status === "Baru");
  const perluPerhatian = baru.filter((pesan) => pesan.butuhPerhatian).length;
  const diproses = bk.value.filter((pesan) => pesan.status === "Diproses").length;

  const urut = [...baru].sort((a, b) => {
    if (a.butuhPerhatian !== b.butuhPerhatian) return a.butuhPerhatian ? -1 : 1;
    const tingkatA = URUT_TINGKAT[a.tingkatKesulitan ?? ""] ?? 3;
    const tingkatB = URUT_TINGKAT[b.tingkatKesulitan ?? ""] ?? 3;
    if (tingkatA !== tingkatB) return tingkatA - tingkatB;
    return b.tanggal.localeCompare(a.tanggal);
  });

  return (
    <Jalur
      judul="Pesan BK"
      meta={`${formatNumber(baru.length)} baru · ${formatNumber(perluPerhatian)} perlu perhatian`}
      href="/admin/bk"
      cta="Buka inbox"
    >
      {urut.length === 0 ? (
        <Kosong>
          {diproses > 0
            ? `Tidak ada pesan baru. ${formatNumber(diproses)} pesan sedang diproses.`
            : "Tidak ada pesan baru. Inbox bersih."}
        </Kosong>
      ) : (
        <>
          <ul className="divide-y divide-surface-container">
            {urut.slice(0, MAKS_BARIS).map((pesan) => (
              <Baris
                key={pesan.id}
                judul={[
                  "Pesan konseling",
                  pesan.kategori,
                  pesan.tingkatKesulitan,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                tag={
                  pesan.butuhPerhatian ? (
                    <span className="rounded-full bg-error-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-error-container">
                      Perlu perhatian
                    </span>
                  ) : undefined
                }
                meta={`menunggu ${frasaHari(hariSejak(pesan.tanggal))}`}
                href="/admin/bk"
                aksi="Tangani"
              />
            ))}
          </ul>
          <Sisa jumlah={urut.length - MAKS_BARIS} />
        </>
      )}
    </Jalur>
  );
}

/* ----------------------------- jalur prestasi ----------------------------- */

function JalurPrestasi({ prestasi }: { prestasi: SumberState<PrestasiAntrean> }) {
  if (prestasi.kind === "loading") {
    return (
      <Jalur judul="Pengajuan Prestasi" meta="memuat" href="/admin/prestasi" cta="Buka antrean">
        <SkeletonBaris />
      </Jalur>
    );
  }

  if (prestasi.kind === "error") {
    return (
      <Jalur judul="Pengajuan Prestasi" meta="gagal" href="/admin/prestasi" cta="Buka antrean">
        <Gagal pesan={prestasi.message} />
      </Jalur>
    );
  }

  const items = prestasi.value.items;

  return (
    <Jalur
      judul="Pengajuan Prestasi"
      meta={`${formatNumber(prestasi.value.baru)} baru · ${formatNumber(prestasi.value.ditinjau)} sudah ditinjau`}
      href="/admin/prestasi"
      cta="Buka antrean"
    >
      {items.length === 0 ? (
        <Kosong>Tidak ada pengajuan baru. Semua pengajuan sudah ditinjau.</Kosong>
      ) : (
        <>
          <ul className="divide-y divide-surface-container">
            {items.slice(0, MAKS_BARIS).map((item) => (
              <Baris
                key={item.id}
                judul={[item.perlombaan, item.tingkat].filter(Boolean).join(" · ")}
                meta={`diajukan ${frasaHari(hariSejak(item.createdAt))} · ${
                  item.adaBukti ? "bukti ada" : "tanpa bukti"
                }`}
                href="/admin/prestasi"
                aksi="Nilai"
              />
            ))}
          </ul>
          <Sisa jumlah={prestasi.value.baru - MAKS_BARIS} />
        </>
      )}
    </Jalur>
  );
}

/* ------------------------------ jalur draft ------------------------------- */

function kekuranganDraft(berita: BeritaDTO): string {
  const kurang: string[] = [];
  if (!berita.gambar) kurang.push("tanpa gambar");
  if (!berita.ringkasan) kurang.push("tanpa ringkasan");
  if (!berita.isi) kurang.push("tanpa isi");
  return kurang.length > 0 ? kurang.join(" · ") : "lengkap";
}

function JalurDraft({ berita }: { berita: SumberState<BeritaDTO[]> }) {
  if (berita.kind === "loading") {
    return (
      <Jalur judul="Berita Draft" meta="memuat" href="/admin/berita" cta="Buka berita">
        <SkeletonBaris />
      </Jalur>
    );
  }

  if (berita.kind === "error") {
    return (
      <Jalur judul="Berita Draft" meta="gagal" href="/admin/berita" cta="Buka berita">
        <Gagal pesan={berita.message} />
      </Jalur>
    );
  }

  const draft = berita.value.filter((item) => item.status === "draft");
  const lengkap = draft.filter((item) => kekuranganDraft(item) === "lengkap").length;
  const terbitTerakhir = berita.value
    .filter((item) => item.status !== "draft")
    .map((item) => tanggalBerita(item))
    .filter((tanggal): tanggal is Date => tanggal !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <Jalur
      judul="Berita Draft"
      meta={`${formatNumber(draft.length)} draft · ${formatNumber(lengkap)} lengkap`}
      href="/admin/berita"
      cta="Buka berita"
    >
      {draft.length === 0 ? (
        <Kosong>
          Tidak ada draft.{" "}
          {terbitTerakhir
            ? `Berita terakhir terbit ${frasaHari(hariSejak(terbitTerakhir.toISOString()))}.`
            : "Belum ada berita terbit."}
        </Kosong>
      ) : (
        <>
          <ul className="divide-y divide-surface-container">
            {draft.slice(0, MAKS_BARIS).map((item) => {
              const umur = hariSejak(item.tanggalIso);
              return (
                <Baris
                  key={item.id}
                  judul={item.judul}
                  meta={`draft ${frasaHari(umur)} · ${kekuranganDraft(item)}`}
                  href={`/admin/berita/${item.id}`}
                  aksi="Lanjutkan"
                />
              );
            })}
          </ul>
          <Sisa jumlah={draft.length - MAKS_BARIS} />
        </>
      )}
    </Jalur>
  );
}
