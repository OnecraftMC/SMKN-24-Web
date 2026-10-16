"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { PengumumanDTO } from "@/lib/admin/types";
import { todayIso } from "@/lib/admin/format";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";
import CategoryField from "@/components/admin/ui/CategoryField";
import AiWriterPanel, { type PengumumanDraft } from "@/components/admin/ui/AiWriterPanel";
import MorphSelect, {
  MorphSelectTrigger,
  MorphSelectValue,
  MorphSelectContent,
  MorphSelectItem,
} from "@/components/ui/select-morph";

export type PengumumanFormValues = {
  judul: string;
  tanggal: string;
  kategori: string;
  isi: string;
  penting: boolean;
  tampilBeranda: boolean;
  badge: string;
  status: string;
  linkLabel: string;
  linkHref: string;
  icon: string;
  actionIcon: string;
  variant: string;
  gambar: string | null;
};

export function newPengumumanForm(): PengumumanFormValues {
  return {
    judul: "",
    tanggal: todayIso(),
    kategori: "",
    isi: "",
    penting: false,
    tampilBeranda: true,
    badge: "",
    status: "",
    linkLabel: "",
    linkHref: "",
    icon: "campaign",
    actionIcon: "arrow_forward",
    variant: "default",
    gambar: null,
  };
}

