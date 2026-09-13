"use client";

import { useState } from "react";

export default function FormBK() {
  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    noHp: '',
    keperluan: 'Persiapan PKL & Penempatan Kerja',
    pesan: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Pengajuan konsultasi BK diterima untuk ${formData.nama} dengan topik ${formData.keperluan}`);
    // Reset form
    setFormData({ nama: '', kelas: '', noHp: '', keperluan: 'Persiapan PKL & Penempatan Kerja', pesan: '' });
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
          <label className="block text-xs font-bold text-primary mb-1">Nama Lengkap</label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            required
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Nama siswa"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Kelas / Jurusan</label>
          <input
            type="text"
            name="kelas"
            value={formData.kelas}
            onChange={handleChange}
            required
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Contoh: XII RPL 1"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Nomor Telepon (WA)</label>
          <input
            type="tel"
            name="noHp"
            value={formData.noHp}
            onChange={handleChange}
            required
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-primary mb-1">Topik Bimbingan</label>
          <select
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
          <label className="block text-xs font-bold text-primary mb-1">Catatan Tambahan (Opsional)</label>
          <textarea
            name="pesan"
            value={formData.pesan}
            onChange={handleChange}
            className="w-full text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface"
            placeholder="Tuliskan kendala atau preferensi jadwal bimbingan..."
            rows={2}
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-primary text-surface font-label-md font-bold hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">send</span> Kirim Pengajuan Konsultasi
        </button>
      </form>
    </div>
  );
}
