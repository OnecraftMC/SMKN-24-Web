"use client";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const navItems = [
    { id: "ringkasan", icon: "dashboard", label: "Ringkasan" },
    { id: "berita", icon: "article", label: "Berita" },
    { id: "pengumuman", icon: "campaign", label: "Pengumuman" },
    { id: "agenda", icon: "event", label: "Agenda & Kegiatan" },
    { id: "galeri", icon: "photo_library", label: "Galeri" },
    { id: "jadwal", icon: "calendar_month", label: "Jadwal Pelajaran" },
    { id: "bk", icon: "support_agent", label: "Pengaduan BK" },
    { id: "arsip", icon: "folder_zip", label: "Pusat Arsip" },
    { id: "guru", icon: "groups", label: "Direktori Guru" },
  ];

  const groups = [
    { label: "Konten", items: ["berita", "pengumuman", "agenda", "galeri"] },
    { label: "Akademik", items: ["jadwal", "bk", "arsip"] },
    { label: "Sekolah", items: ["guru"] },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-primary-container text-surface min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-space-sm px-space-lg py-space-lg border-b border-surface/10">
        <img
          alt="Logo SMKN 24 Jakarta"
          className="h-9 w-auto object-contain rounded-md"
          src="/logo-smkn24.png"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-label-md text-label-md font-bold">SMKN 24 Jakarta</span>
          <span className="font-label-sm text-label-sm text-surface-container-high">Dashboard Admin</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-space-md px-space-sm space-y-space-2xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            data-page-link={item.id}
            className={`sidebar-link w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md text-left transition-all ${
              currentPage === item.id ? "active" : ""
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-space-md py-space-md border-t border-surface/10">
        <button className="w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md text-left text-surface-container-high hover:bg-surface/10 transition-all">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Keluar</span>
        </button>
      </div>

      <style jsx>{`
        .sidebar-link {
          color: #eaf1ff;
          opacity: 0.85;
        }
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.08);
          opacity: 1;
        }
        .sidebar-link.active {
          background: #fea619;
          color: #684000;
          opacity: 1;
          font-weight: 700;
        }
      `}</style>
    </aside>
  );
}