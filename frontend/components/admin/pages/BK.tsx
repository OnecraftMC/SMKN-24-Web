"use client";

export default function BK() {
  const pengaduan = [
    {
      nama: "Rangga Saputra",
      kelas: "XI RPL 2",
      keperluan: "Konsultasi masalah pribadi",
      pesan: '"Saya ingin konsultasi terkait kesulitan mengatur waktu belajar dan kegiatan ekstrakurikuler. Mohon dijadwalkan sesi bimbingan."',
      tanggal: "Dikirim 6 Sep 2026, 14.20 WIB",
      status: "Menunggu",
    },
    {
      nama: "Nadia Putri",
      kelas: "X Kuliner 1",
      keperluan: "Konsultasi akademik",
      pesan: '"Nilai ulangan saya menurun akhir-akhir ini, ingin diskusi strategi belajar yang lebih baik."',
      tanggal: "Dikirim 5 Sep 2026, 09.05 WIB",
      status: "Diproses",
    },
  ];

  return (
    <div className="page-section fade-in space-y-space-lg">
      <div className="flex items-center gap-space-sm">
        <select className="px-space-sm py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
          <option>Semua status</option>
          <option>Menunggu</option>
          <option>Diproses</option>
          <option>Selesai</option>
        </select>
      </div>

      <div className="space-y-space-sm">
        {pengaduan.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex-1">
                <div className="flex items-center gap-space-xs mb-space-2xs">
                  <span className="font-label-md text-label-md text-on-surface font-bold">{item.nama}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{item.kelas}</span>
                  <span className={`inline-flex px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                    item.status === "Menunggu"
                      ? "bg-secondary-container/20 text-secondary"
                      : "bg-primary-container/10 text-primary"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-2xs">
                  <span className="font-semibold text-on-surface">Keperluan:</span> {item.keperluan}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface">{item.pesan}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">{item.tanggal}</p>
              </div>
              <select className="px-space-xs py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm shrink-0">
                <option>Menunggu</option>
                <option>Diproses</option>
                <option>Selesai</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}