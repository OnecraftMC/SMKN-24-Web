import type { Metadata } from "next";
import { Sparkles, UsersRound } from "lucide-react";
import EkstrakurikulerKampus from "@/components/ekstrakurikuler/EkstrakurikulerKampus";
import FeaturedNews from "@/components/kabar/FeaturedNews";
import { Reveal } from "@/components/ui/Reveal";
import { getBerita, getEkstrakurikuler } from "@/lib/api";

export const metadata: Metadata = {
  title: "Ekstrakurikuler — SMK Negeri 24 Jakarta",
  description:
    "Jelajahi ekstrakurikuler SMKN 24 Jakarta: olahraga, seni, kepemimpinan, sosial, dan akademik. Lengkap dengan logo, pembina, jadwal, dan lokasi latihan.",
};

const alur = [
  {
    title: "Pilih ekstrakurikuler",
    desc: "Kenali minat dan jadwalnya lewat kartu di bawah.",
  },
  {
    title: "Hubungi pembina",
    desc: "Tanyakan kuota, perlengkapan, dan cara mendaftar.",
  },
  {
    title: "Ikuti latihan perdana",
    desc: "Datang sesuai jadwal, kenalan, lalu resmi bergabung.",
  },
];

export default async function EkstrakurikulerPage() {
  const [ekstrakurikulerRes, utamaRes] = await Promise.all([
    getEkstrakurikuler(),
    getBerita({ utama: true }),
  ]);
  const ekstrakurikuler = ekstrakurikulerRes.data ?? [];

  return (
    <>
      <Reveal>
        <section className="relative overflow-hidden bg-primary px-margin-mobile py-space-2xl text-on-primary md:px-margin-tablet lg:px-margin-desktop">
          <span aria-hidden className="micro-float absolute -left-20 top-10 h-52 w-52 rounded-full bg-secondary-container/15 blur-2xl" />
          <span aria-hidden className="micro-float-slow absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <span aria-hidden className="absolute right-1/4 top-0 h-px w-2/5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-container-max items-center gap-space-lg lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 font-label-sm font-bold uppercase tracking-wider text-secondary-container">
                <UsersRound aria-hidden className="micro-icon h-[18px] w-[18px]" />
                <span>Kesiswaan &amp; Pengembangan Bakat</span>
              </div>
              <h1 className="max-w-3xl font-headline-lg text-headline-lg font-bold tracking-tight text-surface lg:text-[2.75rem]">
                Temukan Ekstrakurikuler yang Tepat untukmu
              </h1>
              <p className="max-w-3xl font-body-lg text-primary-fixed">
                Dari olahraga hingga seni dan kepemimpinan — setiap kegiatan punya logo, info pembina,
                jadwal, dan lokasi latihan yang bisa diperbarui admin sekolah.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-surface ring-1 ring-white/20">
                  <Sparkles aria-hidden className="h-4 w-4 text-secondary-container" />
                  {ekstrakurikuler.length} kegiatan aktif
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-surface ring-1 ring-white/20">
                  Logo resmi tiap kegiatan
                </span>
              </div>
            </div>

            <div className="micro-stagger grid grid-cols-2 gap-3" aria-hidden>
              {ekstrakurikuler.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="micro-card micro-shine flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/90">
                    {item.logo ? (
                      // Logo contoh/unggahan admin; object-contain menjaga bentuk asli.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logo}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="line-clamp-2 text-xs font-bold text-surface">{item.nama}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>

      <Reveal>
        <EkstrakurikulerKampus ekstrakurikuler={ekstrakurikuler} error={ekstrakurikulerRes.error} />
      </Reveal>

      <Reveal>
        <section className="w-full bg-surface-container-low px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin-desktop">
          <div className="mx-auto max-w-container-max space-y-space-lg">
            <div className="max-w-2xl space-y-2">
              <span className="font-label-md font-bold uppercase tracking-wider text-secondary">
                Alur Bergabung
              </span>
              <h2 className="font-headline-md text-headline-md font-bold text-primary">
                Tiga langkah memulai kegiatan
              </h2>
            </div>
            <div className="micro-stagger grid gap-gutter-md md:grid-cols-3">
              {alur.map((langkah, index) => (
                <article
                  key={langkah.title}
                  className="micro-card group relative overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
                >
                  <span className="micro-float grid h-11 w-11 place-items-center rounded-2xl bg-primary text-lg font-bold text-surface shadow-md">
                    {index + 1}
                  </span>
                  <h3 className="mt-space-md font-title-md font-bold text-primary">{langkah.title}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{langkah.desc}</p>
                  <span
                    aria-hidden
                    className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-secondary-container/20 blur-xl transition-transform duration-500 group-hover:scale-150"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
