"use client";

/**
 * Sumber tunggal jumlah data modul untuk area admin.
 *
 * Furniture dasbor (Overview) dan rail kiri membaca dari store yang sama,
 * sehingga hanya satu daftar request yang berjalan — tidak ada fetch ganda
 * untuk jumlah yang sama. Modul yang gagal TIDAK diam-diam menjadi nol:
 * setiap sumber menyimpan statusnya sendiri sehingga kegagalannya terbaca di
 * tempat (lencana rail dan strip konteks), bukan diterjemahkan menjadi angka 0.
 *
 * Catatan privasi: yang disimpan adalah data modul untuk hitungan, dan data
 * kerja yang TIDAK memuat identitas siswa (tanpa nama, kelas, nomor HP, isi
 * pesan, dan NISN). Kartu kerja di Overview bersifat anonim; detail tetap
 * eksklusif di /admin/bk dan /admin/prestasi.
 *
 * Sejak Overview “Meja Moderasi” (2026-10), snapshot menyimpan array berita,
 * pengumuman, agenda, guru, fasilitas, ekstrakurikuler, dan galeri — bukan
 * hanya jumlahnya — supaya ledger konten, ritme terbit, dan antrean draft
 * dihitung dari respons yang sama tanpa request tambahan.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import type {
  AgendaDTO,
  BeritaDTO,
  EkstrakurikulerDTO,
  FasilitasDTO,
  GaleriDTO,
  GuruDTO,
  PesanBKDTO,
  PengumumanDTO,
  PrestasiDTO,
} from "@/lib/admin/types";

/** Kunci sumber data; dipakai juga sebagai kunci lencana rail. */
export type ModulKey =
  | "berita"
  | "pengumuman"
  | "agenda"
  | "guru"
  | "fasilitas"
  | "ekstrakurikuler"
  | "galeri"
  | "bk"
  | "prestasi";

export type SumberState<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; value: T };

export type PengumumanRingkas = { items: PengumumanDTO[]; tampilBeranda: number };
/** Antrean prestasi: yang menunggu + yang sudah ditinjau. */
export type PrestasiAntrean = { items: PrestasiDTO[]; baru: number; ditinjau: number };

/** Bentuk respons paginasi `/api/prestasi/index.php`. */
type PrestasiResponse = { items: PrestasiDTO[]; page: number; pageSize: number; total: number };

export type ModulSnapshot = {
  berita: SumberState<BeritaDTO[]>;
  pengumuman: SumberState<PengumumanRingkas>;
  agenda: SumberState<AgendaDTO[]>;
  guru: SumberState<GuruDTO[]>;
  fasilitas: SumberState<FasilitasDTO[]>;
  ekstrakurikuler: SumberState<EkstrakurikulerDTO[]>;
  galeri: SumberState<GaleriDTO[]>;
  bk: SumberState<PesanBKDTO[]>;
  prestasi: SumberState<PrestasiAntrean>;
};

export type ModulContextValue = ModulSnapshot & {
  /** Waktu selesai memuat terakhir (jam lokal), untuk "terakhir dimuat". */
  loadedAt: Date | null;
  /** Sumber yang gagal pada pemuatan terakhir. */
  failures: { key: ModulKey; message: string }[];
  /** True ketika ada request yang sedang berjalan. */
  refreshing: boolean;
  reload: () => void;
};

const INITIAL: ModulSnapshot = {
  berita: { kind: "loading" },
  pengumuman: { kind: "loading" },
  agenda: { kind: "loading" },
  guru: { kind: "loading" },
  fasilitas: { kind: "loading" },
  ekstrakurikuler: { kind: "loading" },
  galeri: { kind: "loading" },
  bk: { kind: "loading" },
  prestasi: { kind: "loading" },
};

const ModulContext = createContext<ModulContextValue | null>(null);

/** Bentuk SumberState yang gagal, pesan dari error bila ada. */
function gagal<T>(error: unknown, bawaan: string): SumberState<T> {
  return {
    kind: "error",
    message: error instanceof Error ? error.message : bawaan,
  };
}

