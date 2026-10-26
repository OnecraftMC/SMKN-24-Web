"use client";

/**
 * Status Konten — ledger tujuh modul yang memberi tahu apakah situs publik
 * sudah basi, plus tanda tangan halaman “Ritme Terbit”: dua belas kolom
 * mingguan jumlah berita terbit dan umur terbit terakhir.
 *
 * Semua angka dihitung dari snapshot `ModulProvider`; modul yang gagal
 * ditampilkan “Gagal” beserta pesannya, tidak pernah menjadi 0. Catatan hanya
 * fakta terhitung (draft, tidak tayang beranda, agenda tanpa waktu) — tanpa
 * ambang “basi” atau penilaian lulus/gagal.
 */

import Link from "next/link";
import type { AgendaDTO, BeritaDTO, EkstrakurikulerDTO, FasilitasDTO, GaleriDTO, GuruDTO } from "@/lib/admin/types";
import type { PengumumanRingkas, SumberState } from "@/lib/admin/moduleCounts";
import { formatNumber, frasaHari, hariSejak, tanggalBerita } from "./ringkasan";

type Props = {
  berita: SumberState<BeritaDTO[]>;
  pengumuman: SumberState<PengumumanRingkas>;
  agenda: SumberState<AgendaDTO[]>;
  guru: SumberState<GuruDTO[]>;
  fasilitas: SumberState<FasilitasDTO[]>;
  ekstrakurikuler: SumberState<EkstrakurikulerDTO[]>;
  galeri: SumberState<GaleriDTO[]>;
};

type BarisLedger = {
  key: string;
  nama: string;
  href: string;
  tayang: string;
  menunggu: string;
  catatan: string;
  galat: boolean;
};

const SEMUA_MODUL: { key: string; nama: string; href: string }[] = [
  { key: "berita", nama: "Berita", href: "/admin/berita" },
  { key: "pengumuman", nama: "Pengumuman", href: "/admin/pengumuman" },
  { key: "agenda", nama: "Agenda", href: "/admin/agenda" },
  { key: "galeri", nama: "Galeri", href: "/admin/galeri" },
  { key: "fasilitas", nama: "Fasilitas", href: "/admin/fasilitas" },
  { key: "guru", nama: "Guru", href: "/admin/guru" },
  { key: "ekstrakurikuler", nama: "Ekstrakurikuler", href: "/admin/ekstrakurikuler" },
];

/** Angka sel: “…” saat memuat, “Gagal” saat sumber gagal — tidak pernah 0 palsu. */
function sel<T>(
  sumber: SumberState<T>,
  hitung: (value: T) => { tayang: number; menunggu: number; catatan?: string },
): Pick<BarisLedger, "tayang" | "menunggu" | "catatan" | "galat"> {
  if (sumber.kind === "loading") {
    return { tayang: "…", menunggu: "…", catatan: "—", galat: false };
  }
  if (sumber.kind === "error") {
    return { tayang: "Gagal", menunggu: "Gagal", catatan: sumber.message, galat: true };
  }
  const nilai = hitung(sumber.value);
  return {
    tayang: formatNumber(nilai.tayang),
    menunggu: formatNumber(nilai.menunggu),
    catatan: nilai.catatan ?? "—",
    galat: false,
  };
}

function jumlahSederhana<T>(sumber: SumberState<T[]>) {
  return sel(sumber, (items) => ({ tayang: items.length, menunggu: 0 }));
}

