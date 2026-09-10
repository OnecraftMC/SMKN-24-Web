"use client";

import { useState } from "react";

export default function Pengumuman() {
  const [modalOpen, setModalOpen] = useState(false);

  const pengumuman = [
    {
      judul: "Libur Sekolah Peringatan Hari Guru",
      isi: "Sekolah libur pada 25 November 2026 sesuai kalender pendidikan.",
      tanggal: "20 Nov 2026",
      penting: true,
      gambar: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=60",
    },
    {
      judul: "Jadwal Pembagian Rapor Semester Ganjil",
      isi: "Rapor dibagikan tanggal 19 Desember 2026 pukul 08.00 WIB.",
      tanggal: "15 Nov 2026",
      penting: false,
      gambar: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=60",
    },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex items-center justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola papan pengumuman yang tampil di beranda.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Tambah Pengumuman</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
        {pengumuman.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
            <img alt="Gambar pengumuman" className="w-full h-36 object-cover" src={item.gambar} />
            <div className="p-space-md space-y-space-2xs">
              <span className={`inline-flex px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                item.penting ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-on-surface-variant"
              }`}>
                {item.penting ? "Penting" : "Umum"}
              </span>
              <h3 className="font-title-md text-title-md text-on-surface font-bold leading-snug">{item.judul}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{item.isi}</p>
              <div className="flex items-center justify-between pt-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{item.tanggal}</span>
                <div className="space-x-space-2xs">
                  <button onClick={() => setModalOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-error-container text-error">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 z-50 flex items-center justify-center px-margin-mobile">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-space-lg space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Tambah Pengumuman</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Judul</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Isi Pengumuman</label>
              <textarea className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30" rows={4}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Tanggal</label>
                <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="date" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface cursor-pointer">
                  <input className="rounded border-outline-variant text-primary" type="checkbox" />
                  Tandai Penting
                </label>
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Gambar</label>
              <div className="rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-space-2xs py-space-lg text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                <p className="font-label-sm text-label-sm">Klik untuk ganti gambar</p>
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