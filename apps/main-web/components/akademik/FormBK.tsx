"use client";

import { useState } from "react";

const INITIAL_FORM = {
  nama: "",
  kelas: "",
  noHp: "",
  keperluan: "Persiapan PKL & Penempatan Kerja",
  pesan: "",
};

export default function FormBK() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/bk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result: unknown = await response.json().catch(() => null);
      const responseMessage =
        typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
          ? result.message
          : null;
      const errorMessage =
        typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : null;

      if (!response.ok) {
        setStatus({ kind: "error", message: errorMessage ?? responseMessage ?? `Server merespons HTTP ${response.status}.` });
        return;
      }
      if (!responseMessage) {
        setStatus({ kind: "error", message: "Balasan server tidak valid; pengajuan belum dapat dikonfirmasi." });
        return;
      }

      setStatus({ kind: "success", message: responseMessage });
      setFormData(INITIAL_FORM);
    } catch {
      setStatus({ kind: "error", message: "Tidak dapat menghubungi server. Periksa koneksi, lalu coba lagi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container shadow-sm">
      <div className="flex items-center gap-2 text-secondary font-bold mb-3">
        <span className="material-symbols-outlined text-[24px]">support_agent</span>
        <span className="font-label-md uppercase tracking-wider">Bimbingan Konseling</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary font-bold mb-4">Konsultasi &amp; Bimbingan Konseling</h3>
      <form onSubmit={handleSubmit} className="space-y-space-md">
        <div>
          <label htmlFor="bk-nama" className="block text-xs font-bold text-primary mb-1">Nama Lengkap</label>
          <input
            id="bk-nama"
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            required
            maxLength={200}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Nama siswa"
          />
        </div>
        <div>
          <label htmlFor="bk-kelas" className="block text-xs font-bold text-primary mb-1">Kelas / Jurusan</label>
          <input
            id="bk-kelas"
            type="text"
            name="kelas"
            value={formData.kelas}
            onChange={handleChange}
            required
            maxLength={100}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Contoh: XII RPL 1"
          />
        </div>
        <div>
          <label htmlFor="bk-no-hp" className="block text-xs font-bold text-primary mb-1">Nomor Telepon (WA)</label>
          <input
            id="bk-no-hp"
            type="tel"
            name="noHp"
            value={formData.noHp}
            onChange={handleChange}
            required
            maxLength={40}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <div>
          <label htmlFor="bk-keperluan" className="block text-xs font-bold text-primary mb-1">Topik Bimbingan</label>
          <select
            id="bk-keperluan"
            name="keperluan"
            value={formData.keperluan}
            onChange={handleChange}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
          >
            <option>Persiapan PKL & Penempatan Kerja</option>
            <option>Kesulitan Belajar & Manajemen Waktu</option>
            <option>Adaptasi Sosial & Masalah Emosional</option>
            <option>Persiapan LKS & Portofolio Prestasi</option>
          </select>
        </div>
        <div>
          <label htmlFor="bk-pesan" className="block text-xs font-bold text-primary mb-1">Catatan Tambahan</label>
          <textarea
            id="bk-pesan"
            name="pesan"
            value={formData.pesan}
            onChange={handleChange}
            required
            maxLength={2000}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Tuliskan kendala atau preferensi jadwal bimbingan..."
            rows={2}
          />
        </div>
        {status && (
          <p
            className={status.kind === "success" ? "text-sm text-green-700" : "text-sm text-red-700"}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-primary text-surface font-label-md font-bold hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{isSubmitting ? "hourglass_top" : "send"}</span>
          {isSubmitting ? "Mengirim pengajuan..." : "Kirim Pengajuan Konsultasi"}
        </button>
      </form>
    </div>
  );
}
