"use client";

import Image from "next/image";
import { useState } from "react";
import KantinStorefront from "@/components/kantin/KantinStorefront";

export default function KantinFacilitySection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="px-margin-mobile py-space-lg md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="fasilitas-kantin-content"
          onClick={() => setIsOpen((open) => !open)}
          className="group grid w-full overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-xl active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none md:grid-cols-[1.1fr_1fr]"
        >
          <div className="relative min-h-56 overflow-hidden bg-primary-container md:min-h-72">
            <Image src="/images/kantin-sekolah.svg" alt="Ilustrasi area kantin sekolah" fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" />
            <span className="absolute left-5 top-5 rounded-full bg-surface/90 px-3 py-1 font-label-sm text-label-sm font-bold text-primary shadow-sm">Fasilitas sekolah</span>
          </div>
          <div className="flex flex-col justify-center gap-4 p-space-lg md:p-space-xl">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"><span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 motion-reduce:transition-none">restaurant</span> Kantin sekolah</span>
            <h2 className="font-headline-md text-headline-md font-bold text-primary">Pesan makanan dari kantin</h2>
            <p className="max-w-xl font-body-md text-body-md text-on-surface-variant">Pilih stand, lihat menu, lalu pesan makanan atau minuman untuk diantar ke kelas atau diambil sendiri.</p>
            <span className="inline-flex items-center gap-2 font-label-md text-label-md font-bold text-primary">{isOpen ? "Tutup pilihan kantin" : "Lihat stand kantin"}<span className={`material-symbols-outlined transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-90" : "group-hover:translate-x-1"}`}>arrow_forward</span></span>
          </div>
        </button>
        <div id="fasilitas-kantin-content" aria-hidden={!isOpen} className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-out motion-reduce:transition-none ${isOpen ? "mt-6 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0 overflow-hidden">
            {isOpen && <KantinStorefront embedded />}
          </div>
        </div>
      </div>
    </section>
  );
}
