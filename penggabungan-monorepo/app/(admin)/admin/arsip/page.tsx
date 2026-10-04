"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Download, FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiDownload, apiRequest, apiUpload, isUnauthorized } from "@/lib/admin/api";
import type { ArsipDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  Field,
  ListState,
  Modal,
  buttonDangerClass,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import CategoryField from "@/components/admin/ui/CategoryField";

type ArchiveDraft = {
  judul: string;
  deskripsi: string;
  kategori: string;
  aktif: boolean;
};

const emptyDraft: ArchiveDraft = { judul: "", deskripsi: "", kategori: "Akademik", aktif: false };

export default function ArsipAdminPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<ArsipDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArsipDTO | null>(null);
  const [draft, setDraft] = useState<ArchiveDraft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<ArsipDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<ArsipDTO[]>("/api/arsip/index.php?admin=1")
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat arsip.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setFile(null);
    setDialogOpen(true);
  }

  function openEdit(row: ArsipDTO) {
    setEditing(row);
    setDraft({
      judul: row.judul,
      deskripsi: row.deskripsi ?? "",
      kategori: row.kategori,
      aktif: row.aktif,
    });
    setFile(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setError(null);
  }

  async function saveArchive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await apiRequest(`/api/arsip/index.php?id=${editing.id}`, {
          method: "PUT",
          body: draft,
        });
      } else {
        if (!file) {
          setError("Pilih dokumen yang akan diunggah.");
          return;
        }
        const formData = new FormData();
        formData.set("judul", draft.judul);
        formData.set("deskripsi", draft.deskripsi);
        formData.set("kategori", draft.kategori);
        formData.set("aktif", draft.aktif ? "1" : "0");
        formData.set("file", file);
        await apiUpload<{ id: number }>("/api/arsip/index.php", formData);
      }
      setDialogOpen(false);
      reload();
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan arsip.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadArchive(row: ArsipDTO) {
    try {
      const blob = await apiDownload(row.downloadUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = row.namaFile;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal mengunduh dokumen.");
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/arsip/index.php?id=${deleting.id}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => row.id !== deleting.id));
      setDeleting(null);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus arsip.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Pusat Arsip</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kelola dokumen yang dapat diunduh publik. File disimpan di luar web root.
          </p>
        </div>
        <button type="button" className={buttonPrimaryClass} onClick={openCreate}>
          <FilePlus2 aria-hidden className="h-4 w-4" />
          Tambah dokumen
        </button>
      </header>

      {error && !dialogOpen && (
        <p role="alert" className="rounded-xl bg-error-container p-space-md text-on-error-container">
          {error}
        </p>
      )}

      {!error && (
        <ListState
          loading={loading}
          error={null}
          empty={!loading && rows.length === 0}
          emptyLabel="Belum ada dokumen arsip. Tambahkan file resmi untuk menampilkannya."
          onRetry={reload}
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar dokumen pada pusat arsip</caption>
            <thead>
              <tr className="border-b border-surface-container">
                <th scope="col" className="px-space-md py-space-sm">Judul</th>
                <th scope="col" className="px-space-md py-space-sm">Kategori</th>
                <th scope="col" className="px-space-md py-space-sm">File</th>
                <th scope="col" className="px-space-md py-space-sm">Visibilitas</th>
                <th scope="col" className="px-space-md py-space-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-container last:border-0">
                  <th scope="row" className="px-space-md py-space-md font-semibold text-primary">{row.judul}</th>
                  <td className="px-space-md py-space-md">{row.kategori}</td>
                  <td className="px-space-md py-space-md">{row.namaFile}</td>
                  <td className="px-space-md py-space-md">{row.aktif ? "Publik" : "Tersembunyi"}</td>
                  <td className="px-space-md py-space-md">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={buttonGhostClass} onClick={() => void downloadArchive(row)}>
                        <Download aria-hidden className="h-4 w-4" /> Unduh
                      </button>
                      <button type="button" className={buttonGhostClass} onClick={() => openEdit(row)}>
                        <Pencil aria-hidden className="h-4 w-4" /> Edit metadata
                      </button>
                      <button type="button" className={buttonDangerClass} onClick={() => setDeleting(row)}>
                        <Trash2 aria-hidden className="h-4 w-4" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <Modal
          title={editing ? "Edit metadata arsip" : "Tambah dokumen arsip"}
          description={editing ? `File saat ini: ${editing.namaFile}` : "PDF, DOCX, JPG, atau PNG; maksimal 10 MB."}
          onClose={closeDialog}
          footer={
            <>
              <button type="button" className={buttonGhostClass} onClick={closeDialog} disabled={busy}>
                Batal
              </button>
              <button type="submit" form="archive-form" className={buttonPrimaryClass} disabled={busy}>
                {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                Simpan
              </button>
            </>
          }
        >
          <form id="archive-form" onSubmit={saveArchive} className="space-y-space-md">
            <Field htmlFor="archive-title" label="Judul">
              <input
                id="archive-title"
                value={draft.judul}
                maxLength={255}
                required
                onChange={(event) => setDraft((value) => ({ ...value, judul: event.target.value }))}
                className={fieldClass}
              />
            </Field>
            <CategoryField
              module="arsip"
              value={draft.kategori}
              onChange={(kategori) => setDraft((value) => ({ ...value, kategori: kategori ?? "" }))}
              onUnauthorized={logout}
              required
            />
            <Field htmlFor="archive-description" label="Deskripsi" hint="Maksimal 5.000 karakter.">
              <textarea
                id="archive-description"
                value={draft.deskripsi}
                maxLength={5000}
                rows={3}
                onChange={(event) => setDraft((value) => ({ ...value, deskripsi: event.target.value }))}
                className={fieldClass}
              />
            </Field>
            {!editing && (
              <Field htmlFor="archive-file" label="File dokumen">
                <input
                  id="archive-file"
                  type="file"
                  required
                  accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  onChange={(event) => {
                    const selected = event.currentTarget.files?.[0] ?? null;
                    if (selected && selected.size > 10 * 1024 * 1024) {
                      event.currentTarget.value = "";
                      setFile(null);
                      setError("Ukuran dokumen maksimal 10 MB.");
                      return;
                    }
                    setFile(selected);
                    setError(null);
                  }}
                  className={fieldClass}
                />
              </Field>
            )}
            <label className="flex items-start gap-3 rounded-lg bg-surface-container-low p-space-md">
              <input
                type="checkbox"
                checked={draft.aktif}
                onChange={(event) => setDraft((value) => ({ ...value, aktif: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm">Tampilkan dan izinkan unduhan publik.</span>
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-error-container p-space-sm text-on-error-container">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus dokumen arsip?"
          description={`"${deleting.judul}" beserta file-nya akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
