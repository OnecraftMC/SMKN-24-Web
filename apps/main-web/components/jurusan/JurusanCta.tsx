import Link from "next/link";

// Pita penutup halaman /jurusan. Kedua tautan hidup: /kabar (rute nyata) dan
// SPMB DKI — URL yang sama dipakai Navbar/MobileMenu (komponen server, tanpa JS).
export default function JurusanCta() {
  return (
    <div className="px-margin-mobile md:px-margin-tablet lg:px-margin-desktop pb-space-4xl">
      <div className="max-w-container-max mx-auto relative overflow-hidden rounded-3xl bg-primary px-margin-mobile py-space-2xl md:px-space-2xl">
        <div aria-hidden="true" className="absolute -right-10 -top-24 select-none">
          <span className="material-symbols-outlined text-[11rem] leading-none text-primary-container">
            school
          </span>
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-headline-md text-headline-md font-bold text-surface">
              Belum yakin memilih jurusan?
            </h2>
            <p className="font-body-md text-primary-fixed">
              Tinjau galeri kegiatan untuk melihat langsung praktik belajar di setiap
              kompetensi keahlian, lalu daftarkan diri melalui SPMB DKI Jakarta.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/kabar"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-space-lg py-3 font-label-md text-label-md font-bold text-on-secondary-container transition hover:brightness-95"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                photo_library
              </span>
              <span>Galeri Kegiatan</span>
            </Link>
            <a
              href="https://spmb.jakarta.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-fixed/40 px-space-lg py-3 font-label-md text-label-md font-bold text-surface transition hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                open_in_new
              </span>
              <span>SPMB Online</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}