import Image from "next/image";

const galeriData = [
  {
    id: 1,
    title: "Upacara Hari Kebangkitan Nasional",
    category: "kegiatan",
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAKaA+gDASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABQIDBAYHAQAICf/EAEwQAAIBAwMCBAQCBwYFAwICCwECAwAEEQUSIQYxEyJBUQcUYXEygRUjQlKRobEIJDNicsEWJTQ10UPh8ReT/8QAIBAAAgMBAQEBAQEAAAAAAAAAAAECAxEEBQYHEAAICAwEAAgMBAAM=",
  },
];

export default function GaleriVisual() {
  return (
    <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Galeri Foto &amp; Lensa Kampus</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Dokumentasi Momen Emas Siswa</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galeriData.map((item) => (
            <div key={item.id} className="galeri-card group relative rounded-3xl overflow-hidden aspect-[3/4] border border-surface-container shadow-md cursor-pointer">
<Image
                src={item.image}
                alt={item.title}
                width={300}
                height={400}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
