"use client";

import { useState } from "react";
import Image from "next/image";
import type { GuruView } from "../../../../packages/shared/mappers";

export default function DewanGuru({
  guru,
  error,
}: {
  guru: GuruView[];
  error: string | null;
}) {
  const [filter, setFilter] = useState("semua");
  const categories = [...new Set(guru.map((item) => item.category))];

  const filteredGuru = filter === "semua" ? guru : guru.filter((item) => item.category === filter);

  return (
    <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Pendidik Berdedikasi</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Direktori Guru &amp; Manajemen</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["semua", ...categories].map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={filter === category}
                className={`px-3.5 py-1.5 rounded-lg ${filter === category ? "bg-primary text-surface font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"} font-label-sm text-label-sm`}
                onClick={() => setFilter(category)}
              >
                {category === "semua" ? "Semua" : category}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-md">
          {filteredGuru.map((guru) => (
            <div key={guru.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden p-space-md border border-surface-container shadow-sm text-center space-y-3">
                {guru.image ? (
                  <Image src={guru.image} alt={guru.name} width={112} height={112} className="w-28 h-28 mx-auto rounded-full object-cover ring-4 ring-primary/10" />
                ) : (
                  <div className="w-28 h-28 mx-auto rounded-full bg-surface-container-high text-primary flex items-center justify-center ring-4 ring-primary/10" aria-hidden="true">
                    <span className="material-symbols-outlined text-4xl">person</span>
                  </div>
                )}
              <div>
                <h4 className="font-title-md font-bold text-primary">{guru.name}</h4>
                <p className="text-xs font-semibold text-secondary">{guru.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{guru.desc}</p>
              </div>
            </div>
          ))}
          {filteredGuru.length === 0 && (
            <p className="sm:col-span-2 lg:col-span-4 rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Direktori guru belum dapat dimuat: ${error}` : "Belum ada data guru untuk kategori ini."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