export function ModulProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [state, setState] = useState<ModulSnapshot>(INITIAL);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [attempt, setAttempt] = useState(0);
  // True sejak render pertama: pemuatan memang sedang berjalan.
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function muat() {
      const hasil = await Promise.allSettled([
        apiRequest<BeritaDTO[]>("/api/berita/index.php"),
        apiRequest<PengumumanDTO[]>("/api/pengumuman/index.php"),
        apiRequest<PengumumanDTO[]>("/api/pengumuman/index.php?beranda=1"),
        apiRequest<AgendaDTO[]>("/api/agenda/index.php"),
        apiRequest<GuruDTO[]>("/api/guru/index.php"),
        apiRequest<FasilitasDTO[]>("/api/fasilitas/index.php"),
        apiRequest<EkstrakurikulerDTO[]>("/api/ekstrakurikuler/index.php"),
        apiRequest<GaleriDTO[]>("/api/galeri/index.php"),
        apiRequest<PesanBKDTO[]>("/api/bk/index.php"),
        apiRequest<PrestasiResponse>("/api/prestasi/index.php?status=Baru&page=1"),
        apiRequest<PrestasiResponse>("/api/prestasi/index.php?status=Ditinjau&page=1"),
      ]);

      if (cancelled) return;

      const [
        berita,
        pengumuman,
        pengumumanBeranda,
        agenda,
        guru,
        fasilitas,
        ekstrakurikuler,
        galeri,
        bk,
        prestasi,
        prestasiDitinjau,
      ] = hasil;

      const ada401 = hasil.some(
        (r) => r.status === "rejected" && isUnauthorized(r.reason),
      );
      if (ada401) {
        // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
        setRefreshing(false);
        logout();
        return;
      }

      const next: ModulSnapshot = {
        berita:
          berita.status === "fulfilled"
            ? { kind: "ok", value: berita.value }
            : gagal(berita.reason, "Gagal memuat data berita."),
        // Pengumuman butuh dua request: total dan yang tampil di beranda.
        // Salah satu gagal = sumber gagal, bukan angka setengah. Snapshot
        // menyimpan daftar (untuk aktivitas terbaru) dan jumlah beranda
        // (untuk “tidak tayang”); flag per-item tidak dipercaya.
        pengumuman:
          pengumuman.status === "fulfilled" && pengumumanBeranda.status === "fulfilled"
            ? {
                kind: "ok",
                value: {
                  items: pengumuman.value,
                  tampilBeranda: pengumumanBeranda.value.length,
                },
              }
            : gagal(
                pengumuman.status === "rejected"
                  ? pengumuman.reason
                  : pengumumanBeranda.status === "rejected"
                    ? pengumumanBeranda.reason
                    : "Gagal memuat data pengumuman.",
                "Gagal memuat data pengumuman.",
              ),
        agenda:
          agenda.status === "fulfilled"
            ? { kind: "ok", value: agenda.value }
            : gagal(agenda.reason, "Gagal memuat data agenda."),
        guru:
          guru.status === "fulfilled"
            ? { kind: "ok", value: guru.value }
            : gagal(guru.reason, "Gagal memuat jumlah data guru."),
        fasilitas:
          fasilitas.status === "fulfilled"
            ? { kind: "ok", value: fasilitas.value }
            : gagal(fasilitas.reason, "Gagal memuat jumlah data fasilitas."),
        ekstrakurikuler:
          ekstrakurikuler.status === "fulfilled"
            ? { kind: "ok", value: ekstrakurikuler.value }
            : gagal(ekstrakurikuler.reason, "Gagal memuat jumlah data ekstrakurikuler."),
        galeri:
          galeri.status === "fulfilled"
            ? { kind: "ok", value: galeri.value }
            : gagal(galeri.reason, "Gagal memuat jumlah data galeri."),
        bk:
          bk.status === "fulfilled"
            ? { kind: "ok", value: bk.value }
            : gagal(bk.reason, "Gagal memuat ringkasan inbox BK."),
        // Antrean prestasi butuh dua status: yang menunggu dan yang sudah
        // ditinjau. Salah satu gagal = sumber gagal, bukan angka setengah.
        prestasi:
          prestasi.status === "fulfilled" && prestasiDitinjau.status === "fulfilled"
            ? {
                kind: "ok",
                value: {
                  items: prestasi.value.items,
                  baru: prestasi.value.total ?? 0,
                  ditinjau: prestasiDitinjau.value.total ?? 0,
                },
              }
            : gagal(
                prestasi.status === "rejected"
                  ? prestasi.reason
                  : prestasiDitinjau.status === "rejected"
                    ? prestasiDitinjau.reason
                    : "Gagal memuat pengajuan prestasi.",
                "Gagal memuat pengajuan prestasi.",
              ),
      };

      setState(next);
      setLoadedAt(new Date());
      setRefreshing(false);
    }

    void muat();

    return () => {
      cancelled = true;
    };
  }, [attempt, logout]);

  // Status "memuat" berasal dari aksi pengguna, bukan dari dalam effect.
  const reload = useCallback(() => {
    setRefreshing(true);
    setAttempt((n) => n + 1);
  }, []);

  const failures = useMemo(() => {
    const list: { key: ModulKey; message: string }[] = [];
    (Object.keys(state) as ModulKey[]).forEach((key) => {
      const sumber = state[key];
      if (sumber.kind === "error") list.push({ key, message: sumber.message });
    });
    return list;
  }, [state]);

  const value = useMemo<ModulContextValue>(
    () => ({ ...state, loadedAt, failures, refreshing, reload }),
    [state, loadedAt, failures, refreshing, reload],
  );

  return <ModulContext.Provider value={value}>{children}</ModulContext.Provider>;
}

export function useModul(): ModulContextValue {
  const ctx = useContext(ModulContext);
  if (!ctx) {
    throw new Error("useModul harus dipakai di dalam ModulProvider.");
  }
  return ctx;
}

/* ---------------------------------------------------------------------------
 * Parser waktu
 *
 * Kolom MySQL (pesan_bk.tanggal, prestasi.created_at) dikirim sebagai
 * "YYYY-MM-DD HH:MM:SS" TANPA zona. new Date(string) bisa memperlakukannya
 * sebagai UTC sehingga jam bergeser, jadi string dipecah manual lalu dibangun
 * sebagai waktu lokal.
 * ------------------------------------------------------------------------- */

export function parseWaktuMySQL(value: string | null | undefined): Date | null {
  if (!value) return null;
  const cocok = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(
    value.trim(),
  );
  if (!cocok) return null;
  const [, tahun, bulan, hari, jam = "0", menit = "0", detik = "0"] = cocok;
  const hasil = new Date(
    Number(tahun),
    Number(bulan) - 1,
    Number(hari),
    Number(jam),
    Number(menit),
    Number(detik),
  );
  return Number.isNaN(hasil.getTime()) ? null : hasil;
}

/** "YYYY-MM-DD" waktu lokal — membandingkan tanggal dengan nilai backend. */
export function tanggalLocal(date: Date): string {
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${bulan}-${hari}`;
}

/** "07:00" -> menit sejak tengah malam; null bila format tidak dikenali. */
export function jamKeMenit(value: string | null | undefined): number | null {
  if (!value) return null;
  const cocok = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!cocok) return null;
  const jam = Number(cocok[1]);
  const menit = Number(cocok[2]);
  if (jam > 23 || menit > 59) return null;
  return jam * 60 + menit;
}