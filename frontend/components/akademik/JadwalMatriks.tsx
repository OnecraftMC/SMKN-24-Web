"use client";

import { useState } from "react";

const JADWAL_DATA = {
  perhotelan: {
    pagi: ['Front Office', 'Housekeeping', 'F&B Service', 'Bahasa Inggris Profesi', 'Tata Graha'],
    siang: ['Praktik Hotel Training', 'Praktik Hotel Training', 'Simulasi Check-in/out', 'Etika Pelayanan Tamu', 'Praktik Tata Hidang']
  },
  boga: {
    pagi: ['Pengolahan Makanan Indonesia', 'Pengolahan Kue & Roti', 'Sanitasi Hygiene', 'Bahasa Inggris Profesi', 'Pengolahan Makanan Kontinental'],
    siang: ['Praktik Dapur Produksi', 'Praktik Dapur Produksi', 'Pengelolaan Usaha Boga', 'Plating & Garnish', 'Praktik Pastry']
  },
  busana: {
    pagi: ['Dasar Pola', 'Desain Busana', 'Tekstil', 'Bahasa Inggris Profesi', 'Menjahit Busana Custom'],
    siang: ['Praktik Menjahit', 'Praktik Menjahit', 'Pembuatan Pola Industri', 'Grading & Finishing', 'Praktik Produksi Garmen']
  },
  pplg: {
    pagi: ['Pemrograman Web', 'Basis Data', 'Pemrograman Berorientasi Objek', 'Bahasa Inggris Profesi', 'Pengembangan Gim'],
    siang: ['Praktik Lab Komputer', 'Praktik Lab Komputer', 'Proyek Aplikasi Mobile', 'Jaringan Dasar', 'Praktik UI/UX']
  },
  pariwisata: {
    pagi: ['Pengetahuan Pariwisata', 'Pemanduan Wisata', 'Ticketing & Reservasi', 'Bahasa Inggris Profesi', 'Geografi Pariwisata'],
    siang: ['Praktik Tur Simulasi', 'Praktik Tur Simulasi', 'Pengelolaan Biro Perjalanan', 'Public Speaking', 'Studi Ekskursi']
  }
};

export default function JadwalMatriks() {
  const [jurusan, setJurusan] = useState('perhotelan');
  const data = JADWAL_DATA[jurusan] || JADWAL_DATA.perhotelan;

  return (
    <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div>
          <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Jadwal Pelajaran</span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Matriks Jadwal Interaktif</h2>
        </div>

        <div className="flex flex-wrap items-center gap-space-md mb-4">
          <label htmlFor="jurusan-select" className="font-label-sm font-bold text-primary">Pilih Program Keahlian:</label>
          <select
            id="jurusan-select"
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            className="px-4 py-2 rounded-lg border border-surface-container bg-surface-container-low text-on-surface"
          >
            <option value="perhotelan">Perhotelan</option>
            <option value="boga">Kuliner (Tata Boga)</option>
            <option value="busana">Tata Busana</option>
            <option value="pplg">Rekayasa Perangkat Lunak</option>
            <option value="pariwisata">Usaha Layanan Pariwisata</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-container shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-surface">
              <tr>
                <th className="px-4 py-3 font-label-sm font-bold">Sesi</th>
                <th className="px-4 py-3 font-label-sm font-bold">Pukul 07.30 - 08.30</th>
                <th className="px-4 py-3 font-label-sm font-bold">Pukul 08.30 - 09.30</th>
                <th className="px-4 py-3 font-label-sm font-bold">Pukul 09.30 - 10.30</th>
                <th className="px-4 py-3 font-label-sm font-bold">Pukul 10.30 - 11.30</th>
                <th className="px-4 py-3 font-label-sm font-bold">Pukul 11.30 - 12.30</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-container">
                <td className="px-4 py-3 font-bold bg-surface-container-low">Pagi</td>
                {data.pagi.map((item, idx) => (
                  <td key={idx} className="px-4 py-3"><span className="font-bold text-primary">{item}</span></td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold bg-surface-container-low">Siang</td>
                {data.siang.map((item, idx) => (
                  <td key={idx} className="px-4 py-3">
                    <span className="font-bold text-primary">{item}</span>
                    <br/><span className="text-xs text-on-surface-variant">Praktik Kejuruan</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
