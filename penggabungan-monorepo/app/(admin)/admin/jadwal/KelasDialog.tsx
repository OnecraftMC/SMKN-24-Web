"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { JadwalKelasDTO, JurusanKey } from "@/lib/admin/types";
import MorphSelect, {
  MorphSelectTrigger,
  MorphSelectValue,
  MorphSelectContent,
  MorphSelectItem,
} from "@/components/ui/select-morph";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

const PROGRAMS: { key: JurusanKey; label: string }[] = [
  { key: "perhotelan", label: "Perhotelan" },
  { key: "boga", label: "Kuliner / Tata Boga" },
  { key: "busana", label: "Tata Busana" },
  { key: "pplg", label: "Rekayasa Perangkat Lunak" },
  { key: "pariwisata", label: "Usaha Layanan Wisata (ULW)" },
];

export default function KelasDialog({
  editing,
  initialProgram,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: JadwalKelasDTO | null;
  initialProgram: JurusanKey;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [name, setName] = useState(editing?.nama ?? "");
  const [program, setProgram] = useState<JurusanKey>(editing?.jurusan ?? initialProgram);
  const [grade, setGrade] = useState(String(editing?.tingkat ?? 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama kelas wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/jadwal/index.php?resource=kelas", {
        method: "POST",
        body: {
          ...(editing ? { id: editing.id } : {}),
          nama: name.trim(),
          jurusan: program,
          tingkat: Number(grade),
        },
      });
      onSaved();
    } catch (saveError) {
      if (isUnauthorized(saveError)) {
        onUnauthorized();
        return;
      }
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan kelas.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Ubah nama kelas" : "Tambah kelas"}
      description={editing ? "Nama kelas diperbarui pada jadwal yang terkait." : "Tambahkan kelas pada program dan tingkat yang dipilih."}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>Batal</button>
          <button type="submit" form="jadwal-class-form" className={buttonPrimaryClass} disabled={saving}>
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {saving ? "Menyimpan…" : "Simpan kelas"}
          </button>
        </>
      }
    >
      <form id="jadwal-class-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!editing && (
          <div className="grid gap-space-md sm:grid-cols-2">
            <Field htmlFor="jadwal-class-program" label="Program keahlian">
              <MorphSelect value={program} onValueChange={(value) => setProgram(value as JurusanKey)} className="w-full">
                <MorphSelectTrigger className={fieldClass}>
                  <MorphSelectValue />
                </MorphSelectTrigger>
                <MorphSelectContent>
                  {PROGRAMS.map(({ key, label }) => (
                    <MorphSelectItem key={key} value={key}>{label}</MorphSelectItem>
                  ))}
                </MorphSelectContent>
              </MorphSelect>
            </Field>
            <Field htmlFor="jadwal-class-grade" label="Tingkat">
              <MorphSelect value={grade} onValueChange={(value) => setGrade(value)} className="w-full">
                <MorphSelectTrigger className={fieldClass}>
                  <MorphSelectValue />
                </MorphSelectTrigger>
                <MorphSelectContent>
                  <MorphSelectItem value="10">X</MorphSelectItem>
                  <MorphSelectItem value="11">XI</MorphSelectItem>
                  <MorphSelectItem value="12">XII</MorphSelectItem>
                </MorphSelectContent>
              </MorphSelect>
            </Field>
          </div>
        )}
        <Field htmlFor="jadwal-class-name" label="Nama kelas">
          <input
            id="jadwal-class-name"
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: XRPL1"
            maxLength={80}
            required
          />
        </Field>
      </form>
    </Modal>
  );
}
