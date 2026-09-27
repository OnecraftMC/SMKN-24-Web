import Image from "next/image";
import type { FasilitasView } from "../../../../packages/shared/mappers";

export default function FasilitasKampus({
  fasilitas,
  error,
}: {
  fasilitas: FasilitasView[];
  error: string | null;
}) {
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
