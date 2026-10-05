import Link from "next/link";
import { Download, FileText } from "lucide-react";
import type { ArsipPublicDTO } from "@/lib/api";

export default function KalenderUnduhan({
  dokumen,
  error,
}: {
  dokumen: ArsipPublicDTO[] | null;
  error: string | null;
}) {
  return (
    <section aria-labelledby="pusat-arsip-heading" className="space-y-space-lg">
      <div>
        <span className="font-label-md font-bold uppercase tracking-wider text-secondary">
          Pusat Arsip
        </span>
        <h2
          id="pusat-arsip-heading"
          className="font-headline-md font-bold text-primary"
        >
          Dokumen &amp; Silabus Pembelajaran
        </h2>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl border border-error-container p-space-md text-error">
          Arsip belum dapat dimuat. Silakan coba kembali nanti.
        </p>
      ) : dokumen && dokumen.length > 0 ? (
        <ul className="space-y-3">
          {dokumen.map((item) => (
            <li
              key={item.id}
              className="flex flex-col justify-between gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText aria-hidden className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-title-md font-bold text-primary">{item.judul}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {item.kategori} · {item.namaFile}
                  </p>
                  {item.deskripsi && (
                    <p className="mt-1 text-sm text-on-surface-variant">{item.deskripsi}</p>
                  )}
                </div>
              </div>
              <a
                href={item.downloadUrl}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary-container px-3 py-2 font-label-sm font-bold text-on-secondary-container hover:bg-secondary-fixed-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Download aria-hidden className="h-4 w-4" />
                Unduh dokumen
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-space-lg text-center text-on-surface-variant">
          Belum ada dokumen resmi yang tersedia untuk diunduh.
        </p>
      )}

    </section>
  );
}
