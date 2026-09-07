export default function VisiMisi() {
  return (
    <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter-lg items-stretch">
          <div className="p-space-xl rounded-3xl bg-surface-container-lowest border border-surface-container shadow-sm flex flex-col justify-between">
            <div className="space-y-space-md">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">visibility</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Visi Sekolah</h2>
              <blockquote className="text-body-lg text-on-surface leading-relaxed border-l-4 border-secondary-container pl-4 italic">
                "Mewujudkan pendidikan kejuruan yang berlandaskan imtaq, mandiri, dan berwawasan lingkungan."
              </blockquote>
            </div>
            <div className="pt-space-lg flex items-center gap-3 text-secondary font-label-md font-bold">
              <span className="material-symbols-outlined text-[20px]">stars</span>
              <span>Kompeten • Mandiri • Berwawasan Lingkungan</span>
            </div>
          </div>
          <div className="p-space-xl rounded-3xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary text-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">flag</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary font-bold">Misi Strategis</h2>
            <ul className="space-y-3 font-body-md text-on-surface-variant">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Menanamkan keimanan dan ketakwaan kepada Tuhan Yang Maha Esa dalam setiap aktivitas pembelajaran.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Menyelenggarakan pembelajaran yang menyenangkan dengan mengintegrasikan kompetensi keterampilan 4C (Creativity, Critical Thinking, Collaboration, Communication).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Memberdayakan sarana dan prasarana pendidikan yang berkualitas serta berbasis lingkungan, terhubung dengan dunia usaha dan dunia industri.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-primary-container text-surface rounded-3xl p-space-xl lg:p-space-2xl">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-space-xl">
            <span className="text-secondary-fixed font-label-sm uppercase font-bold tracking-wider">Nilai Filosofis</span>
            <h3 className="text-headline-md font-bold text-surface">Panca Karakter SMKN 24 Jakarta</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter-sm text-center">
            <div className="p-space-md rounded-2xl bg-surface-container-high/10 border border-surface-container-high/15">
              <span className="material-symbols-outlined text-secondary-container text-[36px] mb-2">military_tech</span>
              <h4 className="font-title-md font-bold text-surface">Integritas</h4>
              <p className="font-body-sm text-surface-container-high mt-1 text-xs">Jujur, dapat dipercaya, dan menjunjung kebenaran etis.</p>
            </div>
            <div className="p-space-md rounded-2xl bg-surface-container-high/10 border border-surface-container-high/15">
              <span className="material-symbols-outlined text-secondary-container text-[36px] mb-2">lightbulb</span>
              <h4 className="font-title-md font-bold text-surface">Inovatif</h4>
              <p className="font-body-sm text-surface-container-high mt-1 text-xs">Kreatif menciptakan terobosan bermanfaat untuk bangsa.</p>
            </div>
            <div className="p-space-md rounded-2xl bg-surface-container-high/10 border border-surface-container-high/15">
              <span className="material-symbols-outlined text-secondary-container text-[36px] mb-2">volunteer_activism</span>
              <h4 className="font-title-md font-bold text-surface">Empati</h4>
              <p className="font-body-sm text-surface-container-high mt-1 text-xs">Peka dan peduli pada sesama serta lingkungan sosial.</p>
            </div>
            <div className="p-space-md rounded-2xl bg-surface-container-high/10 border border-surface-container-high/15">
              <span className="material-symbols-outlined text-secondary-container text-[36px] mb-2">language</span>
              <h4 className="font-title-md font-bold text-surface">Kebangsaan</h4>
              <p className="font-body-sm text-surface-container-high mt-1 text-xs">Cinta tanah air dengan daya saing global tanpa batas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
