"use client";

import { useMemo, useState } from "react";
import type { JadwalDataDTO } from "@/lib/shared/mappers";
import type { JurusanKey } from "@/lib/shared/types";
import MorphSelect, {
  MorphSelectTrigger,
  MorphSelectValue,
  MorphSelectContent,
  MorphSelectItem,
} from "@/components/ui/select-morph";

const PROGRAMS: { key: JurusanKey; label: string }[] = [
  { key: "perhotelan", label: "Perhotelan" },
  { key: "boga", label: "Kuliner / Tata Boga" },
  { key: "busana", label: "Tata Busana" },
  { key: "pplg", label: "Rekayasa Perangkat Lunak" },
  { key: "pariwisata", label: "Usaha Layanan Wisata (ULW)" },
];

const DAYS = [
  { key: "senin", label: "Senin" },
  { key: "selasa", label: "Selasa" },
  { key: "rabu", label: "Rabu" },
  { key: "kamis", label: "Kamis" },
  { key: "jumat", label: "Jumat" },
  { key: "sabtu", label: "Sabtu" },
] as const;

export default function JadwalMatriks({
  jadwal,
  error,
}: {
  jadwal: JadwalDataDTO;
  error: string | null;
}) {
  const [program, setProgram] = useState<JurusanKey | "">(
    jadwal.classes[0]?.jurusan ?? "",
  );
  const [classId, setClassId] = useState(String(jadwal.classes[0]?.id ?? ""));
  const [day, setDay] = useState<(typeof DAYS)[number]["key"]>("senin");

  const programClasses = useMemo(
    () => jadwal.classes.filter((item) => item.jurusan === program),
    [jadwal.classes, program],
  );
  const selectedClass = jadwal.classes.find((item) => String(item.id) === classId);
  const daySchedules = useMemo(
    () =>
      jadwal.schedules
        .filter((row) => row.kelasId === selectedClass?.id && row.hari === day)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
    [day, jadwal.schedules, selectedClass?.id],
  );

  return (
    <section className="w-full bg-surface-container-low px-margin-mobile py-space-4xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max space-y-space-xl">
        <div className="space-y-2">
          <span className="font-label-md font-bold uppercase tracking-wider text-secondary">
            Data pembelajaran
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            Jadwal Program Keahlian
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Pilih program, kelas, dan hari untuk melihat mata pelajaran beserta jam dan guru pengampu.
          </p>
        </div>

        {jadwal.classes.length > 0 ? (
          <>
            <div className="grid gap-space-md sm:grid-cols-2">
              <label className="flex flex-col gap-2 font-label-md text-label-md font-bold text-primary">
                Program keahlian
                <MorphSelect
                  value={program}
                  onValueChange={(value) => {
                    const nextProgram = value as JurusanKey;
                    setProgram(nextProgram);
                    setClassId(String(jadwal.classes.find((item) => item.jurusan === nextProgram)?.id ?? ""));
                  }}
                >
                  <MorphSelectTrigger className="rounded-lg border border-surface-container bg-surface-container-lowest px-4 py-3 font-body-md text-body-md">
                    <MorphSelectValue />
                  </MorphSelectTrigger>
                  <MorphSelectContent>
                    {PROGRAMS.filter(({ key }) => jadwal.classes.some((item) => item.jurusan === key)).map(({ key, label }) => (
                      <MorphSelectItem key={key} value={key}>{label}</MorphSelectItem>
                    ))}
                  </MorphSelectContent>
                </MorphSelect>
              </label>
              <label className="flex flex-col gap-2 font-label-md text-label-md font-bold text-primary">
                Kelas
                <MorphSelect value={classId} onValueChange={setClassId}>
                  <MorphSelectTrigger className="rounded-lg border border-surface-container bg-surface-container-lowest px-4 py-3 font-body-md text-body-md">
                    <MorphSelectValue />
                  </MorphSelectTrigger>
                  <MorphSelectContent>
                    {programClasses.map((item) => (
                      <MorphSelectItem key={item.id} value={String(item.id)}>{item.nama}</MorphSelectItem>
                    ))}
                  </MorphSelectContent>
                </MorphSelect>
              </label>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Hari jadwal">
              {DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={day === key}
                  onClick={() => setDay(key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                    day === key
                      ? "bg-primary text-surface"
                      : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
              <div className="border-b border-surface-container bg-primary px-space-md py-space-sm text-surface">
                <h3 className="font-title-md text-title-md font-bold">
                  Jadwal {selectedClass?.nama} · {DAYS.find((item) => item.key === day)?.label}
                </h3>
              </div>
              {daySchedules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left">
                    <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th scope="col" className="px-4 py-3">Waktu</th>
                        <th scope="col" className="px-4 py-3">Mata pelajaran</th>
                        <th scope="col" className="px-4 py-3">Guru pengampu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySchedules.map((row) => (
                        <tr key={row.id} className="border-t border-surface-container">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-primary">
                            {row.jamMulai}–{row.jamSelesai}
                          </td>
                          <td className="px-4 py-3 font-bold text-on-surface">{row.mapel}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{row.guru || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                  Belum ada jadwal untuk kelas dan hari ini.
                </p>
              )}
            </section>
          </>
        ) : (
          <p
            className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg font-body-md text-on-surface-variant"
            role="status"
          >
            {error ? `Jadwal belum dapat dimuat: ${error}` : "Belum ada kelas atau jadwal pembelajaran."}
          </p>
        )}
      </div>
    </section>
  );
}
