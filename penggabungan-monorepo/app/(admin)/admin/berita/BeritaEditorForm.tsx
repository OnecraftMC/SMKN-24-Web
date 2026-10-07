"use client";

import { ArrowLeft, Eye, Pencil, TriangleAlert } from "lucide-react";
import type { BeritaDTO } from "@/lib/admin/types";
import { buttonGhostClass } from "@/components/admin/ui/FormBits";
import { useBeritaForm } from "./useBeritaForm";
import { BeritaFormFields } from "./BeritaFormFields";

/**
 * Form berita halaman penuh (dipakai /admin/berita/baru dan /admin/berita/[id]).
 */
export default function BeritaEditorForm({
  editing,
  onUnauthorized,
}: {
  editing: BeritaDTO | null;
  onUnauthorized: () => void;
}) {
  const { form, update, applyDraft, error, saving, preview, setPreview, handleSubmit, router } =
    useBeritaForm({ editing, onUnauthorized });

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-wrap items-center gap-space-sm">
        <button type="button" className={buttonGhostClass} onClick={() => router.push("/admin/berita")}>
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Kembali ke daftar
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            className={buttonGhostClass}
            aria-pressed={preview}
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? <Pencil aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
            {preview ? "Kembali mengedit" : "Pratinjau"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
        >
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {preview ? (
        <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg">
          <p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Pratinjau
          </p>
          <h1 className="mt-2 font-headline-md text-headline-md font-bold text-primary">
            {form.judul || "(Belum ada judul)"}
          </h1>
          {form.ringkasan && (
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{form.ringkasan}</p>
          )}
          <div
            className="prose-berita mt-space-md border-t border-surface-container pt-space-md"
            // Isi sudah disanitasi backend saat simpan; pratinjau memakai nilai
            // form lokal milik admin yang sedang mengedit (bukan data publik).
            dangerouslySetInnerHTML={{ __html: form.isi || "<p>(Belum ada isi.)</p>" }}
          />
        </article>
      ) : (
        <BeritaFormFields
          form={form}
          saving={saving}
          editing={!!editing}
          onUpdate={update}
          onApplyDraft={applyDraft}
          onUnauthorized={onUnauthorized}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/berita")}
        />
      )}
    </div>
  );
}
