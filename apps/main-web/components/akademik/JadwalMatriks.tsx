"use client";

import { useState } from "react";

export type JadwalMatriksData = {
  id: number;
  jurusan: string;
  tingkat: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran: string;
  guru: string;
  ruang: string;
}[];

export default function JadwalMatriks({
  jadwal,
  error,
}: {
  jadwal: JadwalMatriksData;
  error: string | null;
}) {
  const jurusanList = Array.from(new Set(jadwal.map((item) => item.jurusan)));
  const [selectedJurusan, setSelectedJurusan] = useState(jurusanList[0] ?? "");
  const filtered = jadwal.filter((item) => item.jurusan === selectedJurusan);

  return (
    <section className="max-w-5xl mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-2">Jadwal Pelajaran</h2>
      <p className="text-gray-600 mb-6">Jadwal pembelajaran berdasarkan program keahlian.</p>

      {jurusanList.length > 0 && (
        <label className="mb-6 flex flex-col gap-2 font-medium">
          Program Keahlian
          <select
            value={selectedJurusan}
            onChange={(event) => setSelectedJurusan(event.target.value)}
            className="max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3"
          >
            {jurusanList.map((jurusan) => <option key={jurusan}>{jurusan}</option>)}
          </select>
        </label>
      )}

      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3">Hari</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Tingkat</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3">Guru</th>
                <th className="p-3">Ruang</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-200">
                  <td className="p-3">{item.hari}</td>
                  <td className="p-3">{item.jam_mulai}–{item.jam_selesai}</td>
                  <td className="p-3">{item.tingkat}</td>
                  <td className="p-3">{item.mata_pelajaran}</td>
                  <td className="p-3">{item.guru}</td>
                  <td className="p-3">{item.ruang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-gray-200 p-6 text-gray-600" role="status">
          {error ? `Jadwal belum dapat dimuat: ${error}` : "Belum ada jadwal pembelajaran."}
        </p>
      )}
    </section>
  );
}
