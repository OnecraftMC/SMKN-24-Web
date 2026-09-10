"use client";

export default function Ringkasan() {
  return (
    <div className="page-section fade-in space-y-space-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">article</span>
            </span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold">42</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Berita dipublikasikan</p>
        </div>
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold">3</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Pengaduan BK menunggu</p>
        </div>
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">folder_zip</span>
            </span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold">18</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Arsip tersimpan</p>
        </div>
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold">36</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Guru terdaftar</p>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface font-bold mb-space-md">Aktivitas Terbaru</h2>
        <ul className="divide-y divide-outline-variant/50">
          <li className="py-space-sm flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">article</span>
            <span className="font-body-sm text-body-sm text-on-surface flex-1">Berita "Juara 1 LKS Tingkat Provinsi" dipublikasikan</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">2 jam lalu</span>
          </li>
          <li className="py-space-sm flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>
            <span className="font-body-sm text-body-sm text-on-surface flex-1">Pengaduan BK baru dari siswa kelas XI RPL 2</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">5 jam lalu</span>
          </li>
          <li className="py-space-sm flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">event</span>
            <span className="font-body-sm text-body-sm text-on-surface flex-1">Agenda "Job Fair 2026" ditambahkan ke kalender</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">1 hari lalu</span>
          </li>
        </ul>
      </div>
    </div>
  );
}