function formFromRow(row: PengumumanDTO): PengumumanFormValues {
  return {
    judul: row.judul,
    tanggal: row.tanggalIso ?? row.tanggal,
    kategori: row.kategori,
    isi: row.isi ?? "",
    penting: row.penting,
    tampilBeranda: row.tampilBeranda ?? false,
    badge: row.badge ?? "",
    status: row.status ?? "",
    linkLabel: row.linkLabel ?? "",
    linkHref: row.linkHref ?? "",
    icon: row.icon ?? "",
    actionIcon: row.actionIcon ?? "",
    variant: row.variant ?? "default",
    gambar: row.gambar,
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const ICON_OPTIONS = ["campaign", "notifications", "event", "info", "school", "calendar_today", "groups", "menu_book", "arrow_forward", "arrow_outward", "open_in_new", "chevron_right"];

export default function PengumumanDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: PengumumanDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<PengumumanFormValues>(() =>
    editing ? formFromRow(editing) : newPengumumanForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof PengumumanFormValues>(
    key: K,
    value: PengumumanFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (form.judul.trim() === "") return "Judul wajib diisi.";
    if (form.kategori.trim() === "") return "Kategori wajib diisi.";
    if (!ISO_DATE.test(form.tanggal)) return "Tanggal wajib diisi (format YYYY-MM-DD).";
    if (form.linkLabel.trim() !== "" && form.linkHref.trim() === "") {
      return "Isi tautan (href) bila label tautan diisi.";
    }
    if (form.linkHref.trim() !== "" && form.linkLabel.trim() === "") {
      return "Isi label tautan bila href diisi.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        tanggal: form.tanggal,
        kategori: form.kategori.trim(),
        isi: form.isi,
        penting: form.penting,
        tampilBeranda: form.tampilBeranda,
        gambar: form.gambar,
        badge: form.badge.trim() || null,
        status: form.status.trim() || null,
        linkLabel: form.linkLabel.trim() || null,
        linkHref: form.linkHref.trim() || null,
        icon: form.icon.trim() || null,
        actionIcon: form.actionIcon.trim() || null,
        variant: form.variant.trim() || null,
      };

      if (editing) {
        await apiRequest(`/api/pengumuman/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/pengumuman/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengumuman.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit Pengumuman" : "Tambah Pengumuman"}
      description="Field badge, status, ikon, dan varian dipakai papan informasi beranda."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhostClass} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="pengumuman-form"
            className={buttonPrimaryClass}
            disabled={saving}
          >
            {saving ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" />
            )}
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </>
      }
    >
      <form id="pengumuman-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
          <h2 className="mb-space-sm font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Pratinjau kartu beranda
          </h2>
          <div
            className={`max-w-xl rounded-2xl border p-space-md ${
              form.variant === "secondary"
                ? "border-secondary-container/20 bg-secondary-container/15"
                : "border-surface-container bg-surface-container-low"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-surface ${
                  form.variant === "secondary" ? "bg-secondary" : "bg-primary"
                }`}
              >
                {form.badge.trim() || form.kategori || "Pengumuman"}
              </span>
              <span className="flex items-center gap-2">
                {form.status.trim() && (
                  <span className="font-label-sm text-label-sm font-bold text-secondary">
                    {form.status}
                  </span>
                )}
                {form.penting && (
                  <span className="font-label-sm text-label-sm font-bold text-error">
                    Penting (perlu tindak lanjut)
                  </span>
                )}
                {form.tanggal < todayIso() && (
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                    Sudah lewat
                  </span>
                )}
              </span>
            </div>
            <p className="font-title-md text-title-md font-bold text-primary">
              {form.judul.trim() || "Judul pengumuman"}
            </p>
            {form.isi.trim() && (
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {form.isi}
              </p>
            )}
            {form.linkLabel.trim() && form.linkHref.trim() && (
              <p className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm font-bold text-secondary">
                {form.linkLabel}
                {form.icon && (
                  <span className="material-symbols-outlined text-base leading-none">{form.icon}</span>
                )}
                {form.actionIcon && (
                  <span className="material-symbols-outlined text-base leading-none">{form.actionIcon}</span>
                )}
              </p>
            )}
          </div>
        </section>

        <AiWriterPanel<PengumumanDraft>
          module="pengumuman"
          label="pengumuman"
          disabled={saving}
          onUnauthorized={onUnauthorized}
          onApply={(draf) => {
            // Tanggal, tautan (linkLabel/linkHref), ikon, dan checkbox TIDAK
            // diisi AI: semuanya keputusan faktual admin.
            setForm((prev) => ({
              ...prev,
              judul: draf.judul || prev.judul,
              isi: draf.isi || prev.isi,
              badge: draf.badge || prev.badge,
              status: draf.status || prev.status,
            }));
          }}
        />

        <Field htmlFor="peng-judul" label="Judul">
          <input
            id="peng-judul"
            className={fieldClass}
            value={form.judul}
            onChange={(e) => update("judul", e.target.value)}
            maxLength={255}
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <CategoryField
            module="pengumuman"
            value={form.kategori}
            onChange={(kategori) => update("kategori", kategori ?? "")}
            onUnauthorized={onUnauthorized}
            required
          />
          <Field htmlFor="peng-tanggal" label="Tanggal">
            <input
              id="peng-tanggal"
              type="date"
              className={fieldClass}
              value={form.tanggal.slice(0, 10)}
              onChange={(e) => update("tanggal", e.target.value)}
            />
          </Field>
        </div>

        <Field htmlFor="peng-isi" label="Isi pengumuman">
          <textarea
            id="peng-isi"
            rows={4}
            className={fieldClass}
            value={form.isi}
            onChange={(e) => update("isi", e.target.value)}
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="peng-badge" label="Badge kartu" hint='Contoh: "SPMB 2026"'>
            <input
              id="peng-badge"
              className={fieldClass}
              value={form.badge}
              onChange={(e) => update("badge", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field htmlFor="peng-status" label="Label status" hint='Contoh: "Mendesak"'>
            <input
              id="peng-status"
              className={fieldClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              maxLength={50}
            />
          </Field>
        </div>

        <Field htmlFor="peng-variant" label="Varian kartu" hint='"secondary" = warna emas.'>
          <MorphSelect
            value={form.variant}
            onValueChange={(value) => update("variant", value)}
            className="w-full"
          >
            <MorphSelectTrigger className={fieldClass}>
              <MorphSelectValue placeholder="Varian kartu" />
            </MorphSelectTrigger>
            <MorphSelectContent>
              <MorphSelectItem value="default">default</MorphSelectItem>
              <MorphSelectItem value="secondary">secondary</MorphSelectItem>
            </MorphSelectContent>
          </MorphSelect>
        </Field>

        <Field htmlFor="peng-icon" label="Ikon">
          <MorphSelect
            value={form.icon}
            onValueChange={(value) => update("icon", value)}
            className="w-full"
          >
            <MorphSelectTrigger className={fieldClass}>
              <MorphSelectValue placeholder="Ikon" />
            </MorphSelectTrigger>
            <MorphSelectContent>
              <MorphSelectItem value="">Tanpa ikon</MorphSelectItem>
              {ICON_OPTIONS.map((icon) => (
                <MorphSelectItem key={icon} value={icon}>
                  {icon}
                </MorphSelectItem>
              ))}
            </MorphSelectContent>
          </MorphSelect>
        </Field>
        <Field htmlFor="peng-action-icon" label="Ikon aksi">
          <MorphSelect
            value={form.actionIcon}
            onValueChange={(value) => update("actionIcon", value)}
            className="w-full"
          >
            <MorphSelectTrigger className={fieldClass}>
              <MorphSelectValue placeholder="Ikon aksi" />
            </MorphSelectTrigger>
            <MorphSelectContent>
              <MorphSelectItem value="">Tanpa ikon</MorphSelectItem>
              {ICON_OPTIONS.map((icon) => (
                <MorphSelectItem key={icon} value={icon}>
                  {icon}
                </MorphSelectItem>
              ))}
            </MorphSelectContent>
          </MorphSelect>
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="peng-link-label" label="Label tautan">
            <input
              id="peng-link-label"
              className={fieldClass}
              value={form.linkLabel}
              onChange={(e) => update("linkLabel", e.target.value)}
              placeholder="Lihat Kisi-kisi Ujian"
              maxLength={150}
            />
          </Field>
          <Field htmlFor="peng-link-href" label="Tautan (URL)">
            <input
              id="peng-link-href"
              className={fieldClass}
              value={form.linkHref}
              onChange={(e) => update("linkHref", e.target.value)}
              placeholder="https://spmb.jakarta.go.id"
              maxLength={255}
            />
          </Field>
        </div>

        <ImageField
          value={form.gambar}
          onChange={(path) => update("gambar", path)}
          label="Gambar pendukung (opsional)"
        />

        <div className="flex flex-wrap gap-space-lg">
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
            <input
              type="checkbox"
              checked={form.penting}
              onChange={(e) => update("penting", e.target.checked)}
            />
            Tandai penting (perlu tindak lanjut)
          </label>
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
            <input
              type="checkbox"
              checked={form.tampilBeranda}
              onChange={(e) => update("tampilBeranda", e.target.checked)}
            />
            Tampilkan di papan informasi beranda
          </label>
        </div>
      </form>
    </Modal>
  );
}
