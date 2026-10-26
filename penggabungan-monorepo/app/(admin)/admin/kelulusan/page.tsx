"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { KelulusanDTO } from "@/lib/admin/types";
import {
  CheckField,
  ConfirmDialog,
  Field,
  ListState,
  Modal,
  buttonDangerClass,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

type GraduationDraft = {
  nisn: string;
  namaSiswa: string;
  kelas: string;
  jurusan: string;
  tahunLulus: number;
  status: "Lulus" | "Tidak Lulus";
  aktif: boolean;
};

const emptyDraft = (): GraduationDraft => ({
  nisn: "",
  namaSiswa: "",
  kelas: "",
  jurusan: "",
  tahunLulus: new Date().getFullYear(),
  status: "Lulus",
  aktif: false,
});

export default function KelulusanAdminPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<KelulusanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KelulusanDTO | null>(null);
  const [draft, setDraft] = useState<GraduationDraft>(emptyDraft);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<KelulusanDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setPageError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<KelulusanDTO[]>("/api/kelulusan/index.php?admin=1")
      .then((data) => {
        if (cancelled) return;
        setRows(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(error)) {
          logout();
          return;
        }
        setPageError(error instanceof Error ? error.message : "Gagal memuat data kelulusan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [logout, reloadKey]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft());
    setDialogError(null);
    setDialogOpen(true);
  }

  function openEdit(row: KelulusanDTO) {
    setEditing(row);
    setDraft({
      nisn: row.nisn,
      namaSiswa: row.namaSiswa,
      kelas: row.kelas,
      jurusan: row.jurusan,
      tahunLulus: row.tahunLulus,
      status: row.status,
      aktif: row.aktif,
    });
    setDialogError(null);
    setDialogOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setDialogError(null);
    try {
      await apiRequest(editing
        ? `/api/kelulusan/index.php?id=${editing.id}`
        : "/api/kelulusan/index.php", {
          method: editing ? "PUT" : "POST",
          body: draft,
        });
      setDialogOpen(false);
      reload();
    } catch (error: unknown) {
      if (isUnauthorized(error)) {
        logout();
        return;
      }
      setDialogError(error instanceof Error ? error.message : "Gagal menyimpan data kelulusan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/kelulusan/index.php?id=${deleting.id}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => row.id !== deleting.id));
      setDeleting(null);
    } catch (error: unknown) {
      if (isUnauthorized(error)) {
        logout();
        return;
      }
      setDeleteError(error instanceof Error ? error.message : "Gagal menghapus data kelulusan.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Data Kelulusan</h1>
          <p className="mt-1 max-w-2xl font-body-sm text-body-sm text-on-surface-variant">
            Kelola hasil kelulusan berdasarkan NISN. Data hanya muncul di halaman publik setelah Anda mengaktifkan publikasinya.
          </p>
        </div>
        <button type="button" className={buttonPrimaryClass} onClick={openCreate}>
          <FilePlus2 aria-hidden className="size-4" /> Tambah data
        </button>
      </header>

      <ListState loading={loading} error={pageError} empty={!loading && !pageError && rows.length === 0} emptyLabel="Belum ada data kelulusan. Tambahkan data siswa untuk mulai mengelola hasil." onRetry={reload} />

      {!loading && !pageError && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar hasil kelulusan siswa</caption>
            <thead><tr className="border-b border-surface-container">
              <th scope="col" className="px-space-md py-space-sm">Siswa</th>
              <th scope="col" className="px-space-md py-space-sm">NISN</th>
              <th scope="col" className="px-space-md py-space-sm">Kelas / jurusan</th>
              <th scope="col" className="px-space-md py-space-sm">Tahun</th>
              <th scope="col" className="px-space-md py-space-sm">Hasil</th>
              <th scope="col" className="px-space-md py-space-sm">Publikasi</th>
              <th scope="col" className="px-space-md py-space-sm">Aksi</th>
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id} className="border-b border-surface-container last:border-0">
                <th scope="row" className="px-space-md py-space-md font-semibold text-primary">{row.namaSiswa}</th>
                <td className="px-space-md py-space-md tabular-nums">{row.nisn}</td>
                <td className="px-space-md py-space-md">{row.kelas} · {row.jurusan}</td>
                <td className="px-space-md py-space-md">{row.tahunLulus}</td>
                <td className="px-space-md py-space-md">{row.status}</td>
                <td className="px-space-md py-space-md">{row.aktif ? "Tayang" : "Disimpan"}</td>
                <td className="px-space-md py-space-md"><div className="flex gap-2">
                  <button type="button" className={buttonGhostClass} onClick={() => openEdit(row)}><Pencil aria-hidden className="size-4" /> Edit</button>
                  <button type="button" className={buttonDangerClass} onClick={() => { setDeleteError(null); setDeleting(row); }}><Trash2 aria-hidden className="size-4" /> Hapus</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <Modal
          title={editing ? "Edit data kelulusan" : "Tambah data kelulusan"}
          description="Periksa NISN dan identitas siswa dengan teliti sebelum menerbitkan hasil."
          onClose={() => { if (!busy) setDialogOpen(false); }}
          footer={<>
            <button type="button" className={buttonGhostClass} onClick={() => setDialogOpen(false)} disabled={busy}>Batal</button>
            <button type="submit" form="kelulusan-form" className={buttonPrimaryClass} disabled={busy}>
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Simpan
            </button>
          </>}
        >
          <form id="kelulusan-form" onSubmit={save} className="space-y-space-md">
            <Field htmlFor="kelulusan-nisn" label="NISN" hint="10 digit angka; menjadi kunci pengecekan siswa." required>
              <input id="kelulusan-nisn" value={draft.nisn} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, nisn: event.target.value.replace(/\D/g, "").slice(0, 10) }))} />
            </Field>
            <Field htmlFor="kelulusan-nama" label="Nama siswa" required>
              <input id="kelulusan-nama" value={draft.namaSiswa} maxLength={150} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, namaSiswa: event.target.value }))} />
            </Field>
            <div className="grid gap-space-md sm:grid-cols-2">
              <Field htmlFor="kelulusan-kelas" label="Kelas" required>
                <input id="kelulusan-kelas" value={draft.kelas} maxLength={80} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, kelas: event.target.value }))} />
              </Field>
              <Field htmlFor="kelulusan-jurusan" label="Jurusan" required>
                <input id="kelulusan-jurusan" value={draft.jurusan} maxLength={100} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, jurusan: event.target.value }))} />
              </Field>
            </div>
            <div className="grid gap-space-md sm:grid-cols-2">
              <Field htmlFor="kelulusan-tahun" label="Tahun kelulusan" required>
                <input id="kelulusan-tahun" type="number" min={1950} max={new Date().getFullYear() + 1} value={draft.tahunLulus} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, tahunLulus: Number(event.target.value) }))} />
              </Field>
              <Field htmlFor="kelulusan-status" label="Hasil kelulusan" required>
                <select id="kelulusan-status" value={draft.status} required className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as GraduationDraft["status"] }))}>
                  <option value="Lulus">Lulus</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </Field>
            </div>
            <CheckField id="kelulusan-aktif" checked={draft.aktif} onChange={(aktif) => setDraft((current) => ({ ...current, aktif }))}>
              Terbitkan hasil agar dapat dicek dengan NISN di halaman publik.
            </CheckField>
            {dialogError && <p role="alert" className="rounded-lg bg-error-container p-space-sm text-on-error-container">{dialogError}</p>}
          </form>
        </Modal>
      )}

      {deleting && <ConfirmDialog
        title="Hapus data kelulusan?"
        description={`Data atas nama ${deleting.namaSiswa} dan NISN ${deleting.nisn} akan dihapus.`}
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />}
    </div>
  );
}
