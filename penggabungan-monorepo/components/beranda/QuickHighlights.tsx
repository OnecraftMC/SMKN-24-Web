const highlights = [
  {
    icon: "groups",
    label: "Siswa Aktif",
    value: "1.200+",
    desc: "5 Kompetensi Keahlian Terpadu",
  },
  {
    icon: "school",
    label: "Pendidik",
    value: "58 Guru",
    desc: "100% Tersertifikasi Profesional",
  },
  {
    icon: "military_tech",
    label: "Akreditasi",
    value: "A",
    desc: "Predikat 'A' Unggul Nasional",
  },
  {
    icon: "trophy",
    label: "Prestasi",
    value: "100+",
    desc: "Juara Tingkat Provinsi & Nasional",
  },
];

export default function QuickHighlights() {
  return (
    <div className="w-full -mt-space-2xl relative z-20 px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter-sm bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-xl shadow-primary/5 border border-surface-container">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="group p-space-md flex flex-col justify-center rounded-xl bg-surface-container-low transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex items-center gap-2 text-secondary font-bold mb-1">
                <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none">{item.icon}</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {item.label}
                </span>
              </div>
              <span className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-primary font-extrabold leading-none tracking-tight">
                {item.value}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
