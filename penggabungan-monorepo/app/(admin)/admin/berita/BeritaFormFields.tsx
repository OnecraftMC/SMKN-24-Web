"use client";

import { Loader2, Save } from "lucide-react";
import type { BeritaStatus } from "@/lib/admin/types";
import {
  CheckField,
  Field,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";
import CategoryField from "@/components/admin/ui/CategoryField";
import AiWriterPanel, { type BeritaDraft } from "@/components/admin/ui/AiWriterPanel";
import RichTextEditor from "@/components/admin/berita/RichTextEditor";
import MorphSelect, {
  MorphSelectTrigger,
  MorphSelectValue,
  MorphSelectContent,
  MorphSelectItem,
} from "@/components/ui/select-morph";
import { UniversalDatePicker } from "@/components/ui/universal-date-picker";
import type { BeritaFormValues } from "./useBeritaForm";

export type BeritaUpdate = <K extends keyof BeritaFormValues>(
  key: K,
  value: BeritaFormValues[K],
) => void;

/** Field form berita (dipisah agar file tampilan tetap kecil). */
export function BeritaFormFields({
  form,
  saving,
  editing,
  onUpdate,
  onApplyDraft,
  onUnauthorized,
  onSubmit,
  onCancel,
}: {
  form: BeritaFormValues;
  saving: boolean;
  editing: boolean;
  onUpdate: BeritaUpdate;
  onApplyDraft: (draf: BeritaDraft) => void;
  onUnauthorized: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-space-lg">
      <AiWriterPanel<BeritaDraft>
        module="berita"
        label="berita"
        disabled={saving}
        onUnauthorized={onUnauthorized}
        onApply={onApplyDraft}
      />

      <Field htmlFor="berita-judul" label="Judul" required>
        <input
          id="berita-judul"
          className={fieldClass}
          value={form.judul}
          onChange={(e) => onUpdate("judul", e.target.value)}
          maxLength={255}
        />
      </Field>

      <div className="grid gap-space-md sm:grid-cols-2">
        <CategoryField
          module="berita"
          value={form.kategori}
          onChange={(kategori) => onUpdate("kategori", kategori ?? "")}
          onUnauthorized={onUnauthorized}
          required
        />

        <Field htmlFor="berita-tanggal" label="Tanggal" required>
          <UniversalDatePicker
            id="berita-tanggal"
            value={form.tanggal.slice(0, 10)}
            onChange={(val) => onUpdate("tanggal", val)}
            placeholder="Pilih tanggal rilis"
            triggerClassName="rounded-xl border-outline-variant bg-surface"
          />
        </Field>
      </div>

      <div className="grid gap-space-md sm:grid-cols-2">
        <Field htmlFor="berita-status" label="Status">
          <MorphSelect
            value={form.status}
            onValueChange={(value) => onUpdate("status", value as BeritaStatus)}
            className="w-full"
          >
            <MorphSelectTrigger className={fieldClass}>
              <MorphSelectValue />
            </MorphSelectTrigger>
            <MorphSelectContent>
              <MorphSelectItem value="draft">Draft</MorphSelectItem>
              <MorphSelectItem value="terbit">Terbit</MorphSelectItem>
            </MorphSelectContent>
          </MorphSelect>
        </Field>

        <div className="flex items-end pb-2">
          <CheckField
            id="berita-utama"
            checked={form.utama}
            onChange={(checked) => onUpdate("utama", checked)}
          >
            Jadikan berita utama (highlight)
          </CheckField>
        </div>
      </div>

      <ImageField value={form.gambar} onChange={(path) => onUpdate("gambar", path)} />

      <Field htmlFor="berita-ringkasan" label="Ringkasan">
        <textarea
          id="berita-ringkasan"
          rows={3}
          className={fieldClass}
          value={form.ringkasan}
          onChange={(e) => onUpdate("ringkasan", e.target.value)}
        />
      </Field>

      <div>
        <label className="mb-1 block font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
          Isi berita
        </label>
        <RichTextEditor value={form.isi} onChange={(html) => onUpdate("isi", html)} disabled={saving} />
      </div>

      <div className="flex flex-wrap justify-end gap-space-sm">
        <button type="button" className={buttonGhostClass} disabled={saving} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className={buttonPrimaryClass} disabled={saving}>
          {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          <Save aria-hidden className="h-4 w-4" />
          {saving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Terbitkan berita"}
        </button>
      </div>
    </form>
  );
}
