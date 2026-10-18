"use client";

/**
 * Halaman Overview dashboard admin — "Linimasa Hari".
 *
 * Susunan: header hari (di shell) → strip konteks → area kerja dua kolom
 * (poros waktu | panel analisis chatbot). Enam kartu modul dihapus; jumlah
 * data modul pindah ke lencana rail.
 *
 * Semua angka dari backend. Kegagalan parsial dinyatakan eksplisit di baris
 * status dan per satuan di strip, tidak pernah diam-diam menjadi nol.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import {
  jamKeMenit,
  parseWaktuMySQL,
  tanggalLocal,
  useModul,
  type ModulKey,
} from "@/lib/admin/moduleCounts";
import { useJam } from "@/lib/admin/useJam";
import ContextStrip, { StatusBar, type StripUnit } from "@/components/admin/overview/ContextStrip";
import TimeSpine, { type NadaTag, type WorkItem } from "@/components/admin/overview/TimeSpine";
import ChatAnalyticsPanel, {
  type ChatStatsState,
  type PeriodeStatistik,
} from "@/components/admin/overview/ChatAnalyticsPanel";
import type {
  AgendaDTO,
  ChatAnalyticsResponse,
  ChatInsightsResponse,
} from "@/lib/admin/types";

const LABEL_SUMBER: Record<ModulKey, string> = {
  berita: "Berita",
  pengumuman: "Pengumuman",
  agenda: "Agenda",
  guru: "Guru",
  fasilitas: "Fasilitas",
  galeri: "Galeri",
  bk: "Inbox BK",
  prestasi: "Pengajuan Prestasi",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Nada tag dari hasil triase Counsellor AI. */
function nadaKesulitan(
  tingkat: "Ringan" | "Sedang" | "Berat" | null,
  butuhPerhatian: boolean,
): { tag: { teks: string; nada: NadaTag } | null; detail: string } {
  if (butuhPerhatian) {
    return {
      tag: { teks: "Perlu perhatian", nada: "mendesak" },
      detail: "Sudah dibaca AI, belum dibaca guru BK",
    };
  }
  if (tingkat === "Berat") {
    return { tag: { teks: "Berat", nada: "mendesak" }, detail: "Tingkat kesulitan berat" };
  }
  if (tingkat === "Sedang") {
    return { tag: { teks: "Sedang", nada: "perhatian" }, detail: "Tingkat kesulitan sedang" };
  }
  if (tingkat === "Ringan") {
    return { tag: { teks: "Ringan", nada: "netral" }, detail: "Tingkat kesulitan ringan" };
  }
  return { tag: null, detail: "Belum ditriase" };
}

