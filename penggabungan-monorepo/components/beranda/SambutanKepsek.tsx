import Image from "next/image";

export default function SambutanKepsek() {
  return (
    <section className="w-full px-margin-mobile py-space-4xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="grid items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex justify-center lg:col-span-4">
            <div className="relative w-full max-w-xs">
              <div aria-hidden className="absolute -left-4 -top-4 z-0 h-28 w-28 rounded-3xl bg-secondary-container/30" />
              <div aria-hidden className="absolute -bottom-4 -right-4 z-0 h-36 w-36 rounded-3xl bg-surface-container-highest" />
              <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-2 shadow-xl">
                <Image
                  alt="Kepala SMK Negeri 24 Jakarta"
                  className="aspect-[9/16] w-full rounded-xl object-cover shadow-inner"
                  src="/images/kepsek-2026.jpg"
                  width={843}
                  height={1500}
                  sizes="(max-width: 1024px) 80vw, 320px"
                />
              </div>
              <div className="absolute bottom-6 -right-4 flex items-center gap-3 rounded-xl bg-primary px-space-md py-space-sm text-surface shadow-lg">
                <span aria-hidden className="material-symbols-outlined text-[28px] text-secondary-container">
                  format_quote
                </span>
                <div>
                  <p className="font-label-sm text-label-sm font-bold leading-tight">Sambutan Kepala Sekolah</p>
                  <p className="font-body-sm text-body-sm text-surface-container-high">SMK Negeri 24 Jakarta</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-space-md lg:col-span-8">
            <div className="inline-flex items-center gap-2 font-label-md text-label-md font-bold uppercase tracking-wider text-secondary">
              <span aria-hidden className="h-0.5 w-6 bg-secondary" />
              <span>Sambutan Kepala Sekolah</span>
            </div>

            <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
              Kecerdasan Buatan dan Masa Depan Pendidikan
            </h2>

            <div className="space-y-space-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
              <p className="font-title-md text-title-md font-semibold text-primary">
                Kalian adalah generasi di mana kecerdasan buatan bukan lagi fiksi ilmiah, melainkan bagian dari kehidupan sehari-hari. Kalianlah yang akan menentukan, apakah AI menjadi alat yang memajukan pendidikan, atau justru sekadar teknologi yang kehilangan ruh.
              </p>
              <p>
                Melalui tema ini, kita diajak untuk berpikir kritis: Bagaimana AI dapat diintegrasikan ke dalam profil sekolah kita? Bukan sekadar sebagai teknologi, tetapi sebagai sarana untuk:
              </p>
              <ul className="list-none space-y-2 pl-0">
                <li>- Memperkuat karakter dan integritas warga sekolah,</li>
                <li>- Meningkatkan kualitas pembelajaran yang berpihak pada murid,</li>
                <li>- Dan menyiapkan lulusan SMK yang siap bersaing di dunia kerja digital.</li>
              </ul>
              <p>
                Tunjukkan kreativitas, kolaborasi, dan integritas kalian. Ingatlah, juara bukanlah satu-satunya tujuan. Yang lebih penting adalah proses belajar, keberanian berinovasi, dan semangat sportifitas. Selamat berlomba
              </p>
            </div>

            <div className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
              <div>
                <h3 className="font-title-md text-title-md font-bold text-primary">Dra. Isfariani</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Kepala SMK Negeri 24 Jakarta</p>
              </div>
              <span aria-hidden className="material-symbols-outlined text-[32px] text-secondary">signature</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
