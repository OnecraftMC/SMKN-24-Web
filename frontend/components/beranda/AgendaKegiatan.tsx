import Link from "next/link";

const agendaData = [
  {
    id: 1,
    day: 12,
    month: "NOV",
    badge: "Aktivitas Siswa",
    title: "Pekan Olahraga & Seni (PORSENI)",
    desc: "Kompetisi antarkelas, pentas bakat musik nusantara, dan bazaar kewirausahaan siswa.",
    time: "07.30 - 15.00 WIB",
  },
  {
    id: 2,
    day: 18,
    month: "NOV",
    badge: "Komite Sekolah",
    title: "Pertemuan Orang Tua & Wali",
    desc: "Sosialisasi progres akademik, evaluasi karakter tengah semester, dan seminar parenting.",
    time: "08.30 - 11.30 WIB",
  },
  {
    id: 3,
    day: 25,
    month: "NOV",
    badge: "Peringatan Akbar",
    title: "Peringatan Hari Guru Nasional",
    desc: "Upacara khidmat, persembahan apresiasi siswa, dan penganugerahan Guru Inspiratif 2024.",
    time: "07.00 - 10.30 WIB",
  },
];

export default function AgendaKegiatan() {
  return (
    <section className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">
              Kalender Sekolah
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Agenda &amp; Aktivitas Terdekat
            </h2>
          </div>
          <Link
            href="/akademik"
            className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold hover:text-secondary transition-colors"
          >
            <span>Kalender Akademik Lengkap</span>
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-md">
          {agendaData.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex items-start gap-space-md border border-surface-container"
            >
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-primary text-surface flex flex-col items-center justify-center text-center">
                <span className="font-headline-md text-headline-md font-extrabold text-secondary-container leading-none">
                  {item.day}
                </span>
                <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-surface-container-high">
                  {item.month}
                </span>
              </div>
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-xs font-bold">
                  {item.badge}
                </span>
                <h3 className="font-title-md text-title-md text-primary font-bold">{item.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
                <p className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}