export default function OverviewPage() {
  const modul = useModul();
  const { logout } = useAuth();
  const [chatStats, setChatStats] = useState<ChatStatsState>({ kind: "loading" });
  const [periode, setPeriode] = useState<PeriodeStatistik>("7");
  const [chatAttempt, setChatAttempt] = useState(0);
  // Jam lokal untuk garis "sekarang" dan label "sekarang" pada daftar ponsel.
  const now = useJam();

  // Statistik chatbot dipisah dari data modul karena kontrol periode (7/30 hari)
  // hanya boleh memicu refetch analytics, bukan seluruh halaman.
  useEffect(() => {
    let cancelled = false;

    async function muat() {
      const akhir = new Date();
      const mulai = new Date();
      mulai.setDate(akhir.getDate() - (Number(periode) - 1));

      const [chat, insight] = await Promise.allSettled([
        apiRequest<ChatAnalyticsResponse>(
          `/api/chat/analytics.php?dari=${tanggalLocal(mulai)}&sampai=${tanggalLocal(akhir)}`,
        ),
        apiRequest<ChatInsightsResponse>("/api/chat/insights.php"),
      ]);

      if (cancelled) return;

      if (chat.status === "rejected" && isUnauthorized(chat.reason)) {
        // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
        logout();
        return;
      }

      if (chat.status === "fulfilled") {
        // Insight tidak kritis: gagal = tanpa insight, statistik tetap tampil.
        const terbaru =
          insight.status === "fulfilled" && insight.value.aktif.length > 0
            ? insight.value.aktif[0]
            : null;
        setChatStats({
          kind: "ok",
          analytics: chat.value,
          insightAktif: insight.status === "fulfilled" ? insight.value.aktif.length : 0,
          insightTerbaru: terbaru
            ? { id: terbaru.id, judul: terbaru.judul, isi: terbaru.isi }
            : null,
        });
      } else {
        setChatStats({
          kind: "error",
          message:
            chat.reason instanceof Error
              ? chat.reason.message
              : "Gagal memuat statistik chatbot.",
        });
      }
    }

    void muat();

    return () => {
      cancelled = true;
    };
  }, [periode, chatAttempt, logout]);

  // Status "memuat" dipicu dari aksi pengguna (ganti periode / muat ulang),
  // bukan dari dalam effect, supaya tidak ada render berantai.
  const gantiPeriode = useCallback((p: PeriodeStatistik) => {
    setChatStats({ kind: "loading" });
    setPeriode(p);
  }, []);

  const reload = useCallback(() => {
    setChatStats({ kind: "loading" });
    modul.reload();
    setChatAttempt((n) => n + 1);
  }, [modul]);

  /* ---------------------------------------------------------------------
   * Poros waktu: kumpulkan pekerjaan yang menunggu keputusan manusia.
   * Kartu bersifat anonim untuk data siswa (lihat komentar TimeSpine).
   * ------------------------------------------------------------------- */
  const { items, agendaBerikutnya, porosState, porosPesan } = useMemo(() => {
    const hariIni = tanggalLocal(new Date());
    const list: WorkItem[] = [];
    const berikutnya: AgendaDTO[] = [];

    // Pesan BK yang masih terbuka (Baru + Diproses). Selesai bukan pekerjaan.
    if (modul.bk.kind === "ok") {
      for (const row of modul.bk.value) {
        if (row.status === "Selesai") continue;
        const waktu = parseWaktuMySQL(row.tanggal);
        const { tag, detail } = nadaKesulitan(row.tingkatKesulitan, row.butuhPerhatian);
        list.push({
          id: `bk-${row.id}`,
          jenis: "bk",
          label: "Pesan konseling",
          judul: `Pesan konseling #${row.id}`,
          detail: row.kategori ? `${row.kategori} · ${detail}` : detail,
          menit: waktu ? waktu.getHours() * 60 + waktu.getMinutes() : null,
          tanggal: waktu,
          tertunda: waktu ? tanggalLocal(waktu) < hariIni : false,
          tag,
          href: "/admin/bk",
          aksi: "Tangani",
          lampiran: row.media?.length ?? 0,
        });
      }
    }

    // Pengajuan prestasi yang menunggu moderasi.
    if (modul.prestasi.kind === "ok") {
      for (const row of modul.prestasi.value.items) {
        const waktu = parseWaktuMySQL(row.createdAt);
        list.push({
          id: `prestasi-${row.id}`,
          jenis: "prestasi",
          label: "Prestasi",
          judul: `Prestasi ${row.tingkat}`,
          detail: row.perlombaan,
          menit: waktu ? waktu.getHours() * 60 + waktu.getMinutes() : null,
          tanggal: waktu,
          tertunda: waktu ? tanggalLocal(waktu) < hariIni : false,
          tag: row.adaBukti ? null : { teks: "Tanpa bukti", nada: "perhatian" },
          href: "/admin/prestasi",
          aksi: "Nilai",
          lampiran: row.adaBukti ? 1 : 0,
        });
      }
    }

    // Agenda: hari ini bertumpu pada poros; agenda berikutnya jadi daftar.
    if (modul.agenda.kind === "ok") {
      for (const row of modul.agenda.value) {
        const tanggal = row.tglMulai ?? "";
        const menit = jamKeMenit(row.waktu);
        if (tanggal === hariIni) {
          list.push({
            id: `agenda-${row.id}`,
            jenis: "agenda",
            label: "Agenda",
            judul: row.judul,
            detail: row.lokasi ?? row.badge,
            menit,
            tanggal: tanggal ? new Date(`${tanggal}T00:00:00`) : null,
            tertunda: false,
            tag: { teks: row.badge ?? "Hari ini", nada: "netral" },
            href: "/admin/agenda",
            aksi: "Terbitkan",
            lampiran: 0,
          });
        } else if (tanggal > hariIni) {
          berikutnya.push(row);
        }
      }
    }

    // Poros gagal kalau sumber utama antrean gagal, bukan kalau salah satu
    // daftar kosong: daftar kosong adalah keadaan yang valid.
    const gagal: string[] = [];
    if (modul.bk.kind === "error") gagal.push(modul.bk.message);
    if (modul.prestasi.kind === "error") gagal.push(modul.prestasi.message);
    if (modul.agenda.kind === "error") gagal.push(modul.agenda.message);

    const sedang = modul.bk.kind === "loading" || modul.prestasi.kind === "loading";

    return {
      items: list,
      agendaBerikutnya: berikutnya
        .sort((a, b) => (a.tglMulai ?? "").localeCompare(b.tglMulai ?? ""))
        .slice(0, 5),
      porosState: gagal.length > 0 ? ("error" as const) : sedang ? ("loading" as const) : ("ok" as const),
      porosPesan: gagal.join(" "),
    };
  }, [modul.bk, modul.prestasi, modul.agenda]);

  /* ---------------------------- Strip konteks --------------------------- */
  const units: StripUnit[] = useMemo(() => {
    const metrik = chatStats.kind === "ok" ? chatStats.analytics.metrik : null;
    const chatState = chatStats.kind === "loading" ? "loading" : chatStats.kind;

    const bkBaru = (() => {
      if (modul.bk.kind === "loading") return { state: "loading" as const };
      if (modul.bk.kind === "error") {
        return { state: "error" as const, message: modul.bk.message };
      }
      const baru = modul.bk.value.filter((p) => p.status === "Baru").length;
      const diproses = modul.bk.value.filter((p) => p.status === "Diproses").length;
      const selesai = modul.bk.value.filter((p) => p.status === "Selesai").length;
      return {
        state: "ok" as const,
        value: formatNumber(baru),
        sub: `${formatNumber(diproses)} diproses · ${formatNumber(selesai)} selesai`,
      };
    })();

    const prestasi = (() => {
      if (modul.prestasi.kind === "loading") return { state: "loading" as const };
      if (modul.prestasi.kind === "error") {
        return { state: "error" as const, message: modul.prestasi.message };
      }
      return {
        state: "ok" as const,
        value: formatNumber(modul.prestasi.value.baru),
        sub: `${formatNumber(modul.prestasi.value.ditinjau)} sudah ditinjau`,
      };
    })();

    // Urutan mengikuti hierarki urgensi: tiga antrean manusia dulu, kesehatan
    // sistem terakhir. Lihat brief §4.
    return [
      {
        key: "bk",
        label: "Pesan BK Baru",
        state: bkBaru.state,
        value: bkBaru.state === "ok" ? bkBaru.value : null,
        sub: bkBaru.state === "ok" ? bkBaru.sub : null,
        message: bkBaru.state === "error" ? bkBaru.message : undefined,
      },
      {
        key: "eskalasi",
        label: "Perlu Intervensi",
        state: chatState,
        value: metrik ? `${formatNumber(metrik.persenEskalasi)}%` : null,
        sub: metrik ? `${formatNumber(metrik.eskalasi)} pesan perlu guru BK` : null,
        message: chatStats.kind === "error" ? chatStats.message : undefined,
      },
      {
        key: "prestasi",
        label: "Prestasi Menunggu",
        state: prestasi.state,
        value: prestasi.state === "ok" ? prestasi.value : null,
        sub: prestasi.state === "ok" ? prestasi.sub : null,
        message: prestasi.state === "error" ? prestigeMessage(prestasi.message) : undefined,
      },
      {
        key: "sesi",
        label: "Sesi Chatbot",
        state: chatState,
        value: metrik ? formatNumber(metrik.totalSesi) : null,
        sub: metrik
          ? `${formatNumber(metrik.aktifHariIni)} sesi hari ini · ${periode} hari`
          : null,
        message: chatStats.kind === "error" ? chatStats.message : undefined,
      },
    ];
  }, [modul.bk, modul.prestasi, chatStats, periode]);

  const catatanGagal = modul.failures;

  return (
    <div className="space-y-space-lg">
      <StatusBar
        terakhirDimuat={modul.loadedAt}
        memuat={modul.refreshing || chatStats.kind === "loading"}
        onReload={reload}
      >
        {catatanGagal.length > 0 ? (
          <p className="flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sebagian data gagal dimuat: {catatanGagal.map((f) => LABEL_SUMBER[f.key]).join(", ")}.
              Angka lain tetap berlaku; bagian yang gagal ditandai “Gagal”, bukan 0.
            </span>
          </p>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Semua sumber termuat. Angka berasal langsung dari database sekolah.
          </p>
        )}
      </StatusBar>

      <ContextStrip units={units} />

      <div className="grid gap-space-lg xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-space-lg">
          <TimeSpine
            items={items}
            now={now}
            state={porosState}
            message={porosPesan}
          />

          {agendaBerikutnya.length > 0 && (
            <section
              aria-label="Agenda berikutnya"
              className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md"
            >
              <div className="flex items-baseline justify-between gap-space-sm">
                <h2 className="font-title-md text-title-md font-bold text-on-surface">
                  Agenda Berikutnya
                </h2>
                <Link
                  href="/admin/agenda"
                  className="font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
                >
                  Kelola agenda
                </Link>
              </div>
              <ul className="mt-space-sm divide-y divide-surface-container">
                {agendaBerikutnya.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-space-sm gap-y-1 py-2"
                  >
                    <p className="truncate font-label-md text-label-md font-bold text-on-surface">
                      {row.judul}
                    </p>
                    <p className="font-label-sm text-label-sm tabular-nums text-on-surface-variant">
                      {row.tglMulai}
                      {row.waktu ? ` · ${row.waktu}` : ""}
                      {row.lokasi ? ` · ${row.lokasi}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <ChatAnalyticsPanel
            state={chatStats}
            periode={periode}
            onPeriodeChange={gantiPeriode}
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Ringkasan modul konten dipindahkan ke lencana rail kiri; jumlah di sana
        mengikuti sumber yang sama dengan halaman ini.
      </p>
    </div>
  );
}

/** Pesan error sumber disingkat agar tetap muat di strip. */
function prestigeMessage(message: string | undefined): string {
  if (!message) return "Data tidak dapat dimuat.";
  return message.length > 48 ? `${message.slice(0, 48)}…` : message;
}