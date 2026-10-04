"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { fieldClass, labelClass } from "@/components/admin/ui/FormBits";

const initialForm = {
  nisn: "",
  namaSiswa: "",
  kelas: "",
  jurusan: "",
  perlombaan: "",
  tingkat: "",
  tanggalLomba: "",
  penyelenggara: "",
  prestasi: "",
  deskripsi: "",
};

const requiredFields: Array<keyof typeof initialForm> = [
  "nisn",
  "namaSiswa",
  "kelas",
  "jurusan",
  "perlombaan",
  "tingkat",
  "tanggalLomba",
  "penyelenggara",
  "prestasi",
];

export default function FormPengajuanPrestasi() {
  const [form, setForm] = useState(initialForm);
  const [bukti, setBukti] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    for (const field of requiredFields) {
      formData.set(field, form[field]);
    }
    formData.set("deskripsi", form.deskripsi);
    if (bukti) formData.set("bukti", bukti);

    try {
      const response = await fetch("/api/prestasi", {
        method: "POST",
        body: formData,
        cache: "no-store",
      });
      const result: unknown = await response.json().catch(() => null);
      const message =
        typeof result === "object" && result !== null && "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;
      const error =
        typeof result === "object" && result !== null && "error" in result &&
        typeof result.error === "string"
          ? result.error
          : null;

      if (!response.ok || !message) {
        setFeedback({
          kind: "error",
          message: error ?? `Pengajuan belum dapat dikonfirmasi (HTTP ${response.status}). Data Anda tetap tersimpan di formulir.`,
        });
        return;
      }

      setFeedback({ kind: "success", message });
      setForm(initialForm);
      setBukti(null);
      formElement.reset();
    } catch {
      setFeedback({
        kind: "error",
        message: "Tidak dapat menghubungi server. Data tetap tersimpan di formulir; periksa koneksi lalu coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-space-lg rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
    >
      <p className="text-sm text-on-surface-variant">
        Tanda <span aria-hidden="true">*</span> menunjukkan kolom wajib.
      </p>
      <div className="grid gap-space-md md:grid-cols-2">
        <Field label="NISN" name="nisn" required maxLength={20} value={form.nisn} onChange={updateField} />
        <Field label="Nama siswa" name="namaSiswa" required maxLength={150} value={form.namaSiswa} onChange={updateField} />
        <Field label="Kelas" name="kelas" required maxLength={80} value={form.kelas} onChange={updateField} />
        <Field label="Jurusan" name="jurusan" required maxLength={100} value={form.jurusan} onChange={updateField} />
        <Field label="Nama perlombaan" name="perlombaan" required maxLength={255} value={form.perlombaan} onChange={updateField} />
        <Field label="Tingkat perlombaan" name="tingkat" required maxLength={100} value={form.tingkat} onChange={updateField} />
        <Field label="Tanggal perlombaan" name="tanggalLomba" required type="date" value={form.tanggalLomba} onChange={updateField} />
        <Field label="Penyelenggara" name="penyelenggara" required maxLength={200} value={form.penyelenggara} onChange={updateField} />
        <Field label="Prestasi / peringkat" name="prestasi" required maxLength={150} value={form.prestasi} onChange={updateField} />
        <label className="block md:col-span-2">
          <span className={labelClass}>Uraian (opsional)</span>
          <textarea
            name="deskripsi"
            value={form.deskripsi}
            onChange={(event) => updateField("deskripsi", event.target.value)}
            maxLength={3000}
            rows={4}
            className={fieldClass}
          />
          <span className="mt-1 block text-xs text-on-surface-variant">Maksimal 3.000 karakter.</span>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Lampiran bukti (opsional)</span>
        <input
          name="bukti"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          aria-describedby="bukti-hint"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            if (file && file.size > 10 * 1024 * 1024) {
              event.currentTarget.value = "";
              setBukti(null);
              setFeedback({ kind: "error", message: "Ukuran lampiran maksimal 10 MB." });
              return;
            }
            setBukti(file);
            setFeedback(null);
          }}
          className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-on-primary`}
        />
        <span id="bukti-hint" className="mt-1 block text-xs text-on-surface-variant">
          PDF, JPG, atau PNG; maksimal 10 MB. Lampiran hanya dapat diakses admin.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl bg-surface-container-low p-space-md">
        <input type="checkbox" required className="mt-1 h-4 w-4 accent-primary" />
        <span className="text-sm text-on-surface">
          Saya memahami data ini digunakan untuk verifikasi pengajuan oleh admin sekolah,
          bersifat terbatas, dan tidak dipublikasikan otomatis.
        </span>
      </label>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={feedback.kind === "error" ? "text-sm font-medium text-error" : "text-sm font-medium text-primary"}
        >
          {feedback.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-space-md py-2.5 font-label-md font-bold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
        {isSubmitting ? "Mengirim pengajuan…" : "Kirim pengajuan"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required = false,
  maxLength,
  type = "text",
}: {
  label: string;
  name: keyof typeof initialForm;
  value: string;
  onChange: (name: keyof typeof initialForm, value: string) => void;
  required?: boolean;
  maxLength?: number;
  type?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        maxLength={maxLength}
        className={fieldClass}
      />
    </label>
  );
}
