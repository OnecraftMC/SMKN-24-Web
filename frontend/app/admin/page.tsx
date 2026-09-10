"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import Ringkasan from "@/components/admin/pages/Ringkasan";
import BeritaList from "@/components/admin/pages/BeritaList";
import BeritaEditor from "@/components/admin/pages/BeritaEditor";
import Pengumuman from "@/components/admin/pages/Pengumuman";
import Agenda from "@/components/admin/pages/Agenda";
import Galeri from "@/components/admin/pages/Galeri";
import Jadwal from "@/components/admin/pages/Jadwal";
import BK from "@/components/admin/pages/BK";
import Arsip from "@/components/admin/pages/Arsip";
import Guru from "@/components/admin/pages/Guru";

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState("ringkasan");
  const [modals, setModals] = useState<{ [key: string]: boolean }>({});

  const openModal = (id: string) => setModals((prev) => ({ ...prev, [id]: true }));
  const closeModal = (id: string) => setModals((prev) => ({ ...prev, [id]: false }));

  const pageTitles: { [key: string]: string } = {
    ringkasan: "Ringkasan",
    berita: "Berita",
    "berita-editor": "Tulis Berita",
    pengumuman: "Pengumuman",
    agenda: "Agenda & Kegiatan",
    galeri: "Galeri",
    jadwal: "Jadwal Pelajaran",
    bk: "Pengaduan BK",
    arsip: "Pusat Arsip",
    guru: "Direktori Guru",
  };

  return (
    <div className="min-h-screen flex bg-surface font-body-md text-body-md text-on-surface antialiased">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar pageTitle={pageTitles[currentPage] || "Dashboard"} />
        <main className="flex-1 p-margin-mobile lg:p-space-xl bg-surface">
          {currentPage === "ringkasan" && <Ringkasan />}
          {currentPage === "berita" && <BeritaList openModal={openModal} setCurrentPage={setCurrentPage} />}
          {currentPage === "berita-editor" && <BeritaEditor setCurrentPage={setCurrentPage} />}
          {currentPage === "pengumuman" && <Pengumuman openModal={openModal} />}
          {currentPage === "agenda" && <Agenda openModal={openModal} />}
          {currentPage === "galeri" && <Galeri openModal={openModal} />}
          {currentPage === "jadwal" && <Jadwal />}
          {currentPage === "bk" && <BK />}
          {currentPage === "arsip" && <Arsip openModal={openModal} />}
          {currentPage === "guru" && <Guru openModal={openModal} />}
        </main>
      </div>
    </div>
  );
}