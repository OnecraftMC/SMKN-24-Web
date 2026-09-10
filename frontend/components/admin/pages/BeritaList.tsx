"use client";

interface BeritaListProps {
  setCurrentPage: (page: string) => void;
}

export default function BeritaList({ setCurrentPage }: BeritaListProps) {
  const berita = [
    {
      judul: "Juara 1 LKS Tingkat Provinsi DKI Jakarta",
      kategori: "Prestasi",
      tanggal: "6 Sep 2026",
      status: "Dipublikasikan",
    },
    {
      judul: "Kunjungan Industri Kelas XII Perhotelan",
      kategori: "Kegiatan",
      tanggal: "2 Sep 2026",
      status: "Draf",
    },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
            <input
              className="pl-10 pr-space-md py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Cari berita..."
              type="text"
            />
          </div>
          <select className="px-space-sm py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
            <option>Semua status</option>
            <option>Dipublikasikan</option>
            <option>Draf</option>
          </select>
        </div>
        <button
          onClick={() => setCurrentPage("berita-editor")}
          className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Tulis Berita</span>
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Judul</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Kategori</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Tanggal</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Status</th>
              <th className="px-space-md py-space-sm font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {berita.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/50">
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface font-semibold">{item.judul}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.kategori}</td>
                <td className="px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{item.tanggal}</td>
                <td className="px-space-md py-space-sm">
                  <span className={`inline-flex px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                    item.status === "Dipublikasikan"
                      ? "bg-primary-container/10 text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-space-md py-space-sm text-right space-x-space-2xs">
                  <button
                    onClick={() => setCurrentPage("berita-editor")}
                    className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
                    aria-label="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
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
    </div>
  );
}