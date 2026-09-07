import Image from "next/image";

export default function SambutanKepsek() {
  return (
    <section className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -top-4 -left-4 w-28 h-28 bg-secondary-container/20 rounded-3xl -z-10"></div>
              <div className="absolute -bottom-4 -right-4 w-36 h-36 bg-surface-container-highest rounded-3xl -z-10"></div>
              <div className="rounded-2xl overflow-hidden shadow-xl bg-surface-container-lowest p-2">
                <img
                  alt="Dra. Isfariani Marlena, M.Pd. - Kepala Sekolah"
                  className="w-full aspect-square object-cover rounded-xl shadow-inner"
                  src="/images/kepsek.jpg"                />
              </div>
              <div className="absolute bottom-6 -right-4 bg-primary text-surface px-space-md py-space-sm rounded-xl shadow-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-container text-[28px]">
                  format_quote
                </span>
                <div>
                  <p className="font-label-sm text-label-sm font-bold leading-tight">Pengabdian Penuh</p>
                  <p className="font-body-sm text-body-sm text-surface-container-high text-xs">
                    Untuk Generasi Bangsa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-space-md">
            <div className="inline-flex items-center gap-2 text-secondary font-bold font-label-md text-label-md uppercase tracking-wider">
              <span className="w-6 h-0.5 bg-secondary"></span>
              <span>Sambutan Kepala Sekolah</span>
            </div>

            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Membentuk Karakter Mandiri Menuju Pendidikan Kejuruan Berwawasan Lingkungan
            </h2>

            <div className="space-y-space-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <p>
                <em className="font-title-md text-title-md text-primary not-italic font-semibold">
                  "Pendidikan bukan hanya tentang apa yang kita pelajari di kelas, tetapi tentang
                  bagaimana kita membentuk karakter, menanamkan nilai, dan membangun kesiapan kerja."
                </em>
              </p>
              <p>
                Selamat datang di portal resmi <strong>SMK Negeri 24 Jakarta</strong>. Sejak berdiri
                pada 3 Juli 1972, kami konsisten menyiapkan calon teknisi menengah yang kompeten dan
                berjiwa wirausaha untuk memenangkan persaingan di pasar kerja nasional maupun
                internasional.
              </p>
              <p>
                Melalui lima kompetensi keahlian, kemitraan dunia usaha &amp; industri, serta status
                Program Sekolah Penggerak Kemendikbudristek, kami berkomitmen mencetak lulusan yang
                beriman, mandiri, dan berwawasan lingkungan.
              </p>
            </div>

            <div className="pt-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-low p-space-md rounded-xl">
              <div>
                <h3 className="font-title-md text-title-md text-primary font-bold">
                  Dra. Isfariani Marlena, M.Pd.
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Kepala Sekolah SMK Negeri 24 Jakarta
                </p>
              </div>
              <div className="flex items-center gap-2 text-secondary-container">
                <span className="material-symbols-outlined text-[32px]">signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}