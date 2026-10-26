"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, SearchCheck } from "lucide-react";

type GraduationResult = {
  namaSiswa: string;
  kelas: string;
  jurusan: string;
  tahunLulus: number;
  status: "Lulus" | "Tidak Lulus";
};

export default function CekKelulusan() {
  const [nisn, setNisn] = useState("");
  const [result, setResult] = useState<GraduationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/kelulusan", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ nisn }),
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "Hasil kelulusan belum dapat dimuat.";
        setError(message);
        return;
      }
      setResult(body as GraduationResult);
    } catch {
      setError("Tidak dapat menghubungi layanan kelulusan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-space-lg shadow-sm md:p-space-xl">
      <div className="flex items-start gap-space-sm">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
          <SearchCheck aria-hidden className="size-5" />
        </span>
        <div>
          <h2 id="cek-kelulusan-heading" className="font-headline-sm text-headline-sm font-bold text-primary">Cek hasil kelulusan</h2>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Masukkan NISN 10 digit sesuai data siswa. Hasil hanya ditampilkan jika sekolah sudah menerbitkannya.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-space-lg flex flex-col gap-space-sm sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="nisn-kelulusan" className="mb-1 block text-sm font-bold text-on-surface">NISN</label>
          <input
            id="nisn-kelulusan"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{10}"
            maxLength={10}
            minLength={10}
            required
            value={nisn}
            onChange={(event) => setNisn(event.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Masukkan 10 digit NISN"
            aria-describedby="nisn-kelulusan-hint"
            className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 text-base text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p id="nisn-kelulusan-hint" className="mt-1 text-xs text-on-surface-variant">NISN hanya digunakan untuk mencari hasil dan tidak ditampilkan kembali.</p>
        </div>
        <button type="submit" disabled={busy || nisn.length !== 10} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none">
          {busy ? <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : <SearchCheck aria-hidden className="size-4" />}
          {busy ? "Memeriksa…" : "Cek kelulusan"}
        </button>
      </form>
      {error && <p role="alert" className="mt-space-md flex items-start gap-2 rounded-xl border border-error-container bg-error-container/40 p-space-md text-sm text-on-error-container"><CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />{error}</p>}
      {result && (
        <section aria-live="polite" aria-label="Hasil kelulusan" className={`mt-space-lg rounded-2xl border p-space-lg ${result.status === "Lulus" ? "border-secondary/30 bg-secondary-container/35" : "border-outline-variant bg-surface-container-low"}`}>
          <div className="flex items-center gap-2 text-primary"><CheckCircle2 aria-hidden className="size-5" /><h3 className="font-title-md text-title-md font-bold">Hasil ditemukan</h3></div>
          <p className="mt-3 font-headline-sm text-headline-sm font-bold text-primary">{result.namaSiswa}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{result.kelas} · {result.jurusan} · Tahun kelulusan {result.tahunLulus}</p>
          <p className="mt-space-md inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary">Status: {result.status}</p>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">Untuk verifikasi resmi, hubungi sekolah melalui kanal yang tercantum pada halaman ini.</p>
        </section>
      )}
    </div>
  );
}
