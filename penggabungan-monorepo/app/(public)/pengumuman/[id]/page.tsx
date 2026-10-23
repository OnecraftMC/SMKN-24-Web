import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Megaphone } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getPengumuman } from "@/lib/api";

export const metadata: Metadata = { title: "Detail Pengumuman | SMKN 24 Jakarta" };

export default async function PengumumanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPengumuman();
  const item = result.data?.find((notice) => String(notice.id) === id);
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-4xl px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-label-sm font-bold text-primary hover:bg-surface-container-low"><ArrowLeft aria-hidden className="size-4" />Kembali ke beranda</Link>
      <div className="mt-space-xl rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm md:p-space-2xl">
        <div className="flex items-center gap-2 text-secondary"><Megaphone aria-hidden className="size-5" /><span className="text-xs font-bold uppercase tracking-wider">Pengumuman sekolah</span></div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><Badge variant="secondary" label={item.badge || item.kategori} />{item.penting && <span className="rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">Prioritas</span>}{item.status && <span className="text-sm font-bold text-secondary">{item.status}</span>}</div>
        <h1 className="mt-4 font-headline-lg text-headline-lg font-bold text-primary">{item.judul}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{item.tanggal}</p>
        <div className="mt-space-lg whitespace-pre-line text-body-md leading-relaxed text-on-surface">{item.deskripsi}</div>
        {item.linkHref && item.linkLabel && <a href={item.linkHref} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md font-bold text-on-primary hover:bg-primary/90"><Download aria-hidden className="size-4" />{item.linkLabel}</a>}
      </div>
    </article>
  );
}
