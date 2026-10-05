import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";

export default function PrestasiCTA() {
  return (
    <section className="bg-surface px-margin-mobile py-space-lg md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="flex flex-col gap-space-md rounded-2xl border border-primary/10 bg-gradient-to-br from-primary to-primary-container p-space-lg text-on-primary shadow-lg shadow-primary/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-primary/10 text-secondary-fixed">
              <Trophy aria-hidden className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="font-title-md font-bold">Punya prestasi yang membanggakan?</h2>
              <p className="max-w-lg text-sm text-on-primary/75">
                Ceritakan pencapaianmu melalui formulir agar dapat ditinjau dan diapresiasi sekolah.
              </p>
            </div>
          </div>
          <Link
            href="/akademik/pengajuan-prestasi"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-surface-container-lowest px-space-md py-2.5 font-label-md font-bold text-primary transition-colors hover:bg-secondary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary sm:self-auto"
          >
            Ajukan prestasi
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
