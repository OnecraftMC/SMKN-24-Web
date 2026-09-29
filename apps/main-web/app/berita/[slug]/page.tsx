import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBeritaById } from "@/lib/api";

export const revalidate = 60;

export default async function BeritaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = slug.match(/-(\d+)$/);
  if (!match) notFound();

  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const result = await getBeritaById(id);
  if (result.status === 404 || (result.data && result.data.slug !== slug)) notFound();

  if (!result.data) {
    return (
      <section className="mx-auto max-w-3xl px-margin-mobile py-space-4xl md:px-margin-tablet">
        <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg text-body-md text-on-surface-variant" role="status">
          Berita belum dapat dimuat: {result.error ?? "Terjadi kesalahan pada server."}
        </p>
        <Link href="/berita" className="mt-space-md inline-flex font-label-md font-bold text-primary hover:text-secondary">
          Kembali ke daftar berita
        </Link>
      </section>
    );
  }

  const berita = result.data;

  return (
    <article className="mx-auto max-w-4xl px-margin-mobile py-space-4xl md:px-margin-tablet">
      <Link href="/berita" className="mb-space-lg inline-flex items-center gap-2 font-label-md font-bold text-primary hover:text-secondary">
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Kembali ke daftar berita
      </Link>
      <header className="space-y-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm font-bold text-on-secondary-container">
            {berita.kategori}
          </span>
          <time dateTime={berita.tanggalIso} className="font-body-sm text-on-surface-variant">
            {berita.tanggalTampil}
          </time>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">{berita.judul}</h1>
        {berita.ringkasan && <p className="font-body-lg text-on-surface-variant">{berita.ringkasan}</p>}
      </header>
      {berita.gambar && (
        <div className="relative mt-space-xl aspect-[16/9] overflow-hidden rounded-2xl">
          <Image
            src={berita.gambar}
            alt={berita.judul}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}
      <div className="mt-space-xl whitespace-pre-line font-body-md leading-relaxed text-on-surface">
        {berita.isi || berita.ringkasan || "Belum ada isi berita."}
      </div>
    </article>
  );
}
