import type { Metadata } from "next";
import Link from "next/link";
import FormPengajuanPrestasi from "@/components/akademik/FormPengajuanPrestasi";

export const metadata: Metadata = {
  title: "Pengajuan Prestasi Siswa | SMKN 24 Jakarta",
  description: "Formulir pengajuan prestasi siswa SMKN 24 Jakarta untuk ditinjau oleh admin sekolah.",
};

export default function PengajuanPrestasiPage() {
  return (
    <section className="bg-surface px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-3xl space-y-space-lg">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg px-3 font-label-md font-bold text-primary hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Kembali ke halaman utama
        </Link>
        <header className="space-y-space-xs">
          <p className="font-label-md font-bold uppercase tracking-wider text-secondary">
            Prestasi Siswa
          </p>
          <h1 className="font-headline-lg font-bold text-primary">Ajukan Prestasi</h1>
          <p className="max-w-2xl text-on-surface-variant">
            Isi data sesuai informasi perlombaan. Pengajuan akan ditinjau oleh admin dan
            tidak dipublikasikan otomatis.
          </p>
        </header>
        <FormPengajuanPrestasi />
      </div>
    </section>
  );
}
