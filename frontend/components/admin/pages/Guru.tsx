"use client";

import { useState } from "react";

export default function Guru() {
  const [modalOpen, setModalOpen] = useState(false);

  const guru = [
    {
      nama: "Drs. Bambang Sutrisno, M.Pd",
      jabatan: "Kepala Sekolah",
      deskripsi: "Memimpin sekolah dengan fokus pada pengembangan karakter dan kompetensi siswa.",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=60",
    },
    {
      nama: "Siti Rahma, S.Kom",
      jabatan: "Kepala Jurusan RPL",
      deskripsi: "Mengampu mata pelajaran Basis Data dan Pemrograman Berorientasi Objek.",
      foto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&q=60",
    },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex items-center justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola profil guru dan tenaga kependidikan yang tampil di halaman Profil.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Tambah Guru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {guru.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
            <img alt="Foto guru" className="w-full h-40 object-cover" src={item.foto} />
            <div className="p-space-md">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">{item.nama}</h3>
              <p className="font-label-sm text-label-sm text-secondary font-bold mb-space-2xs">{item.jabatan}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{item.deskripsi}</p>
              <div className="flex gap-space-2xs pt-space-sm">
                <button onClick={() => setModalOpen(true)} className="flex-1 py-1.5 rounded-lg border border-outline-variant font-label-sm text-label-sm font-bold hover:bg-surface-container-low">Edit</button>
                <button className="p-1.5 rounded-lg border border-outline-variant text-error hover:bg-error-container" aria-label="Hapus">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 z-50 flex items-center justify-center px-margin-mobile">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-space-lg space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Tambah Guru</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Nama Lengkap & Gelar</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" placeholder="Contoh: Siti Rahma, S.Kom" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Jabatan</label>
              <input className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" placeholder="Contoh: Kepala Jurusan RPL" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-space-2xs">Deskripsi Singkat</label>
              <textarea className="w-full px-space-md py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" placeholder="Mata pelajaran yang diampu, bidang keahlian, dll." rows={3}></textarea>
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