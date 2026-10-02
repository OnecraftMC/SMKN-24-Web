export default function KabarBanner() {
  return (
    <div className="bg-primary text-on-primary py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative overflow-hidden">
      <div className="max-w-container-max mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 text-secondary-container font-label-sm font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          <span>Warta Kampus &amp; Galeri Karya</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg lg:text-[2.75rem] font-bold text-surface tracking-tight">
          Kabar Terkini, Prestasi &amp; Dokumentasi
        </h1>
        <p className="font-body-lg text-primary-fixed max-w-3xl">
          Saksi rekam jejak langkah karya siswa-siswi SMK Negeri 24 Jakarta dalam menggapai prestasi akademik, olahraga, sains, dan kebudayaan.
        </p>
      </div>
    </div>
  );
}
