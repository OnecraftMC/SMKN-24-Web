export default function LokasiSekolahBanner() {
  return (
    <div className="w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl" id="lokasi-sekolah">
      <div className="max-w-container-max mx-auto relative rounded-3xl overflow-hidden bg-primary text-on-primary shadow-2xl p-space-xl md:p-space-3xl">
        <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-96 h-96 rounded-full bg-tertiary-container blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-5 space-y-space-md">
            <div className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>Lokasi Kampus Kami</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold tracking-tight">
              Kunjungi Kampus SMK Negeri 24 Jakarta
            </h2>
            <p className="font-body-lg text-body-lg text-primary-fixed max-w-2xl font-normal leading-relaxed">
              Jl. Bambu Hitam No. 3, RT.3/RW.1, Bambu Apus, Kec. Cipayung, Jakarta Timur 13890. Silakan
              mampir untuk melihat langsung fasilitas dan suasana belajar di sekolah kami.
            </p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <a
                className="inline-flex items-center justify-center gap-2 px-space-xl py-3.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shadow-xl hover:bg-secondary-fixed-dim transition-all"
                href="https://www.google.com/maps/search/?api=1&query=-6.3219,106.8993"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="material-symbols-outlined text-[20px]">directions</span>
                <span>Buka di Google Maps</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 px-space-lg py-3.5 rounded-lg bg-surface-container-highest/20 text-surface font-label-md text-label-md font-semibold backdrop-blur hover:bg-surface-container-highest/35 transition-all"
                href="tel:0218441976"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary-container">call</span>
                <span>Hubungi Sekolah: (021) 844-1976</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl overflow-hidden shadow-lg border border-surface-container-high/20 h-80 lg:h-96">
            <iframe
              allowFullScreen
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=-6.3219,106.8993&z=16&output=embed"
              title="Peta Lokasi SMK Negeri 24 Jakarta"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}