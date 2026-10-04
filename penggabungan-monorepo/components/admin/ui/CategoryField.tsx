"use client";

import { useEffect, useId, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import { fieldClass, labelClass } from "@/components/admin/ui/FormBits";

export type CategoryModule =
  | "agenda"
  | "berita"
  | "pengumuman"
  | "guru"
  | "galeri"
  | "fasilitas"
  | "arsip"
  | "jadwal"
  | "bk"
  | "prestasi";

export default function CategoryField({
  module,
  value,
  onChange,
  onUnauthorized,
  label = "Kategori",
  required = false,
}: {
  module: CategoryModule;
  value: string | null;
  onChange: (category: string | null) => void;
  onUnauthorized: () => void;
  label?: string;
  required?: boolean;
}) {
  const id = useId();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedModule, setLoadedModule] = useState<CategoryModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiRequest<string[]>(`/api/kategori/index.php?module=${module}`)
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
          setLoadedModule(module);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(cause)) {
          onUnauthorized();
          return;
        }
        setError(cause instanceof Error ? cause.message : "Gagal memuat kategori.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [module, onUnauthorized, reloadKey]);

  const loadingCategories = loading || loadedModule !== module;

  async function saveCategory() {
    const name = draft.trim();
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiRequest<{ name: string }>("/api/kategori/index.php", {
        method: "POST",
        body: { module, name },
      });
      setCategories((current) =>
        current.includes(result.name)
          ? current
          : [...current, result.name].sort((a, b) => a.localeCompare(b, "id")),
      );
      onChange(result.name);
      setDraft("");
      setAdding(false);
    } catch (cause: unknown) {
      if (isUnauthorized(cause)) {
        onUnauthorized();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        id={id}
        className={fieldClass}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        required={required}
        disabled={loadingCategories || Boolean(error)}
      >
        <option value="">{loadingCategories ? "Memuat kategori…" : required ? "Pilih kategori" : "Tanpa kategori"}</option>
        {value && !categories.includes(value) && <option value={value}>{value}</option>}
        {categories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      {error ? (
        <div className="space-y-1">
          <p className="text-xs text-error" role="alert">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReloadKey((key) => key + 1);
            }}
            className="text-xs font-semibold text-primary underline"
          >
            Coba muat ulang
          </button>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant">Pilihan tersimpan untuk modul ini dan dapat digunakan kembali.</p>
      )}

      {adding ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <label htmlFor={`${id}-new`} className="sr-only">Nama kategori baru</label>
          <input
            id={`${id}-new`}
            className={`${fieldClass} min-w-40 flex-1`}
            value={draft}
            maxLength={100}
            autoFocus
            placeholder="Nama kategori baru"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveCategory();
              }
              if (event.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => void saveCategory()}
            disabled={!draft.trim() || saving}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            <Check aria-hidden className="h-4 w-4" />
            Simpan
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
            disabled={saving}
            aria-label="Batalkan tambah kategori"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-3 text-on-surface"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={loadingCategories || Boolean(error)}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-surface-container disabled:opacity-50"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Tambah kategori
        </button>
      )}
    </div>
  );
}
