"use client";

import Link from "next/link";
import Image from "next/image";

const beritaData = [
  {
    id: 1,
    tag: "Prestasi Siswa",
    tanggal: "28 Oktober 2024",
    judul: "Tim Perhotelan SMKN 24 Raih Emas Lomba Kompetensi Siswa (LKS) Tingkat DKI Jakarta",
    deskripsi:
      "Peserta didik jurusan Perhotelan berhasil mengungguli kontestan SMK se-DKI Jakarta pada cabang lomba Housekeeping dan Food &amp; Beverage Service.",
    gambar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD56zdMGi-R7klP7dXy_uGqIo48HvcYbleLo-9LxgObyyGJN_sPpq3l9Us_GL5TvNioJQa-bWD1aRUzbzUUHBOxXfOR22H5KAfxg13TOhHucj6brZznxRvrnU_pD48Hz8TuoS2LoX90-uqMBgkWqRVmPpb4NcdQgg8IEmzErVFZ4oldYBCT1U_sYrchk_uxXhaeiNFrxgeYHctWBL8sDt7UFtFRlu-Ilt3oyqYbmCNcau6rMxJ5QVtkwg",
  },
  {
    id: 2,
    tag: "Studi Industri",
    tanggal: "20 Oktober 2024",
    judul: "PKL Terpadu: Siswa RPL Magang di Perusahaan Pengembang Perangkat Lunak Mitra Industri",
    deskripsi:
      "Program Praktik Kerja Lapangan (PKL) semester ini menempatkan siswa RPL di perusahaan mitra sesuai skema link and match dunia usaha &amp; industri.",
    gambar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDw458QSA1sjuTi0dDyTMR-NSHYv6B6OZ3_hAq_49MQnz3-hCJfOZN62qrBJI5VKKPqznYeHkpOMHfe1Ghr3_Ad2fHrTpVvafpbq1ONN2FskBoKmsoYXClHmYCrhzYvfnzmD1j5f5ClF5gDRrT8c7rk-xC8Yfvxv2Pr5KLzzFFR4bEhnFpAD3NJ117rHfPjFe-ZtJlJahwslW3Sx8f0o1_yK01jLQEOmGS8uDDHDu900VCrqMxENZr0fA",
  },
];

export default function BeritaTerkini() {
  return (
    <div className="lg:col-span-7 space-y-space-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-secondary font-bold font-label-sm text-label-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">newspaper</span>
            <span>Warta Terkini</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">
            Kabar &amp; Prestasi Kampus
          </h2>
        </div>
        <Link
          href="/kabar"
          className="text-secondary font-label-md text-label-md font-bold hover:underline flex items-center gap-1"
        >
          <span>Semua Berita</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      <div className="space-y-space-md">
        {beritaData.map((item) => (
          <article
            key={item.id}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row group border border-surface-container cursor-pointer"
            onClick={() => (window.location.href = "/kabar")}
          >
            <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
              <img
                alt={item.tag}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={item.gambar}
              />
            </div>
            <div className="p-space-md sm:w-3/5 flex flex-col justify-between space-y-space-xs">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    {item.tag}
                  </span>
                  <span className="text-outline text-xs">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    {item.tanggal}
                  </span>
                </div>
                <h3 className="font-title-md text-title-md text-primary font-bold group-hover:text-secondary transition-colors">
                  {item.judul}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                  {item.deskripsi}
                </p>
              </div>
              <div className="pt-space-xs flex items-center gap-1 text-primary font-semibold font-label-sm text-label-sm">
                <span>Baca Selengkapnya</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}