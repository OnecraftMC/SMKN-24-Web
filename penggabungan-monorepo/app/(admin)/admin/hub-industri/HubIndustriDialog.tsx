"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { HubIndustriDTO } from "@/lib/admin/types";
import {
  CheckField,
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";

type HubIndustriFormValues = {
  nama: string;
  logo: string | null;
  alamat: string;
  deskripsi: string;
  linkLabel: string;
  linkHref: string;
  urutan: number;
  aktif: boolean;
};

function initialValues(editing: HubIndustriDTO | null): HubIndustriFormValues {
  return editing ? {
    nama: editing.nama,
    logo: editing.logo,
    alamat: editing.alamat,
    deskripsi: editing.deskripsi,
    linkLabel: editing.linkLabel ?? "",
    linkHref: editing.linkHref ?? "",
    urutan: editing.urutan,
    aktif: editing.aktif,
  } : { nama: "", logo: null, alamat: "", deskripsi: "", linkLabel: "", linkHref: "", urutan: 0, aktif: true };
}

export default function HubIndustriDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: HubIndustriDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState(() => initialValues(editing));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof HubIndustriFormValues>(key: K, value: HubIndustriFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nama.trim() || !form.alamat.trim() || !form.deskripsi.trim()) {
      setError("Nama mitra, alamat, dan deskripsi kerja sama wajib diisi.");
      return;
    }
    if (Boolean(form.linkLabel.trim()) !== Boolean(form.linkHref.trim())) {
      setError("Isi label dan tautan aksi sekaligus, atau kosongkan keduanya.");
      return;
    }

    setError(null);
    setSaving(true);
    const payload = {
      nama: form.nama.trim(),
      logo: form.logo,
      alamat: form.alamat.trim(),
      deskripsi: form.deskripsi.trim(),
      linkLabel: form.linkLabel.trim() || null,
      linkHref: form.linkHref.trim() || null,
      urutan: form.urutan,
      aktif: form.aktif,
    };

    try {
      if (editing) {
        await apiRequest(`/api/hub-industri/index.php?id=${editing.id}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/api/hub-industri/index.php", { method: "POST", body: payload });
      }
      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan data mitra.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit mitra industri" : "Tambah mitra industri"}
      description="Data yang aktif akan ditampilkan pada Hub Industri di halaman Profil."
      onClose={onClose}
      footer={<>
        <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>Batal</button>
        <button type="submit" form="hub-industri-form" className={buttonPrimaryClass} disabled={saving}>
          {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </>}
    >
      <form id="hub-industri-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm text-sm text-on-error-container"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />{error}</p>}
        <Field htmlFor="hub-industri-nama" label="Nama mitra" required>
          <input id="hub-industri-nama" className={fieldClass} value={form.nama} onChange={(event) => update("nama", event.target.value)} maxLength={255} />
        </Field>
        <ImageField label="Logo industri" value={form.logo} onChange={(value) => update("logo", value)} fit="contain" />
        <Field htmlFor="hub-industri-alamat" label="Alamat lengkap" required>
          <textarea id="hub-industri-alamat" rows={2} className={fieldClass} value={form.alamat} onChange={(event) => update("alamat", event.target.value)} maxLength={5000} />
        </Field>
        <Field htmlFor="hub-industri-deskripsi" label="Deskripsi kerja sama" required>
          <textarea id="hub-industri-deskripsi" rows={4} className={fieldClass} value={form.deskripsi} onChange={(event) => update("deskripsi", event.target.value)} maxLength={10000} />
        </Field>
        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="hub-industri-link-label" label="Label aksi (opsional)">
            <input id="hub-industri-link-label" className={fieldClass} placeholder="Kunjungi situs" value={form.linkLabel} onChange={(event) => update("linkLabel", event.target.value)} maxLength={120} />
          </Field>
          <Field htmlFor="hub-industri-link-href" label="Tautan aksi (opsional)">
            <input id="hub-industri-link-href" className={fieldClass} placeholder="https://… / mailto:… / tel:…" value={form.linkHref} onChange={(event) => update("linkHref", event.target.value)} maxLength={500} />
          </Field>
        </div>
        <Field htmlFor="hub-industri-urutan" label="Urutan tampil">
          <input id="hub-industri-urutan" type="number" min={0} step={1} className={fieldClass} value={form.urutan} onChange={(event) => update("urutan", Math.max(0, Number(event.target.value) || 0))} />
        </Field>
        <CheckField id="hub-industri-aktif" checked={form.aktif} onChange={(value) => update("aktif", value)}>
          Tampilkan mitra ini di halaman Profil
        </CheckField>
      </form>
    </Modal>
  );
}
