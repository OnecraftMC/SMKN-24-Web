"use client";

import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden bg-primary text-on-primary">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <circle cx="1200" cy="150" fill="#fea619" r="450" />
          <circle cx="150" cy="650" fill="#5f8aff" r="300" />
          <path d="M-100 200 L1600 700" stroke="#d5e3ff" strokeDasharray="12 12" strokeWidth="1.5" />
          <path d="M-50 400 L1500 850" stroke="#fea619" strokeDasharray="8 8" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop pt-space-2xl pb-space-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          {/* Left content */}
          <div className="lg:col-span-7 space-y-space-lg">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-highest/20 backdrop-blur-md text-secondary-fixed">
              <span
                className="material-symbols-outlined text-[18px] text-secondary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Penerimaan Peserta Didik Baru 2026/2027 Segera Dibuka
              </span>
            </div>

            <h1 className="font-display-hero text-headline-lg lg:text-display-hero text-on-primary font-extrabold tracking-tight leading-none">
              Mencetak Tenaga Kerja <span className="text-secondary-container">Kompeten</span>,
              Mandiri &amp; Siap Bersaing di Dunia Industri.
            </h1>

            <p className="font-body-lg text-body-lg text-primary-fixed max-w-2xl font-normal leading-relaxed">
              Sekolah Menengah Kejuruan Negeri terakreditasi A, Program Sekolah Penggerak
              Kemendikbudristek, dengan lima kompetensi keahlian berbasis Kurikulum Merdeka dan tautan
              langsung ke dunia usaha &amp; industri.
            </p>

            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <Link
                href="/#lokasi-sekolah"
                className="inline-flex items-center justify-center gap-2 px-space-xl py-3.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shadow-xl hover:bg-secondary-fixed-dim transition-all group"
              >
                <span>Lihat Lokasi Sekolah</span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/profil"
                className="inline-flex items-center justify-center gap-2 px-space-lg py-3.5 rounded-lg bg-surface-container-highest/15 text-surface font-label-md text-label-md font-semibold backdrop-blur hover:bg-surface-container-highest/30 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">explore</span>
                <span>Jelajahi Profil Sekolah</span>
              </Link>
            </div>

            <div className="pt-space-md flex items-center gap-space-lg text-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">
                  workspace_premium
                </span>
                <span className="font-label-sm text-label-sm">Terakreditasi A • BAN-S/M 2021</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">
                  public
                </span>
                <span className="font-label-sm text-label-sm">
                  Sekolah Penggerak Kemendikbudristek
                </span>
              </div>
            </div>
          </div>

          {/* Right image card */}
          <div className="lg:col-span-5 relative mt-space-xl lg:mt-0">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-secondary-container/20 to-primary-container blur-2xl -z-10" />

              <div className="overflow-hidden rounded-2xl shadow-2xl bg-primary-container">
                <img
                  alt="Gedung SMKN 24 Jakarta"
                  className="w-full h-80 lg:h-[420px] object-cover hover:scale-105 transition-transform duration-700"
                  src="https://ak-d.tripcdn.com/images/0220v12000abn4uu41DB9_R_960_660_R5_D.jpg"                />

                <div className="p-space-md bg-primary-container flex items-center justify-between text-surface">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[22px]">waving_hand</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md font-bold text-surface">Selamat Datang</p>
                      <p className="font-body-sm text-body-sm text-on-primary-container">
                        Siswa/Siswi SMK Negeri 24 Jakarta
                      </p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-xs py-1 rounded bg-secondary-container/20 text-secondary-fixed">
                    Sambutan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}