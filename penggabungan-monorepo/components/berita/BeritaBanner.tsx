import { ArrowDown, Newspaper } from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function BeritaBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 px-margin-mobile py-space-3xl text-surface md:px-margin-tablet lg:px-margin-desktop lg:py-20">
      <div aria-hidden className="absolute -right-20 -top-28 -z-10 h-96 w-96 rounded-full border border-white/10" />
      <div aria-hidden className="absolute -right-4 top-8 -z-10 h-64 w-64 rounded-full border border-white/10" />
      <div aria-hidden className="absolute bottom-0 right-[20%] -z-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
      <div className="mx-auto grid max-w-container-max items-end gap-space-xl lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-4xl space-y-space-md">
          <Badge
            variant="adat"
            className="border border-white/15 bg-white/10 uppercase tracking-wider text-secondary-container"
            aria-label="Warta Sekolah"
            label={
              <>
                <Newspaper aria-hidden className="h-4 w-4" />
                Warta Sekolah
              </>
            }
          />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-surface lg:text-[2.75rem]">
            Cerita, prestasi, dan kabar dari SMKN 24 Jakarta
          </h1>
          <p className="max-w-3xl font-body-lg text-primary-fixed">
            Ikuti kegiatan, pencapaian, dan perkembangan terbaru dari siswa-siswi serta warga sekolah.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {["Kegiatan sekolah", "Prestasi", "Informasi"].map((topic) => (
              <span key={topic} className="rounded-full bg-white/10 px-3 py-1.5 font-label-sm text-label-sm text-surface">
                {topic}
              </span>
            ))}
          </div>
        </div>
        <a
          href="#daftar-berita"
          className="inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-full bg-secondary-container px-5 font-label-md text-label-md font-bold text-on-secondary-container transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-container lg:justify-self-end"
        >
          Jelajahi berita
          <ArrowDown aria-hidden className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