function daftarBaris(props: Props): BarisLedger[] {
  const { berita, pengumuman, agenda, guru, fasilitas, ekstrakurikuler, galeri } = props;

  const barisBerita = sel(berita, (items) => {
    const draft = items.filter((item) => item.status === "draft");
    const perlu = draft.filter(
      (item) => !item.gambar || !item.ringkasan || !item.isi,
    ).length;
    return {
      tayang: items.length - draft.length,
      menunggu: draft.length,
      catatan: draft.length > 0 ? `${formatNumber(perlu)} perlu dilengkapi` : "—",
    };
  });

  const barisPengumuman = sel(pengumuman, (value) => {
    const tidakTayang = Math.max(0, value.items.length - value.tampilBeranda);
    return {
      tayang: value.tampilBeranda,
      menunggu: tidakTayang,
      catatan: tidakTayang > 0 ? `${formatNumber(tidakTayang)} tidak tayang beranda` : "—",
    };
  });

  const barisAgenda = sel(agenda, (items) => {
    const tanpaWaktu = items.filter((item) => !item.waktu).length;
    const tidakTayang = items.filter((item) => item.tampilBeranda === false).length;
    return {
      tayang: items.length,
      menunggu: tidakTayang,
      catatan: tanpaWaktu > 0 ? `${formatNumber(tanpaWaktu)} tanpa waktu` : "—",
    };
  });

  const hasil: Record<string, Pick<BarisLedger, "tayang" | "menunggu" | "catatan" | "galat">> = {
    berita: barisBerita,
    pengumuman: barisPengumuman,
    agenda: barisAgenda,
    galeri: jumlahSederhana(galeri),
    fasilitas: jumlahSederhana(fasilitas),
    guru: jumlahSederhana(guru),
    ekstrakurikuler: jumlahSederhana(ekstrakurikuler),
  };

  return SEMUA_MODUL.map((modul) => ({ ...modul, ...hasil[modul.key] }));
}

