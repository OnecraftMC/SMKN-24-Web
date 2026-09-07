import Image from "next/image";

const beritaUtama = {
  title: "Tim Perhotelan SMKN 24 Raih Emas Lomba Kompetensi Siswa (LKS) Tingkat DKI Jakarta",
  category: "Headline Prestasi",
  date: "28 Oktober 2024",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD56zdMGi-R7klP7dXy_uGqIo48HvcYbleLo-9LxgObyyGJN_sPpq3l9Us_GL5TvNioJQa-bWD1aRUzbzUUHBOxXfOR22H5KAfxg13TOhHucj6brZznxRvrnU_pD48Hz8TuoS2LoX90-uqMBgkWqRVmPpb4NcdQgg8IEmzErVFZ4oldYBCT1U_sYrchk_uxXhaeiNFrxgeYHctWBL8sDt7UFtFRlu-Ilt3oyqYbmCNcau6rMxJ5QVtkwg",
  excerpt: "Tim riset fisika dan komputasi kami mencatatkan sejarah baru dengan memenangkan medali emas dalam kompetisi bergengsi tingkat nasional di Balikpapan.",
};

export default function FeaturedNews() {
  return (
    <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="rounded-3xl overflow-hidden bg-surface-container-lowest border border-surface-container shadow-lg grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 h-72 lg:h-[420px] overflow-hidden">
            <Image
              src={beritaUtama.image}
              alt={beritaUtama.title}
              width={800}
              height={500}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="lg:col-span-5 p-space-lg lg:p-space-xl space-y-space-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-bold uppercase text-[11px]">
                {beritaUtama.category}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">{beritaUtama.date}</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold text-primary leading-tight">
              {beritaUtama.title}
            </h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {beritaUtama.excerpt}
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">visibility</span> 1.420 Pembaca
              </span>
              <button className="px-4 py-2 rounded-xl bg-primary text-surface font-label-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-1">
                <span>Baca Lengkap</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
