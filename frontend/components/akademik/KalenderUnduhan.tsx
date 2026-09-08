"use client";

import { useState } from "react";

const dokumenData = [
  {
    id: 1,
    judul: "Kalender Pendidikan Tahun Ajaran 2025/2026",
    deskripsi: "Dokumen • Diperbarui Sesuai Kalender Disdik DKI Jakarta",
    icon: "description",
  },
  {
    id: 2,
    judul: "Panduan Kurikulum Merdeka SMK 5 Kompetensi Keahlian",
    deskripsi: "Dokumen • Perhotelan, Boga, Busana, RPL, Pariwisata",
    icon: "menu_book",
  },
  {
    id: 3,
    judul: "Pedoman Praktik Kerja Lapangan (PKL)",
    deskripsi: "Dokumen • Skema Link and Match Dunia Usaha & Industri",
    icon: "assignment",
  },
];

export default function KalenderUnduhan() {
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = (judul: string, id: number) => {
    setDownloading(id);
    const isi = `SMK NEGERI 24 JAKARTA\nJl. Bambu Hitam No. 3, Bambu Apus, Cipayung, Jakarta Timur 13890\n\n${judul}\n\nDokumen resmi versi lengkap tersedia di Tata Usaha sekolah atau dapat diminta melalui email humassmkn24jakarta@gmail.com / telepon (021) 844-1976.`;
    const blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = judul.replace(/\s+/g, "_") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(null);
  };

  return (
    <div className="lg:col-span-7 space-y-space-lg">
      <div>
        <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Pusat Arsip</span>
        <h3 className="font-headline-md font-bold text-primary">Dokumen &amp; Silabus Pembelajaran</h3>
      </div>
      <div className="space-y-3">
        {dokumenData.map((item) => (
          <div
            key={item.id}
            className="p-space-md rounded-2xl bg-surface-container-lowest border border-surface-container flex items-center justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div>
                <h4 className="font-title-md font-bold text-primary">{item.judul}</h4>
                <p className="text-xs text-on-surface-variant">{item.deskripsi}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(item.judul, item.id)}
              disabled={downloading === item.id}
              className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm font-bold flex items-center gap-1 hover:bg-secondary-fixed-dim transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {downloading === item.id ? "..." : "Unduh"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}