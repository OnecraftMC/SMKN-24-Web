"use client";

interface TopBarProps {
  pageTitle: string;
}

export default function TopBar({ pageTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-outline-variant/60 px-margin-mobile lg:px-space-xl py-space-md flex items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-sm">
        <button className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary" aria-label="Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 id="page-title" className="font-headline-sm text-headline-sm text-on-surface font-bold">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-space-sm">
        <button className="relative p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant" aria-label="Notifikasi">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>
        <div className="w-px h-6 bg-outline-variant"></div>
        <div className="flex items-center gap-space-xs">
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-label-md text-label-md text-on-secondary-container font-bold">
            HM
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-label-md text-label-md text-on-surface font-bold">Humas SMKN 24</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}