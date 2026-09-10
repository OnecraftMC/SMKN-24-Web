"use client";

import Link from "next/link";
import Image from "next/image";

const quickLinks = [
  { label: "Beranda", href: "/" },
  { label: "Profil", href: "/profil" },
  { label: "Akademik", href: "/akademik" },
  { label: "Kabar", href: "/kabar" },
  { label: "Lokasi Sekolah", href: "/#lokasi-sekolah" },
  { label: "Fasilitas", href: "/profil#fasilitas" },
  { label: "Jurusan", href: "/jurusan" },
  { label: "Berita", href: "/berita" },
];

const studyPrograms = [
  "Perhotelan",
  "Kuliner (Tata Boga)",
  "Tata Busana",
  "Rekayasa Perangkat Lunak",
  "Usaha Layanan Pariwisata",
];

const socialLinks = [
  {
    label: "Instagram",
    icon: "photo_camera",
    href: "https://www.instagram.com/smkn.24jakarta/",
  },
  {
    label: "Website Resmi",
    icon: "language",
    href: "https://www.smkn24jkt.sch.id/",
  },
  { label: "Email Sekolah", icon: "mail", href: "mailto:humassmkn24jakarta@gmail.com" },
  { label: "Telepon Sekolah", icon: "call", href: "tel:0218441976" },
];

export default function Footer() {
  const showPrivacyNotice = () => {
    window.alert(
      "Kebijakan Privasi: Data yang dikirim melalui formulir di situs ini hanya digunakan untuk keperluan layanan sekolah dan tidak dibagikan ke pihak ketiga.",
    );
  };

  const showTermsNotice = () => {
    window.alert(
      "Syarat & Ketentuan: Seluruh konten pada situs ini adalah milik SMK Negeri 24 Jakarta dan dapat diperbarui sewaktu-waktu.",
    );
  };

  return (
    <footer className="w-full bg-primary-container text-surface mt-space-4xl">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop pt-space-3xl pb-space-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-gutter-lg">
          <div className="lg:col-span-4 space-y-space-md">
            <Link href="/" className="flex items-center gap-space-sm cursor-pointer text-left">
              <Image
                src="/logo-smkn24.png"
                alt="Logo SMK Negeri 24 Jakarta"
                width={36}
                height={36}
                className="h-9 w-auto object-contain rounded-md shadow-sm"
              />
              <span className="font-headline-sm text-headline-sm text-surface font-bold">
                SMKN 24 Jakarta
              </span>
            </Link>

            <p className="font-body-sm text-body-sm text-surface-container-high leading-relaxed">
              Menumbuhkan kecendekiaan generasi bangsa berwawasan global, berakar budi pekerti
              luhur, dan berdaya saing melalui ekosistem pembelajaran holistik.
            </p>

            <div className="space-y-space-xs font-body-sm text-body-sm text-surface-container-high">
              <div className="flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed mt-0.5">
                  location_on
                </span>
                <span>
                  Jl. Bambu Hitam No. 3, RT.3/RW.1, Bambu Apus, Kec. Cipayung, Jakarta Timur 13890` Gila, gila, gila, gila.
Ini berapa?
Ini nanti buat dijadiin lomba nasional sama buat Yeah.`
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">call</span>
                <span>(021) 844-1976</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">mail</span>
                <span>humassmkn24jakarta@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-space-sm">
            <h4 className="font-title-md text-title-md text-surface font-bold">Akses Cepat</h4>
            <ul className="space-y-space-xs font-body-sm text-body-sm text-surface-container-high">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-secondary-container transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-space-sm">
            <h4 className="font-title-md text-title-md text-surface font-bold">Program Keahlian</h4>
            <ul className="space-y-space-xs font-body-sm text-body-sm text-surface-container-high">
              {studyPrograms.map((program) => (
                <li key={program}>
                  <Link href="/profil" className="hover:text-surface transition-colors">
                    {program}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-space-md">
            <h4 className="font-title-md text-title-md text-surface font-bold">
              Koneksi &amp; Komunitas
            </h4>
            <p className="font-body-sm text-body-sm text-surface-container-high">
              Ikuti dinamika prestasi dan informasi terkini institusi kami melalui kanal sosial resmi.
            </p>

            <div className="flex items-center gap-space-xs">
              {socialLinks.map((link) => (
                <a
                  aria-label={link.label}
                  className="w-10 h-10 rounded-lg bg-tertiary-container text-surface flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-all"
                  href={link.href}
                  key={link.label}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                </a>
              ))}
            </div>

            <div className="pt-space-xs">
              <span className="inline-block px-space-sm py-1 rounded bg-tertiary text-secondary-fixed font-label-sm text-label-sm font-bold">
                NPSN: 20103788 • Jakarta Timur
              </span>
            </div>
          </div>
        </div>

        <div className="mt-space-2xl pt-space-md border-t border-on-primary-container/20 flex flex-col sm:flex-row items-center justify-between gap-space-sm font-body-sm text-body-sm text-surface-container-high">
          <p>Hak Cipta © {new Date().getFullYear()} SMK Negeri 24 Jakarta. Terakreditasi A BAN-S/M.</p>

          <div className="flex items-center gap-space-md">
            <button className="hover:underline" onClick={showPrivacyNotice} type="button">
              Privasi
            </button>
            <button className="hover:underline" onClick={showTermsNotice} type="button">
              Syarat &amp; Ketentuan
            </button>
            <Link href="/" className="hover:underline">
              Peta Situs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
