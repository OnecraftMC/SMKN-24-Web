const dokumenData = [
  { id: 1, title: "Kalender Pendidikan 2025/2026", type: "PDF" },
  { id: 2, title: "Kurikulum Merdeka – Struktur Kurikulum", type: "PDF" },
  { id: 3, title: "Jadwal Ujian Akhir Semester Ganjil", type: "PDF" },
  { id: 4, title: "Buku Panduan PKL 2025", type: "PDF" },
];

export default function KalenderUnduhan() {
  const unduhDokumen = (judul) => {
    const isi = `SMK NEGERI 24 JAKARTA\nJl. Bambu Hitam No. 3, Bambu Apus, Cipayung, Jakarta Timur 13890\n\n${judul}\n\nDokumen resmi versi lengkap tersedia di Tata Usaha sekolah atau dapat diminta melalui email humassmkn24jakarta@gmail.com / telepon (021) 844-1976.`;
    const blob = new Blob([isi], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = judul.replace(/\s+/g, '_') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-space-lg">
      <div>
        <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Unduhan &amp; Kalender</span>
        <h3 className="font-headline-md text-headline-md text-primary font-bold">Dokumen &amp; Jadwal Akademik</h3>
      </div>
      <ul className="space-y-space-sm">
        {dokumenData.map((doc) => (
          <li key={doc.id} className="bg-surface-container-lowest rounded-xl p-space-md border border-surface-container shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <span className="font-title-sm font-bold text-primary">{doc.title}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">{doc.type}</span>
            </div>
            <button
              onClick={() => unduhDokumen(doc.title)}
              className="flex items-center gap-1 text-secondary font-bold hover:underline text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Unduh</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
