"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { BeritaDTO } from "@/lib/admin/types";
import { ListState } from "@/components/admin/ui/FormBits";
import BeritaEditorForm from "../BeritaEditorForm";

/** Halaman edit berita (halaman penuh gaya WP/Blogger). */
export default function BeritaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { logout } = useAuth();
  const [row, setRow] = useState<BeritaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<BeritaDTO>(`/api/berita/index.php?id=${encodeURIComponent(id)}`)
      .then((data) => {
        if (cancelled) return;
        setRow(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat berita.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, logout]);

  if (loading || error || !row) {
    return (
      <div className="space-y-space-lg">
        <Link
          href="/admin/berita"
          className="inline-flex items-center gap-2 font-label-md font-bold text-primary hover:text-secondary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Kembali ke daftar berita
        </Link>
        <ListState
          loading={loading}
          error={error}
          empty={!loading && !error && !row}
          emptyLabel="Berita tidak ditemukan."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

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
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Edit berita</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{row.judul}</p>
      </header>

      <BeritaEditorForm editing={row} onUnauthorized={logout} />
    </div>
  );
}
