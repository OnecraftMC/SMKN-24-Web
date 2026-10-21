import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import type { ChatbotBKAnalytics } from "@/lib/admin/types";

export default function AutomaticChatAnalyticsCta({
  data,
  dari,
  sampai,
}: {
  data: ChatbotBKAnalytics;
  dari: string;
  sampai: string;
}) {
  const query = new URLSearchParams({ dari, sampai });

  return (
    <Link
      href={`/admin/chat/otomatis?${query.toString()}`}
      className="group flex flex-wrap items-center justify-between gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
    >
      <span className="flex min-w-0 items-start gap-space-md">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container">
          <BellRing aria-hidden className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-title-md text-title-md font-bold text-on-surface">
            Buka riwayat notifikasi otomatis
          </span>
          <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
            {data.totalNotifikasi} percobaan pada periode {dari} s.d. {sampai}. Lihat detail setiap notifikasi.
          </span>
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-2 font-label-md text-label-md font-bold text-primary">
        Lihat riwayat
        <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
      </span>
    </Link>
  );
}
