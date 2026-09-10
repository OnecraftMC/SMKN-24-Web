"use client";

import { useState } from "react";

export default function Agenda() {
  const [modalOpen, setModalOpen] = useState(false);

  const agenda = [
    {
      kegiatan: "Job Fair 2026",
      tglMulai: "10 Okt 2026",
      tglSelesai: "11 Okt 2026",
      lokasi: "Aula Sekolah",
      gambar: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?w=100&q=60",
    },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex items-center justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola kalender agenda dan kegiatan sekolah.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Tambah Agenda</span>
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Kegiatan</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Tanggal Mulai</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Tanggal Selesai</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Lokasi</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {agenda.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/50">
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface font-semibold flex items-center gap-space-xs">
                  <img alt="" className="w-10 h-10 rounded-lg object-cover" src={item.gambar} />
                  {item.kegiatan}
                </td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.tglMulai}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.tglSelesai}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.lokasi}</td>
                <td className="px-space-md py-space-sm text-right space-x-space-2xs">
                  <button onClick={() => setModalOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-error-container text-error">
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
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-space-lg space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Tambah Agenda</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Nama Kegiatan</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" />
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Tanggal Mulai</label>
                <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="date" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Tanggal Selesai</label>
                <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="date" />
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Lokasi</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Deskripsi</label>
              <textarea className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" rows={3}></textarea>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Gambar Kegiatan</label>
              <div className="rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-space-2xs py-space-lg text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                <p className="font-label-sm text-label-sm">Klik untuk unggah gambar</p>
              </div>
            </div>
            <div className="flex gap-space-sm pt-space-xs">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md font-bold">Batal</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}