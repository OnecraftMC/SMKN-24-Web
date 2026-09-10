"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(true);
      return;
    }
    setError(false);
    // Redirect ke dashboard admin
    router.push("/admin");
  };

  return (
    <Reveal>
      <div className="min-h-screen w-full flex bg-surface font-body-md text-body-md text-on-surface antialiased">
        {/* LEFT: BRAND PANEL (hidden di mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-container relative overflow-hidden flex-col justify-between p-space-4xl">
          <div className="absolute -right-32 -bottom-32 w-[28rem] h-[28rem] rounded-full bg-secondary-container/90"></div>
          <div className="absolute right-10 top-1/3 w-40 h-40 rounded-full border border-surface/20"></div>

          <div className="relative z-10 flex items-center gap-space-sm">
            <Image
              src="/logo-smkn24.png"
              alt="Logo SMKN 24 Jakarta"
              width={40}
              height={40}
              className="h-10 w-auto object-contain rounded-md shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-surface font-bold leading-tight">
                SMKN 24 Jakarta
              </span>
              <span className="font-label-sm text-label-sm text-surface-container-high">
                Dashboard Admin
              </span>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <p className="font-headline-lg text-headline-lg text-surface font-bold leading-tight mb-space-md">
              Kelola konten sekolah dari satu tempat.
            </p>
            <p className="font-body-md text-body-md text-surface-container-high">
              Berita, jadwal, pengumuman, agenda, direktori guru, galeri, arsip,
              hingga pengaduan BK — semua terpusat di dashboard ini.
            </p>
          </div>
        </div>

        {/* RIGHT: LOGIN FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-margin-mobile md:px-margin-tablet py-space-4xl">
          <div className="w-full max-w-sm">
            <div className="flex lg:hidden items-center gap-space-sm mb-space-2xl">
              <Image
                src="/logo-smkn24.png"
                alt="Logo SMKN 24 Jakarta"
                width={36}
                height={36}
                className="h-9 w-auto object-contain rounded-md shadow-sm"
              />
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                SMKN 24 Jakarta
              </span>
            </div>

            <span className="inline-flex items-center px-space-sm py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold uppercase mb-space-md">
              Portal Internal
            </span>

            <h1 className="font-headline-md text-headline-md text-on-surface font-bold mb-space-2xs">
              Masuk Dashboard
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-2xl">
              Gunakan akun yang sudah didaftarkan oleh admin sistem.
            </p>

            <form className="space-y-space-lg" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block font-label-md text-label-md text-on-surface mb-space-xs"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@smkn24jakarta.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-space-md py-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-label-md text-label-md text-on-surface mb-space-xs"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    aria-label="Tampilkan kata sandi"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-outline-variant text-primary focus:ring-primary/40"
                  />
                  Ingat saya
                </label>
                <a
                  href="#"
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>

              {error && (
                <div className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  <span>Email atau kata sandi salah. Coba lagi.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-space-xs"
              >
                <span>Masuk</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </form>

            <p className="mt-space-2xl text-center font-body-sm text-body-sm text-on-surface-variant">
              Bukan admin?{" "}
              <Link
                href="/"
                className="text-primary font-bold hover:underline"
              >
                Kembali ke situs utama
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}