export default function ContentLedger(props: Props) {
  const baris = daftarBaris(props);

  return (
    <section
      aria-labelledby="status-konten-heading"
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      <div className="flex flex-col gap-space-md lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2
            id="status-konten-heading"
            className="font-title-md text-title-md font-bold text-on-surface"
          >
            Status Konten
          </h2>
          <p className="mt-1 max-w-[46ch] font-body-sm text-body-sm text-on-surface-variant">
            Apa yang tayang, apa yang menunggu, dan apakah situs publik mulai
            basi.
          </p>
        </div>
        <RitmeTerbit berita={props.berita} />
      </div>

      <table className="mt-space-lg hidden w-full sm:table">
        <thead>
          <tr className="border-b border-surface-container text-left font-label-sm text-label-sm text-on-surface-variant">
            <th scope="col" className="py-2 pr-3 font-bold">Modul</th>
            <th scope="col" className="py-2 px-3 text-right font-bold">Tayang</th>
            <th scope="col" className="py-2 px-3 text-right font-bold">Menunggu</th>
            <th scope="col" className="py-2 px-3 font-bold">Catatan</th>
            <th scope="col" className="py-2 pl-3 text-right font-bold">
              <span className="sr-only">Kelola</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container">
          {baris.map((item) => (
            <tr key={item.key} className="align-top">
              <th
                scope="row"
                className="py-2.5 pr-3 text-left font-body-sm text-body-sm font-bold text-on-surface"
              >
                {item.nama}
              </th>
              <td
                className={`px-3 py-2.5 text-right font-body-sm text-body-sm tabular-nums ${
                  item.galat ? "font-bold text-error" : "text-on-surface"
                }`}
              >
                {item.tayang}
              </td>
              <td
                className={`px-3 py-2.5 text-right font-body-sm text-body-sm tabular-nums ${
                  item.galat ? "font-bold text-error" : "text-on-surface"
                }`}
              >
                {item.menunggu}
              </td>
              <td className="px-3 py-2.5 font-label-sm text-label-sm text-on-surface-variant">
                <span className={item.galat ? "text-error" : undefined}>{item.catatan}</span>
              </td>
              <td className="py-2.5 pl-3 text-right">
                <Kelola href={item.href} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-space-md space-y-2 sm:hidden">
        {baris.map((item) => (
          <li
            key={item.key}
            className="rounded-xl border border-surface-container px-space-md py-space-sm"
          >
            <div className="flex items-baseline justify-between gap-space-sm">
              <p className="font-body-sm text-body-sm font-bold text-on-surface">{item.nama}</p>
              <Kelola href={item.href} />
            </div>
            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              <span>
                Tayang{" "}
                <strong className={`tabular-nums ${item.galat ? "text-error" : "text-on-surface"}`}>
                  {item.tayang}
                </strong>
              </span>
              <span aria-hidden> · </span>
              <span>
                Menunggu{" "}
                <strong className={`tabular-nums ${item.galat ? "text-error" : "text-on-surface"}`}>
                  {item.menunggu}
                </strong>
              </span>
              {item.catatan !== "—" && (
                <span className={`mt-0.5 block ${item.galat ? "text-error" : ""}`}>
                  {item.catatan}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Kelola({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      Kelola
    </Link>
  );
}

/* ------------------------------ Ritme Terbit ------------------------------ */

const JUMLAH_MINGGU = 12;

function awalMinggu(tanggal: Date): Date {
  const hasil = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
  const geser = (hasil.getDay() + 6) % 7; // Senin = 0
  hasil.setDate(hasil.getDate() - geser);
  return hasil;
}

function RitmeTerbit({ berita }: { berita: SumberState<BeritaDTO[]> }) {
  if (berita.kind === "loading") {
    return (
      <div className="w-full max-w-[18rem]" aria-busy="true">
        <span className="sr-only">Memuat ritme terbit…</span>
        <div className="flex h-10 items-end gap-1">
          {Array.from({ length: JUMLAH_MINGGU }).map((_, index) => (
            <span key={index} className="h-3 w-full animate-pulse rounded-sm bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (berita.kind === "error") {
    return (
      <p className="max-w-[18rem] font-label-sm text-label-sm font-bold text-error">
        Ritme terbit gagal dihitung.
      </p>
    );
  }

  const terbit = berita.value.filter((item) => item.status !== "draft");
  const mingguIni = awalMinggu(new Date());
  const mingguAwal = new Date(mingguIni);
  mingguAwal.setDate(mingguAwal.getDate() - (JUMLAH_MINGGU - 1) * 7);

  const mingguan = Array.from({ length: JUMLAH_MINGGU }, () => 0);
  let terakhir: Date | null = null;

  for (const item of terbit) {
    const tanggal = tanggalBerita(item);
    if (!tanggal) continue;
    if (!terakhir || tanggal.getTime() > terakhir.getTime()) terakhir = tanggal;
    const selisihHari = Math.floor(
      (tanggal.getTime() - mingguAwal.getTime()) / 86_400_000,
    );
    const kolom = Math.floor(selisihHari / 7);
    if (kolom >= 0 && kolom < JUMLAH_MINGGU) mingguan[kolom] += 1;
  }

  const maks = Math.max(1, ...mingguan);

  return (
    <div className="w-full max-w-[18rem]">
      <div className="flex h-10 items-end gap-1" aria-hidden="true">
        {mingguan.map((jumlah, index) => (
          <span
            key={index}
            title={`${formatNumber(jumlah)} berita terbit`}
            className="w-full rounded-t-sm bg-primary/85"
            style={{ height: `${Math.max(6, Math.round((jumlah / maks) * 100))}%` }}
          />
        ))}
      </div>
      <p className="mt-1 flex justify-between font-label-sm text-label-sm text-on-surface-variant">
        <span>12 minggu lalu</span>
        <span>minggu ini</span>
      </p>
      <p className="mt-1 font-body-sm text-body-sm text-on-surface">
        {terakhir ? (
          <>
            Terbit terakhir{" "}
            <strong className="font-bold">
              {frasaHari(hariSejak(terakhir.toISOString()))}
            </strong>
          </>
        ) : (
          "Belum ada berita terbit."
        )}
        <span className="text-on-surface-variant">
          {" "}
          · {formatNumber(terbit.length)} berita terbit
        </span>
      </p>
      <p className="sr-only">
        {mingguan
          .map((jumlah, index) => `Minggu ${index + 1}: ${formatNumber(jumlah)} berita`)
          .join(", ")}
      </p>
    </div>
  );
}
