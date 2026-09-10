"use client";

export default function Jadwal() {
  const jadwal = [
    { jam: "1", waktu: "07.00 - 07.45", mapel: "Pemrograman Web", guru: "Andi Wijaya, S.Kom" },
    { jam: "2", waktu: "07.45 - 08.30", mapel: "Basis Data", guru: "Siti Rahma, S.Kom" },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <select className="px-space-sm py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
            <option>X RPL 1</option>
            <option>X RPL 2</option>
            <option>XI Perhotelan 1</option>
            <option>XII Kuliner 1</option>
          </select>
          <select className="px-space-sm py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
            <option>Senin</option>
            <option>Selasa</option>
            <option>Rabu</option>
            <option>Kamis</option>
            <option>Jumat</option>
          </select>
        </div>
        <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Tambah Jam Pelajaran</span>
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase w-20">Jam Ke-</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase w-40">Waktu</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Mata Pelajaran</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Guru Pengajar</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase text-right w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {jadwal.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/50">
                <td className="px-space-md py-space-xs">
                  <input className="w-full px-space-xs py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-center" type="text" value={item.jam} />
                </td>
                <td className="px-space-md py-space-xs">
                  <input className="w-full px-space-xs py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" value={item.waktu} />
                </td>
                <td className="px-space-md py-space-xs">
                  <input className="w-full px-space-xs py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" value={item.mapel} />
                </td>
                <td className="px-space-md py-space-xs">
                  <input className="w-full px-space-xs py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="text" value={item.guru} />
                </td>
                <td className="px-space-md py-space-xs text-right">
                  <button className="p-1.5 rounded-lg hover:bg-error-container text-error" aria-label="Hapus baris">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-space-md py-space-sm text-center" colSpan={5}>
                <button className="inline-flex items-center gap-space-2xs font-label-md text-label-md text-primary hover:underline">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tambah baris jam pelajaran
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all">
          Simpan Perubahan Jadwal
        </button>
      </div>
    </div>
  );
}