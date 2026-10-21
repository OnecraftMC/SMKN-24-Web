"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";
import LogoLoadingAnimation from "@/components/ui/LogoLoadingAnimation";
import { useAuth } from "@/lib/admin/auth";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function LoginPage() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Hanya true SETELAH login sukses: memicu splash logo sebelum masuk dasbor.
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  // Penjaga race: `login()` menandai status auth sebagai `authenticated` SEBELUM
  // promise-nya selesai, jadi flag ref dipasang lebih dulu agar effect redirect di
  // bawah tidak mendahului splash logo.
  const loginSucceededRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  const goToDashboard = useCallback(() => {
    router.replace("/admin");
  }, [router]);

  // Sesi yang sudah valid (mis. membuka `/login` saat masih login) langsung ke
  // dasbor tanpa splash — splash hanya untuk transisi login berhasil → dasbor.
  useEffect(() => {
    if (status === "authenticated" && !loginSucceededRef.current) {
      router.replace("/admin");
    }
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (username.trim() === "" || password === "") {
      setError("Username dan password wajib diisi.");
      return;
    }

    setSubmitting(true);
    loginSucceededRef.current = true;
    try {
      await login(username.trim(), password);
      if (shouldReduceMotion) {
        // Paritas LoadingScreenProvider: pengguna reduced-motion tidak digerbang
        // animasi 3.2 detik, jadi langsung masuk dasbor tanpa splash.
        goToDashboard();
      } else {
        // Sukses: tampilkan splash logo, `goToDashboard` dipanggil saat animasi selesai.
        setLoginSucceeded(true);
      }
    } catch (err) {
      // Gagal: batalkan penjaga race supaya redirect normal tetap berlaku nanti.
      loginSucceededRef.current = false;
      setError(
        err instanceof Error
          ? err.message
          : "Gagal masuk. Coba beberapa saat lagi.",
      );
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 aria-hidden className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Memeriksa sesi…</span>
      </main>
    );
  }

  // Transisi login berhasil → dasbor: splash logo identik dengan website utama
  // (LogoLoadingAnimation yang sama) + teks "Administrator" di bawah logo.
  if (loginSucceeded) {
    return (
      <main
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        role="status"
        aria-live="polite"
      >
        <LogoLoadingAnimation caption="Administrator" onFinished={goToDashboard} />
        <span className="sr-only">Login berhasil. Membuka dashboard admin…</span>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-space-2xl md:px-margin-tablet">
      <section className="w-full max-w-sm">
        <a
          href="/"
          className="mb-space-lg flex min-h-11 w-fit items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          <span>Kembali ke beranda</span>
        </a>
          <span className="mb-space-md inline-flex items-center rounded-full bg-secondary-container/20 px-space-sm py-1 font-label-sm text-label-sm font-bold uppercase tracking-wide text-secondary">
            Portal Internal
          </span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Masuk ke Dashboard
          </h1>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Gunakan akun admin sekolah yang terdaftar di sistem.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-space-md flex items-start gap-space-xs rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
            >
              <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-space-lg space-y-space-md">
            <div>
              <label
                htmlFor="username"
                className="mb-1 block font-label-md text-label-md font-bold text-primary"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="mis. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block font-label-md text-label-md font-bold text-primary"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden className="h-5 w-5" />
                  ) : (
                    <Eye aria-hidden className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary py-3 font-label-md text-label-md font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn aria-hidden className="h-4 w-4" />
              )}
              {submitting ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-space-2xl text-center font-body-sm text-body-sm text-on-surface-variant">
            Bukan admin?{" "}
            <a href="/" className="font-bold text-primary hover:underline">
              Kembali ke situs utama
            </a>
          </p>
      </section>
    </main>
  );
}
