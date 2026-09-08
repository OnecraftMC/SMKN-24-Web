'use client';

import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  GlobeIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const quickLinks = [
  { title: 'Beranda', href: '/' },
  { title: 'Profil', href: '/profil' },
  { title: 'Akademik', href: '/akademik' },
  { title: 'Kabar', href: '/kabar' },
  { title: 'Lokasi Sekolah', href: '/#lokasi-sekolah' },
  { title: 'Fasilitas', href: '/profil#fasilitas' },
];

const studyPrograms = [
  'Perhotelan',
  'Kuliner (Tata Boga)',
  'Tata Busana',
  'Rekayasa Perangkat Lunak',
  'Usaha Layanan Pariwisata',
];

const socialLinks = [
  { title: 'Instagram', href: 'https://www.instagram.com/smkn.24jakarta/', icon: GlobeIcon },
  { title: 'Website Resmi', href: 'https://www.smkn24jkt.sch.id/', icon: GlobeIcon },
  { title: 'Email Sekolah', href: 'mailto:humassmkn24jakarta@gmail.com', icon: MailIcon },
  { title: 'Telepon Sekolah', href: 'tel:0218441976', icon: PhoneIcon },
];

const footerSections: FooterSection[] = [
  {
    label: 'Akses Cepat',
    links: quickLinks.map(({ title, href }) => ({ title, href })),
  },
  {
    label: 'Program Keahlian',
    links: studyPrograms.map((program) => ({ title: program, href: '/profil' })),
  },
  {
    label: 'Koneksi & Komunitas',
    links: socialLinks,
  },
];

export function Footer() {
  const showPrivacyNotice = () => {
    window.alert(
      'Kebijakan Privasi: Data yang dikirim melalui formulir di situs ini hanya digunakan untuk keperluan layanan sekolah dan tidak dibagikan ke pihak ketiga.',
    );
  };

  const showTermsNotice = () => {
    window.alert(
      'Syarat & Ketentuan: Seluruh konten pada situs ini adalah milik SMK Negeri 24 Jakarta dan dapat diperbarui sewaktu-waktu.',
    );
  };

  return (
    <footer className="md:rounded-t-6xl relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center rounded-t-4xl border border-white/15 bg-primary-container bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_50%)] px-6 py-7 text-surface shadow-[0_-12px_30px_rgba(15,41,74,0.18)] lg:py-10">
      <div className="absolute top-0 left-1/2 right-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur" />

      <div className="grid w-full gap-6 xl:grid-cols-3 xl:gap-6">
        {/* Kolom kiri: info sekolah */}
        <AnimatedContainer className="space-y-3">
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
          <p className="mt-8 text-sm leading-relaxed text-surface-container-high md:mt-0">
            Menumbuhkan kecendekiaan generasi bangsa berwawasan global, berakar budi pekerti luhur,
            dan berdaya saing melalui ekosistem pembelajaran holistik.
          </p>
          <div className="space-y-2 text-sm text-surface-container-high">
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-secondary-fixed" />
              <span>
                Jl. Bambu Hitam No. 3, RT.3/RW.1, Bambu Apus, Kec. Cipayung, Jakarta Timur 13890
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="size-4 shrink-0 text-secondary-fixed" />
              <span>(021) 844-1976</span>
            </div>
            <div className="flex items-center gap-2">
              <MailIcon className="size-4 shrink-0 text-secondary-fixed" />
              <span>humassmkn24jakarta@gmail.com</span>
            </div>
          </div>
          <p className="text-sm text-surface-container-high">
            © {new Date().getFullYear()} SMK Negeri 24 Jakarta. All rights reserved.
          </p>
        </AnimatedContainer>

        {/* Tiga kolom lainnya: akses cepat, program keahlian, koneksi */}
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 xl:col-span-2 xl:mt-0">
          {footerSections.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-4 md:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-surface">{section.label}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-surface-container-high">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      {link.href.startsWith('http') || link.href.startsWith('mailto:') || link.href.startsWith('tel:') ? (
                        <a
                          href={link.href}
                          className="inline-flex items-center transition-all duration-300 hover:text-surface"
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {link.icon && <link.icon className="me-1 size-4" />}
                          {link.title}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center transition-all duration-300 hover:text-surface"
                        >
                          {link.icon && <link.icon className="me-1 size-4" />}
                          {link.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      {/* Divider dan baris bawah */}
      <div className="mt-8 flex w-full flex-col items-center justify-between gap-3 border-t border-white/20 pt-4 text-sm text-surface-container-high sm:flex-row">
        <p className="text-xs sm:text-sm">Hak Cipta © {new Date().getFullYear()} SMK Negeri 24 Jakarta. Terakreditasi A BAN-S/M.</p>
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="transition hover:text-surface hover:underline" onClick={showPrivacyNotice} type="button">
            Privasi
          </button>
          <button className="transition hover:text-surface hover:underline" onClick={showTermsNotice} type="button">
            Syarat &amp; Ketentuan
          </button>
          <Link href="/" className="transition hover:text-surface hover:underline">
            Peta Situs
          </Link>
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}