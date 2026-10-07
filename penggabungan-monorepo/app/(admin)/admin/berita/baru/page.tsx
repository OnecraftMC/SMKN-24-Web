"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import BeritaEditorForm from "../BeritaEditorForm";

/** Halaman buat berita baru (halaman penuh gaya WP/Blogger). */
export default function BeritaBaruPage() {
  const { logout } = useAuth();

  return (
    <div className="space-y-space-lg">
      <header>
        <Link
          href="/admin/berita"
          className="mb-space-sm inline-flex items-center gap-2 font-label-md font-bold text-primary hover:text-secondary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Kembali ke daftar berita
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Buat berita baru</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Tulis manual dengan editor di bawah, atau minta AI menyusun draf dari catatan singkat.
        </p>
      </header>

      <BeritaEditorForm editing={null} onUnauthorized={logout} />
    </div>
  );
}
