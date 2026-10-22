"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, apiUpload, isUnauthorized } from "@/lib/admin/api";
import { formatDateId } from "@/lib/admin/format";
import type {
  KnowledgeDTO,
  KnowledgeEntri,
  KnowledgeImportResponse,
  KnowledgeKategori,
  KnowledgeListResponse,
  KnowledgePreviewResponse,
} from "@/lib/admin/types";
import Badge from "@/components/ui/Badge";
import {
  ConfirmDialog,
  Field,
  ListState,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

const KATEGORI: KnowledgeKategori[] = ["PPDB", "Jurusan", "Jadwal", "Fasilitas", "Umum"];

/** Pill kategori: satu warna per kelompok pengetahuan. */
const VARIANT_KATEGORI: Record<KnowledgeKategori, "infoSoft" | "secondary" | "primary" | "success" | "neutral"> = {
  PPDB: "infoSoft",
  Jurusan: "secondary",
  Jadwal: "primary",
  Fasilitas: "success",
  Umum: "neutral",
};

const FORMAT_TERIMA = [".md", ".txt", ".csv", ".docx", ".xlsx"];
const MAX_FILE = 8 * 1024 * 1024; // harus sama dengan batas endpoint (8 MB).

export default function DatasetChatbotPage() {
  const { logout } = useAuth();

  // ------------------------------------------------------------------ daftar
  const [rows, setRows] = useState<KnowledgeDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((nilai) => nilai + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<KnowledgeListResponse>("/api/knowledge/index.php")
      .then((data) => {
        if (cancelled) return;
        setRows(data.entri ?? []);
        setTotal(data.total ?? 0);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat memori chatbot.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  // Pengelolaan tetap lokal (list dibatasi 200 entri oleh backend).
  const visibleRows = useMemo(() => {
    const kata = query.trim().toLowerCase();
    if (kata === "") return rows;
    return rows.filter(
      (row) =>
        row.judul.toLowerCase().includes(kata) ||
        row.potongan?.toLowerCase().includes(kata) ||
        row.tags.toLowerCase().includes(kata),
    );
  }, [rows, query]);

  // ------------------------------------------------------------------- unggah
  const [file, setFile] = useState<File | null>(null);
  const [dragAktif, setDragAktif] = useState(false);
  const [analisis, setAnalisis] = useState<KnowledgePreviewResponse | null>(null);
  const [analisisBusy, setAnalisisBusy] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [hasilImport, setHasilImport] = useState<KnowledgeImportResponse | null>(null);

  const pilihFile = useCallback(
    (target: File | null) => {
      setHasilImport(null);
      setImportError(null);
      setAnalisis(null);
      setAnalisisError(null);
      if (!target) {
        setFile(null);
        return;
      }
      const ekstensi = `.${(target.name.split(".").pop() ?? "").toLowerCase()}`;
      if (!FORMAT_TERIMA.includes(ekstensi)) {
        setFile(null);
        setAnalisisError(`Format .${ekstensi} tidak didukung. Gunakan ${FORMAT_TERIMA.join(" ")}.`);
        return;
      }
      if (target.size > MAX_FILE) {
        setFile(null);
        setAnalisisError("Ukuran file melebihi 8 MB.");
        return;
      }
      setFile(target);
    },
    [],
  );

  /** Parse + validasi di backend, TIDAK menulis ke database (?preview=1). */
  const jalankanAnalisis = useCallback(
    async (target: File) => {
      setAnalisisBusy(true);
      setAnalisisError(null);
      setAnalisis(null);
      try {
        const form = new FormData();
        form.append("file", target);
        const data = await apiUpload<KnowledgePreviewResponse>(
          "/api/knowledge/index.php?preview=1",
          form,
        );
        setAnalisis(data);
      } catch (err: unknown) {
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setAnalisisError(err instanceof Error ? err.message : "Gagal membaca file.");
      } finally {
        setAnalisisBusy(false);
      }
    },
    [logout],
  );

  /** Commit: tulis baris valid ke tabel knowledge (memori chatbot). */
  async function simpanImport() {
    if (!file) return;
    setImportBusy(true);
    setImportError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiUpload<KnowledgeImportResponse>("/api/knowledge/index.php", form);
      setHasilImport(data);
      setFile(null);
      setAnalisis(null);
      reload();
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setImportError(err instanceof Error ? err.message : "Gagal menyimpan dataset.");
    } finally {
      setImportBusy(false);
    }
  }

  // ----------------------------------------------------------------- ubah/hapus
  const [editing, setEditing] = useState<KnowledgeEntri | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function bukaEdit(row: KnowledgeDTO) {
    setEditError(null);
    setEditing({ ...row, konten: "" }); // placeholder — konten penuh menyusul.
    setEditBusy(true);
    try {
      const data = await apiRequest<{ entri: KnowledgeEntri }>(
        `/api/knowledge/index.php?id=${row.id}`,
      );
      setEditing(data.entri);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setEditing(null);
      setEditError(err instanceof Error ? err.message : "Gagal membuka entri.");
    } finally {
      setEditBusy(false);
    }
  }

  async function simpanEdit() {
    if (!editing) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await apiRequest(`/api/knowledge/index.php`, {
        method: "PUT",
        body: {
          id: editing.id,
          judul: editing.judul,
          kategori: editing.kategori,
          konten: editing.konten,
          tags: editing.tags,
          sumber: editing.sumber,
        },
      });
      setEditing(null);
      reload();
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setEditBusy(false);
    }
  }

  const [deleting, setDeleting] = useState<KnowledgeDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/knowledge/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus entri.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const totalSelebihnya = total > rows.length;

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Memori Chatbot
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Unggah dataset (MD, TXT, CSV, DOCX, XLSX) agar chatbot bisa menjawab
            pertanyaan sekolah dari data yang Anda kelola sendiri.
          </p>
        </div>
        <p className="font-label-sm text-label-sm font-bold text-on-surface-variant">
          {loading ? "Memuat…" : `${total} entri memori`}
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      {/* ------------------------------------------------------------- unggah */}
      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="mb-space-md flex items-center gap-2">
          <Upload aria-hidden className="h-4 w-4 text-secondary" />
          <h2 className="font-title-sm text-title-sm font-bold text-primary">
            Insert Dataset
          </h2>
        </div>
        <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">
          File dibaca, dipilah per dokumen, lalu Anda tinjau dulu di pratinjau
          sebelum memasuknya ke memori. Judul yang sama menggantikan entri lama —
          aman untuk pembaruan berkala.
        </p>

        <label
          htmlFor="dataset-file"
          onDragOver={(event) => {
            event.preventDefault();
            setDragAktif(true);
          }}
          onDragLeave={() => setDragAktif(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragAktif(false);
            const target = event.dataTransfer.files[0] ?? null;
            pilihFile(target);
            if (target) void jalankanAnalisis(target);
          }}
          className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-space-md py-space-md text-center transition-colors ${
            dragAktif
              ? "border-primary bg-primary/5"
              : "border-outline-variant hover:border-primary/50 hover:bg-surface-container/50"
          }`}
        >
          <FileUp aria-hidden className="h-5 w-5 text-on-surface-variant" />
          <span className="font-label-md text-label-md font-bold text-primary">
            Tarik file ke sini atau klik untuk memilih
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            .md .txt .csv .docx .xlsx — maksimal 8 MB
          </span>
          <input
            id="dataset-file"
            type="file"
            accept={FORMAT_TERIMA.join(",")}
            className="sr-only"
            onChange={(event) => {
              const target = event.target.files?.[0] ?? null;
              pilihFile(target);
              if (target) void jalankanAnalisis(target);
              // Reset agar memilih file yang sama dua kali tetap memicu onChange.
              event.target.value = "";
            }}
          />
        </label>

        {file && (
          <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm rounded-lg border border-surface-container bg-surface-container-low px-space-md py-space-sm">
            <span className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <FileUp aria-hidden className="h-4 w-4 shrink-0 text-on-surface-variant" />
              <span className="font-bold">{file.name}</span>
              <span className="text-on-surface-variant">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </span>
            <div className="flex items-center gap-space-sm">
              {analisisBusy && (
                <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Membaca file…
                </span>
              )}
              <button
                type="button"
                onClick={() => pilihFile(null)}
                className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"
                aria-label={`Hapus ${file.name} dari pilihan`}
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {analisisError && (
          <p
            role="alert"
            className="mt-space-md rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            {analisisError}
          </p>
        )}

        {analisis && (
          <div className="mt-space-md space-y-space-md rounded-xl border border-surface-container bg-surface-container-low p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <h3 className="font-title-sm text-title-sm font-bold text-primary">
                Pratinjau — {analisis.valid.length} dokumen siap dimasukkan
              </h3>
              <div className="flex flex-wrap items-center gap-space-sm">
                <button
                  type="button"
                  className={buttonGhostClass}
                  onClick={() => {
                    setAnalisis(null);
                    setFile(null);
                  }}
                  disabled={importBusy}
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={simpanImport}
                  disabled={importBusy || analisis.valid.length === 0}
                >
                  {importBusy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                  Simpan ke memori chatbot
                </button>
              </div>
            </div>

            {analisis.gagal.length > 0 && (
              <ul
                role="note"
                aria-label="Catatan pembacaan"
                className="list-inside list-disc space-y-1 rounded-lg bg-secondary-container/40 px-space-md py-space-sm font-body-sm text-body-sm text-on-secondary-container"
              >
                {analisis.gagal.slice(0, 8).map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
                {analisis.gagal.length > 8 && (
                  <li>…dan {analisis.gagal.length - 8} catatan lainnya</li>
                )}
              </ul>
            )}

            <ul className="divide-y divide-surface-container overflow-hidden rounded-lg border border-surface-container bg-surface-container-lowest">
              {analisis.valid.map((row, i) => (
                <li key={`${row.judul}-${i}`} className="flex flex-col gap-1 px-space-md py-space-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-body-sm text-body-sm font-bold text-primary">
                      {row.judul}
                    </span>
                    <Badge label={row.kategori} variant={VARIANT_KATEGORI[row.kategori]} />
                  </div>
                  <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                    {row.potongan}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {importError && (
          <p
            role="alert"
            className="mt-space-md rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            {importError}
          </p>
        )}

        {hasilImport && (
          <p
            role="status"
            className="mt-space-md rounded-lg bg-secondary-container/60 px-space-md py-space-sm font-body-sm text-body-sm text-on-secondary-container"
          >
            <strong className="font-bold">{hasilImport.file}</strong>: tersimpan{" "}
            {hasilImport.tersimpan} ({hasilImport.baru} baru,{" "}
            {hasilImport.diperbarui} diperbarui). Chatbot sudah bisa membacanya.
          </p>
        )}
      </section>

      {/* -------------------------------------------------------------- daftar */}
      <div className="min-w-[16rem] max-w-md">
        <label htmlFor="dataset-cari" className="sr-only">
          Cari memori chatbot
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            id="dataset-cari"
            className={`${fieldClass} pl-9`}
            placeholder="Cari judul, isi, atau tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {totalSelebihnya && !loading && (
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Menampilkan {rows.length} entri terbaru dari total {total}.
          </p>
        )}
      </div>

      <ListState
        loading={loading}
        error={rows.length === 0 ? error : null}
        empty={visibleRows.length === 0}
        emptyLabel={
          rows.length === 0
            ? "Memori masih kosong. Unggah dataset pertama di atas."
            : "Tidak ada entri yang cocok dengan pencarian."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[44rem] text-left font-body-sm text-body-sm">
            <caption className="sr-only">Daftar memori chatbot</caption>
            <thead className="bg-surface-container-low">
              <tr>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Pengetahuan
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Kategori
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Diperbarui
                </th>
                <th scope="col" className="px-space-md py-space-sm text-right font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-t border-surface-container">
                  <td className="max-w-sm px-space-md py-space-sm">
                    <p className="font-bold text-primary">{row.judul}</p>
                    {row.potongan && (
                      <p className="mt-0.5 line-clamp-2 text-on-surface-variant">{row.potongan}</p>
                    )}
                    {(row.tags || row.sumber) && (
                      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                        {row.tags && <span>Tags: {row.tags}</span>}
                        {row.tags && row.sumber && <span aria-hidden="true"> · </span>}
                        {row.sumber && <span>Sumber: {row.sumber}</span>}
                      </p>
                    )}
                  </td>
                  <td className="px-space-md py-space-sm">
                    <Badge label={row.kategori} variant={VARIANT_KATEGORI[row.kategori]} />
                  </td>
                  <td className="whitespace-nowrap px-space-md py-space-sm text-on-surface-variant">
                    {row.updated_at ? formatDateId(row.updated_at) : "—"}
                  </td>
                  <td className="px-space-md py-space-sm text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => bukaEdit(row)}
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        aria-label={`Edit ${row.judul}`}
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(row)}
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error"
                        aria-label={`Hapus ${row.judul}`}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editError && (
        <p
          role="alert"
          className="rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
        >
          {editError}
        </p>
      )}

      {/* ----------------------------------------------------------- dialog edit */}
      {editing && (
        <Modal
          title="Edit memori"
          description="Perubahan langsung dibaca chatbot pada percakapan berikutnya."
          onClose={() => setEditing(null)}
          footer={
            <>
              <button
                type="button"
                className={buttonGhostClass}
                onClick={() => setEditing(null)}
                disabled={editBusy}
              >
                Batal
              </button>
              <button
                type="button"
                className={buttonPrimaryClass}
                onClick={simpanEdit}
                disabled={editBusy}
              >
                {editBusy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                Simpan perubahan
              </button>
            </>
          }
        >
          <div className="space-y-space-md">
            <Field htmlFor="dataset-judul" label="Judul" required>
              <input
                id="dataset-judul"
                className={fieldClass}
                value={editing.judul}
                onChange={(e) => setEditing({ ...editing, judul: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field htmlFor="dataset-kategori" label="Kategori" required>
                <select
                  id="dataset-kategori"
                  className={fieldClass}
                  value={editing.kategori}
                  onChange={(e) =>
                    setEditing({ ...editing, kategori: e.target.value as KnowledgeKategori })
                  }
                >
                  {KATEGORI.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="dataset-tags" label="Tags">
                <input
                  id="dataset-tags"
                  className={fieldClass}
                  value={editing.tags}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                />
              </Field>
            </div>
            <Field htmlFor="dataset-sumber" label="Sumber">
              <input
                id="dataset-sumber"
                className={fieldClass}
                value={editing.sumber}
                onChange={(e) => setEditing({ ...editing, sumber: e.target.value })}
              />
            </Field>
            <Field htmlFor="dataset-konten" label="Isi pengetahuan" required>
              <textarea
                id="dataset-konten"
                className={`${fieldClass} min-h-48 resize-y`}
                value={editing.konten}
                onChange={(e) => setEditing({ ...editing, konten: e.target.value })}
                required
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* --------------------------------------------------------- dialog hapus */}
      {deleting && (
        <ConfirmDialog
          title="Hapus memori?"
          description={`"${deleting.judul}" akan dihapus dari memori chatbot.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
