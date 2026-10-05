"use client";

import { useState } from "react";
import type { JurusanKey } from "@/lib/types";

/**
 * Bentuk data mengikuti kontrak backend `GET api/jadwal/index.php`:
 * `{ [jurusan]: { pagi: string[]; siang: string[] } }`.
 * (Bentuk row-based dengan kolom hari/tingkat/ruang tidak ada di tabel `jadwal`.)
 */
export type JadwalMatriksData = Partial<Record<JurusanKey, { pagi: string[]; siang: string[] }>>;

const LABEL: Record<JurusanKey, string> = {
  perhotelan: "Perhotelan",
  boga: "Kuliner (Tata Boga)",
  busana: "Tata Busana",
  pplg: "Rekayasa Perangkat Lunak",
  pariwisata: "Usaha Layanan Pariwisata",
};

const SESI = [
  { key: "pagi", judul: "Sesi Pagi" },
  { key: "siang", judul: "Sesi Siang" },
] as const;

export default function JadwalMatriks({
  jadwal,
  error,
}: {
  jadwal: JadwalMatriksData;
  error: string | null;
}) {
  const jurusanList = (Object.keys(jadwal) as JurusanKey[]).filter(
    (key) => jadwal[key]?.pagi.length || jadwal[key]?.siang.length,
  );
  const [selectedJurusan, setSelectedJurusan] = useState<JurusanKey | "">(jurusanList[0] ?? "");
  const sesi = selectedJurusan ? jadwal[selectedJurusan] : null;

  return (
    <div className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="space-y-2">
          <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Data pembelajaran</span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Jadwal Program Keahlian
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Jadwal pembelajaran per program keahlian, sesuai data dari sekolah.
          </p>
        </div>

        {sesi ? (
          <>
            <label className="flex max-w-md flex-col gap-2 font-label-md text-label-md text-primary">
              Program Keahlian
              <select
                value={selectedJurusan}
                onChange={(event) => setSelectedJurusan(event.target.value as JurusanKey)}
                className="rounded-lg border border-surface-container bg-surface-container-lowest px-4 py-3 font-body-md text-body-md"
              >
                {jurusanList.map((key) => (
                  <option key={key} value={key}>
                    {LABEL[key]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-md">
              {SESI.map((sesiItem) => (
                <section
                  key={sesiItem.key}
                  className="overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm"
                >
                  <h3 className="bg-primary px-space-md py-space-sm font-title-md text-title-md text-surface">
                    {sesiItem.judul}
                  </h3>
                  <ol className="divide-y divide-surface-container">
                    {sesi[sesiItem.key].map((mapel, index) => (
                      <li
                        key={mapel}
                        className="flex items-center gap-3 px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container font-label-sm text-label-sm text-primary">
                          {index + 1}
                        </span>
                        {mapel}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p
            className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg font-body-md text-on-surface-variant"
            role="status"
          >
            {error ? `Jadwal belum dapat dimuat: ${error}` : "Belum ada jadwal pembelajaran."}
          </p>
        )}
      </div>
    </div>
  );
}
