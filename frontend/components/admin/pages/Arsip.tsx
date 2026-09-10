"use client";

import { useState } from "react";

export default function Arsip() {
  const [modalOpen, setModalOpen] = useState(false);

  const arsip = [
    { nama: "Kalender Akademik 2026-2027.pdf", kategori: "Kalender Akademik", ukuran: "1.2 MB", tgl: "3 Sep 2026", icon: "picture_as_pdf", color: "text-error" },
    { nama: "Formulir Pendaftaran Ekskul.docx", kategori: "Formulir", ukuran: "340 KB", tgl: "28 Agu 2026", icon: "description", color: "text-primary" },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <select className="px-space-sm py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
          <option>Semua kategori</option>
          <option>Formulir</option>
          <option>Kalender Akademik</option>
          <option>Surat Edaran</option>
          <option>Modul Ajar</option>
        </select>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Unggah Arsip</span>
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Nama Berkas</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Kategori</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Ukuran</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Diunggah</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {arsip.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/50">
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface font-semibold flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                  {item.nama}
                </td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.kategori}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.ukuran}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.tgl}</td>
                <td className="px-space-md py-space-sm text-right space-x-space-2xs">
                  <button className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant" aria-label="Unduh">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-error-container text-error" aria-label="Hapus">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 z-50 flex items-center justify-center px-margin-mobile">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-space-lg space-y-space-md">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Unggah Arsip</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-space-2xs py-space-2xl text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer">
              <span className="material-symbols-outlined text-[32px]">upload_file</span>
              <p className="font-label-md text-label-md font-bold">Seret berkas ke sini atau klik untuk unggah</p>
              <p className="font-label-sm text-label-sm">PDF, DOCX, XLSX — maks. 10MB</p>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Nama Berkas</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Kategori</label>
              <select className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
                <option>Formulir</option>
                <option>Kalender Akademik</option>
                <option>Surat Edaran</option>
                <option>Modul Ajar</option>
              </select>
            </div>
            <div className="flex gap-space-sm pt-space-xs">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md font-bold">Batal</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold">Unggah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}