"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL ?? "http://localhost:3000";

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

  // Sudah login? Langsung ke dasbor.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
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
    try {
      await login(username.trim(), password);
      // Status jadi authenticated -> effect di atas mengarahkan ke dasbor.
    } catch (err) {
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

  return (
    <main className="flex min-h-screen bg-surface">
      <BrandPanel />

      <section className="flex w-full items-center justify-center px-margin-mobile py-space-2xl md:px-margin-tablet lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-space-2xl flex items-center gap-space-sm lg:hidden">
            <Image
              src="/logo-smkn24.png"
              alt="Logo SMK Negeri 24 Jakarta"
              width={36}
              height={36}
              className="h-9 w-auto rounded-md"
            />
            <span className="font-headline-sm text-headline-sm font-bold text-primary">
              SMKN 24 Jakarta
            </span>
          </div>

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
            <a href={MAIN_WEB_URL} className="font-bold text-primary hover:underline">
              Kembali ke situs utama
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function BrandPanel() {
  return (
    <section
      aria-hidden="true"
      className="relative hidden flex-col justify-between overflow-hidden bg-primary-container p-space-2xl lg:flex lg:w-1/2"
    >
      <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary-container/90" />
      <div className="absolute right-10 top-1/3 h-40 w-40 rounded-full border border-surface/20" />

      <div className="relative z-10 flex items-center gap-space-sm">
        <Image
          src="/logo-smkn24.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-auto rounded-md shadow-sm"
        />
        <div>
          <p className="font-headline-sm text-headline-sm font-bold text-surface">
            SMKN 24 Jakarta
          </p>
          <p className="font-label-sm text-label-sm text-surface-container-high">
            Dashboard Admin
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-md space-y-space-md">
        <p className="font-headline-lg text-headline-lg font-bold leading-tight text-surface">
          Kelola konten sekolah dari satu tempat.
        </p>
        <p className="font-body-md text-body-md text-surface-container-high">
          Berita, pengumuman, agenda, direktori guru, inbox BK, dan aspirasi —
          semuanya terpusat di sini.
        </p>
      </div>
    </section>
  );
}

