const fasilitasData = [
  {
    id: 1,
    title: "Hotel Training & Dapur Produksi",
    desc: "Kamar dan front office standar hotel bintang, serta dapur produksi untuk praktik jurusan Perhotelan dan Kuliner.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChT2PeZggy9dqu-ed7b1dYPGhsQA3N2A1GnPYfwEe9dgTMdHzfvkuC2EVzZDim8IggzH77L3DeTkU47I3hd3AroHD9Pd_vY-lKqyvU-U1UIZXobGovlLKPKQ-pRfoosJwfEaO_uQMDQmbbe7gK7iH4BDkrLMza6uGEX9iUO28z27QSv3bCuHjauHeTIpBfjEV0vggF2XXnGWL612SzX91sqZQFGVPp69En7AbcSAOR_xLT2LUmFpgJ4g",
  },
  {
    id: 2,
    title: "Laboratorium Komputer & RPL",
    desc: "Perangkat komputer terhubung jaringan untuk praktik pemrograman, basis data, dan pengembangan gim jurusan RPL.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOsWkk-j7qXqBJgHct-C8j0jbY2TDql4pGZ6kXH7DjRn_vJqHkEiIXCOKQSU9GFeh9QiRpemG3O2oE9Uop7F885H2Lab9ZpH9zcriwaJXnW_gWHIfsWfQtQPTlKhBt2pIa5RiKXrK3UqcyGt2RZ-MXwcFmGGm_alsjtVkfhrNPtlt79zrBZUKiIYdTS7_Cl7RoqOAKWXB3SuRNtVf-jf38IiXDg8kNirxCH-atW65MTNbodJtILo6Y-A",
  },
  {
    id: 3,
    title: "Ruang Busana & Sanggar Jahit",
    desc: "Mesin jahit dan alat pola lengkap untuk praktik desain dan produksi busana jurusan Tata Busana.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBv2gsmwVQQXuEisDz_029cfyYGMZh2wZkXUsRT5IQ5NTSH5jB7ILql-0hgAoLO3J2s-Qh2sAMypearcPL1eFrVfnHzfTPYjedbCQikJtEb8z5zhXWKebxAo9dFxMyiLhzzXWAvkPqVY0e07TeirvGye5zLbwgzI4n3XTH6KToEprqgiVK6-WjDCWFtFRSyVNZEd6_H-Jn_Kx4QJV1y6kUNDRJ0QEKexLbiQznW6NHOcsuT8wVtiEbfCA",
  },
];

export default function FasilitasKampus() {
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
          {fasilitasData.map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden border border-surface-container bg-surface-container-lowest shadow-sm group">
              <div className="h-52 overflow-hidden">
<img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        </div>
      </div>
    </div>
  );
}
