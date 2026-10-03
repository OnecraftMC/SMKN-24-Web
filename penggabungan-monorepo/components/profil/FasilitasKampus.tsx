import Image from "next/image";
import Link from "next/link";
import type { FasilitasView } from "@/lib/shared/mappers";

export default function FasilitasKampus({
  fasilitas,
  error,
  variant = "all",
}: {
  fasilitas: FasilitasView[];
  error: string | null;
  variant?: "all" | "featured";
}) {
  if (variant === "featured") {
    const unggulan = fasilitas.filter((item) => item.unggulan);

    return (
      <section className="w-full bg-surface-container-low py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-container-max mx-auto space-y-space-lg">
          <div className="flex flex-wrap items-end justify-between gap-space-md">
            <div className="max-w-2xl space-y-2">
              <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
                Pilihan Sekolah
              </span>
              <h2 className="font-headline-md text-headline-md font-bold text-primary">
                Fasilitas Unggulan
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Sarana pilihan yang mendukung kegiatan belajar dan pengembangan keterampilan.
              </p>
            </div>
            <Link
              href="/fasilitas"
              className="inline-flex min-h-11 items-center gap-2 font-label-md text-label-md font-bold text-primary hover:text-secondary"
            >
              Lihat keseluruhan fasilitas
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          {error && unggulan.length === 0 ? (
            <p
              className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
              role="status"
            >
              Fasilitas unggulan belum dapat dimuat: {error}
            </p>
          ) : unggulan.length === 0 ? (
            <p
              className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
              role="status"
            >
              Belum ada fasilitas yang ditandai sebagai unggulan.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 xl:grid-cols-3">
              {unggulan.map((item) => (
                <article
                  key={item.id}
                  className="flex min-w-0 items-center gap-space-md rounded-xl border border-surface-container bg-surface-container-lowest p-space-sm"
                >
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-high sm:h-24 sm:w-28">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={224}
                        height={192}
                        sizes="112px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary" aria-hidden="true">
                        <span className="material-symbols-outlined text-3xl">apartment</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="inline-flex rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[11px] font-bold text-on-secondary-container">
                      Unggulan
                    </span>
                    <h3 className="line-clamp-1 font-title-md font-bold text-primary">
                      {item.title}
                    </h3>
                    {item.desc && (
                      <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div id="fasilitas" className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Sarana &amp; Prasarana</span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Fasilitas SMKN 24 Jakarta</h2>
          <p className="font-body-md text-on-surface-variant">
            Dirancang higienis, aman, dan berstandar internasional demi menunjang kenyamanan belajar, riset, dan eksplorasi bakat.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-md">
          {fasilitas.map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden border border-surface-container bg-surface-container-lowest shadow-sm group">
              <div className="h-52 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={640} height={420} sizes="(max-width: 768px) 100vw, 33vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-primary" aria-hidden="true">
                    <span className="material-symbols-outlined text-4xl">apartment</span>
                  </div>
                )}
              </div>
              <div className="p-space-md space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-bold text-primary">{item.title}</h3>
                  <span className="material-symbols-outlined text-secondary">local_library</span>
                </div>
                <p className="text-body-sm text-on-surface-variant">{item.desc}</p>
              </div>
            </div>
          ))}
          {fasilitas.length === 0 && (
            <p className="md:col-span-3 rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Fasilitas belum dapat dimuat: ${error}` : "Belum ada fasilitas yang dipublikasikan."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
