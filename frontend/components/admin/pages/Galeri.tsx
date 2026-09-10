"use client";

import { useState } from "react";

export default function Galeri() {
  const [modalOpen, setModalOpen] = useState(false);

  const foto = [
    { src: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&q=60", judul: "Praktik Kuliner Kelas X" },
    { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=60", judul: "Upacara Bendera Senin" },
    { src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=60", judul: "Lomba Fotografi Siswa" },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex items-center justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Unggah dokumentasi kegiatan siswa untuk ditampilkan di galeri publik.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
          <span>Tambah Foto</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-space-md">
        {foto.map((item, idx) => (
          <div key={idx} className="group relative rounded-xl overflow-hidden border border-outline-variant/60">
            <img alt="" className="w-full h-40 object-cover" src={item.src} />
            <div className="absolute inset-0 bg-on-surface/0 group-hover:bg-on-surface/50 transition-all flex items-end p-space-sm opacity-0 group-hover:opacity-100">
              <p className="font-label-sm text-label-sm text-surface font-bold">{item.judul}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-space-2xs opacity-0 group-hover:opacity-100 transition-all">
              <button className="p-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant" aria-label="Edit">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button className="p-1.5 rounded-lg bg-surface-container-lowest text-error" aria-label="Hapus">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 z-50 flex items-center justify-center px-margin-mobile">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-space-lg space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Tambah Foto Galeri</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-space-2xs py-space-2xl text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer">
              <span className="material-symbols-outlined text-[32px]">upload</span>
              <p className="font-label-md text-label-md font-bold">Seret foto ke sini atau klik untuk unggah</p>
              <p className="font-label-sm text-label-sm">Bisa unggah lebih dari satu foto sekaligus</p>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Judul Foto</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Deskripsi</label>
              <textarea className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" rows={2}></textarea>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Kategori</label>
              <select className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
                <option>Kegiatan Belajar</option>
                <option>Ekstrakurikuler</option>
                <option>Upacara & Seremonial</option>
                <option>Prestasi</option>
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