"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { JadwalDataDTO, JadwalKelasDTO, JadwalRowDTO, JurusanKey } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
} from "@/components/admin/ui/FormBits";
import JadwalSlotDialog from "./JadwalSlotDialog";
import KelasDialog from "./KelasDialog";

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

export default function JadwalPage() {
  const { logout } = useAuth();
  const [data, setData] = useState<JadwalDataDTO>({ classes: [], schedules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [program, setProgram] = useState<JurusanKey>("pplg");
  const [classId, setClassId] = useState<number | null>(null);
  const [day, setDay] = useState<(typeof DAYS)[number]["key"]>("senin");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<JadwalRowDTO | null>(null);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<JadwalKelasDTO | null>(null);
  const [deleting, setDeleting] = useState<JadwalRowDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiRequest<JadwalDataDTO>("/api/jadwal/index.php?admin=1");
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        if (isUnauthorized(loadError)) {
          logout();
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat jadwal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const programClasses = useMemo(
    () => data.classes.filter((item) => item.jurusan === program),
    [data.classes, program],
  );
  const selectedClass = data.classes.find((item) => item.id === classId) ?? programClasses[0] ?? null;
  const scheduleRows = useMemo(
    () =>
      data.schedules
        .filter((row) => row.kelasId === selectedClass?.id && row.hari === day)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
    [data.schedules, day, selectedClass?.id],
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/jadwal/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (deleteRequestError) {
      if (isUnauthorized(deleteRequestError)) {
        logout();
        return;
      }
      setDeleteError(deleteRequestError instanceof Error ? deleteRequestError.message : "Gagal menghapus jadwal.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Jadwal Pembelajaran</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Atur jadwal mingguan per kelas. Setiap perubahan hanya berlaku pada jam pelajaran yang dipilih.
          </p>
        </div>
        <div className="flex flex-wrap gap-space-xs">
          <button
            type="button"
            className={buttonGhostClass}
            onClick={() => {
              setEditingClass(null);
              setClassDialogOpen(true);
            }}
          >
            <Plus aria-hidden className="h-4 w-4" />
            Tambah kelas
          </button>
          <button
            type="button"
            className={buttonPrimaryClass}
            onClick={() => {
              setEditingSchedule(null);
              setScheduleDialogOpen(true);
            }}
            disabled={loading || !selectedClass}
          >
            <Plus aria-hidden className="h-4 w-4" />
            Tambah jam pelajaran
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Program keahlian" className="flex flex-wrap gap-space-xs">
        {PROGRAMS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={program === key}
            onClick={() => {
              setProgram(key);
              setClassId(data.classes.find((item) => item.jurusan === key)?.id ?? null);
            }}
            className={`rounded-lg px-space-md py-2 font-label-md text-label-md font-bold transition-colors ${
              program === key
                ? "bg-primary text-surface"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-space-md">
        <label className="flex min-w-56 flex-col gap-2 font-label-sm text-label-sm font-bold text-on-surface-variant">
          Pilih kelas
          <select
            value={selectedClass?.id ?? ""}
            onChange={(event) => setClassId(Number(event.target.value) || null)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface"
            disabled={programClasses.length === 0}
          >
            {programClasses.length === 0 && <option value="">Belum ada kelas</option>}
            {programClasses.map((item) => (
              <option key={item.id} value={item.id}>{item.nama} · Kelas {item.tingkat}</option>
            ))}
          </select>
        </label>
        {selectedClass && (
          <button
            type="button"
            onClick={() => {
              setEditingClass(selectedClass);
              setClassDialogOpen(true);
            }}
            className={buttonGhostClass}
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Ubah nama kelas
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-space-xs" role="tablist" aria-label="Hari dalam jadwal">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={day === key}
            onClick={() => setDay(key)}
            className={`rounded-lg px-space-md py-2 font-label-md text-label-md font-bold transition-colors ${
              day === key
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && data.classes.length > 0 && (
        <p role="alert" className="rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      )}
      <ListState
        loading={loading}
        error={data.classes.length === 0 ? error : null}
        empty={data.classes.length === 0}
        emptyLabel="Belum ada kelas. Tambahkan kelas sebelum mengatur jadwal."
        onRetry={reload}
      />

      {!loading && data.classes.length > 0 && (
        <section className="space-y-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-space-sm">
            <div>
              <h2 className="font-title-md text-title-md font-bold text-primary">
                {selectedClass?.nama ?? "Pilih kelas"} · {DAYS.find((item) => item.key === day)?.label}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Edit satu baris untuk mengubah jam tersebut tanpa menyentuh jam pelajaran lain.
              </p>
            </div>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
              {scheduleRows.length} jam pelajaran
            </span>
          </div>

          {scheduleRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant p-space-md text-center font-body-sm text-body-sm text-on-surface-variant">
              Belum ada jadwal untuk {selectedClass?.nama} pada hari {DAYS.find((item) => item.key === day)?.label}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left">
                <thead className="bg-primary text-surface">
                  <tr>
                    <th scope="col" className="px-space-md py-space-sm font-label-sm font-bold">Jam pelajaran</th>
                    <th scope="col" className="px-space-md py-space-sm font-label-sm font-bold">Mata pelajaran</th>
                    <th scope="col" className="px-space-md py-space-sm font-label-sm font-bold">Guru</th>
                    <th scope="col" className="px-space-md py-space-sm text-right"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row) => (
                    <tr key={row.id} className="border-t border-surface-container">
                      <td className="whitespace-nowrap px-space-md py-space-sm font-semibold tabular-nums text-primary">
                        {row.jamMulai}–{row.jamSelesai}
                      </td>
                      <td className="px-space-md py-space-sm font-bold text-primary">{row.mapel}</td>
                      <td className="px-space-md py-space-sm text-on-surface-variant">{row.guru || "—"}</td>
                      <td className="px-space-md py-space-sm">
                        <div className="flex justify-end gap-space-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSchedule(row);
                              setScheduleDialogOpen(true);
                            }}
                            className={buttonGhostClass}
                            aria-label={`Edit jadwal ${row.mapel} pukul ${row.jamMulai}`}
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(row);
                            }}
                            className={buttonGhostClass}
                            aria-label={`Hapus jadwal ${row.mapel} pukul ${row.jamMulai}`}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {scheduleDialogOpen && selectedClass && (
        <JadwalSlotDialog
          editing={editingSchedule}
          classId={selectedClass.id}
          className={selectedClass.nama}
          day={day}
          onClose={() => setScheduleDialogOpen(false)}
          onSaved={() => {
            setScheduleDialogOpen(false);
            reload();
          }}
          onUnauthorized={logout}
        />
      )}

      {classDialogOpen && (
        <KelasDialog
          editing={editingClass}
          initialProgram={program}
          onClose={() => setClassDialogOpen(false)}
          onSaved={() => {
            setClassDialogOpen(false);
            reload();
          }}
          onUnauthorized={logout}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus jam pelajaran?"
          description={`${deleting.mapel} (${deleting.jamMulai}–${deleting.jamSelesai}) pada ${selectedClass?.nama}, ${DAYS.find((item) => item.key === day)?.label} akan dihapus.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
