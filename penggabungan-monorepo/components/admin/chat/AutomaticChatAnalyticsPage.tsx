"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BellRing } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { ChatAnalyticsResponse } from "@/lib/admin/types";
import { ListState, buttonGhostClass } from "@/components/admin/ui/FormBits";
import ChatbotBKHistory from "@/components/admin/chat/ChatbotBKHistory";

export default function AutomaticChatAnalyticsPage({
  dari,
  sampai,
}: {
  dari: string;
  sampai: string;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<ChatAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const muat = useCallback(() => {
    setLoading(true);
    setError(null);
    let cancelled = false;
    apiRequest<ChatAnalyticsResponse>(
      `/api/chat/analytics.php?dari=${dari}&sampai=${sampai}`,
    )
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat riwayat notifikasi.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dari, sampai, logout]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => muat(), [muat, reloadKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function kembali() {
    if (document.referrer.startsWith(window.location.origin) && window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/chat");
    }
  }

  const chatbotBK = data?.chatbotBK;

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-start gap-space-md">
        <button type="button" onClick={kembali} className={buttonGhostClass}>
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Kembali
        </button>
        <div>
          <h1 className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <BellRing aria-hidden className="h-6 w-6" />
            Riwayat Notifikasi Otomatis
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Periode {dari} s.d. {sampai}
          </p>
        </div>
      </header>

      <ListState
        loading={loading}
        error={error}
        empty={false}
        emptyLabel=""
        onRetry={() => setReloadKey((value) => value + 1)}
      />
      {!loading && !error && chatbotBK && (
        <ChatbotBKHistory data={chatbotBK} view="history" />
      )}
      {!loading && !error && !chatbotBK && (
        <p
          role="status"
          className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg font-body-sm text-body-sm text-on-surface-variant"
        >
          Riwayat notifikasi otomatis belum tersedia dari backend.
        </p>
      )}
    </div>
  );
}
