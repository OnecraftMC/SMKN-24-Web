"use client";

import { useCallback, useEffect, useState } from "react";
import ImageField from "@/components/admin/ui/ImageField";
import { buttonPrimaryClass, ListState } from "@/components/admin/ui/FormBits";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";

type StrukturOrganisasiDTO = { gambar: string | null };

export default function StrukturOrganisasiAdminPage() {
  const { logout } = useAuth();
  const [gambar, setGambar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<StrukturOrganisasiDTO>("/api/struktur-organisasi/index.php");
        if (!cancelled) setGambar(data.gambar);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat struktur organisasi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey, logout]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiRequest<StrukturOrganisasiDTO>("/api/struktur-organisasi/index.php", {
        method: "PUT",
        body: { gambar },
      });
      setSaved(true);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan struktur organisasi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-space-lg">
      <header>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Struktur Organisasi</h1>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Gambar ini ditampilkan di halaman Profil, tepat di atas Direktori Guru.
        </p>
      </header>

      {loading ? (
        <ListState loading error={null} empty={false} emptyLabel="" onRetry={reload} />
      ) : error && gambar === null ? (
        <ListState loading={false} error={error} empty={false} emptyLabel="" onRetry={reload} />
      ) : (
        <section className="space-y-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <ImageField value={gambar} onChange={(path) => { setGambar(path); setSaved(false); }} label="Gambar struktur organisasi" fit="contain" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Gunakan gambar JPEG dengan bagan yang jelas dan berorientasi mendatar. Jika gambar dihapus, situs kembali memakai gambar awal.
          </p>
          {error && <p role="alert" className="font-body-sm text-body-sm font-bold text-error">{error}</p>}
          {saved && <p role="status" className="font-body-sm text-body-sm font-bold text-secondary">Perubahan berhasil disimpan.</p>}
          <div className="flex justify-end border-t border-surface-container pt-space-md">
            <button type="button" className={buttonPrimaryClass} onClick={() => void save()} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
