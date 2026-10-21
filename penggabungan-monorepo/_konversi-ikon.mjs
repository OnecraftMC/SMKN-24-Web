// Skrip konversi sekali-jalan: material-symbols-outlined (statis) -> lucide-react.
// Hanya menyentuh span yang berisi nama ikon statis; lokasi dinamis dari data
// tidak diganggu (ditangani manual). Jalankan: node _konversi-ikon.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PETA = {
  arrow_back: "ArrowLeft",
  arrow_forward: "ArrowRight",
  arrow_outward: "ArrowUpRight",
  apartment: "Building2",
  calendar_month: "CalendarDays",
  calendar_today: "CalendarDays",
  event: "CalendarCheck",
  call: "Phone",
  campaign: "Megaphone",
  chevron_right: "ChevronRight",
  expand_more: "ChevronDown",
  close: "X",
  close_fullscreen: "Minimize2",
  directions: "Navigation",
  explore: "Compass",
  flag: "Flag",
  format_quote: "Quote",
  forum: "MessagesSquare",
  fullscreen: "Maximize2",
  groups: "Users",
  waving_hand: "Hand",
  history: "History",
  hourglass_top: "Hourglass",
  info: "Info",
  language: "Languages",
  lightbulb: "Lightbulb",
  local_library: "Library",
  login: "LogIn",
  mail: "Mail",
  menu_book: "BookOpen",
  military_tech: "Medal",
  newspaper: "Newspaper",
  notifications: "Bell",
  open_in_new: "ExternalLink",
  person: "User",
  photo_camera: "Camera",
  photo_library: "Images",
  psychology: "Brain",
  public: "Globe",
  schedule: "Clock",
  school: "GraduationCap",
  send: "Send",
  signature: "Signature",
  stars: "Star",
  support_agent: "Headset",
  verified_user: "ShieldCheck",
  visibility: "Eye",
  volunteer_activism: "HeartHandshake",
  workspace_premium: "Award",
};

// Ekivalensi ukuran: font-size ikon material -> kotak lucide.
const UKURAN = [
  ["text-[11rem]", "h-[11rem] w-[11rem]"],
  ["text-[36px]", "h-9 w-9"],
  ["text-[32px]", "h-8 w-8"],
  ["text-[28px]", "h-7 w-7"],
  ["text-[24px]", "h-6 w-6"],
  ["text-[22px]", "h-[22px] w-[22px]"],
  ["text-[20px]", "h-5 w-5"],
  ["text-[19px]", "h-[19px] w-[19px]"],
  ["text-[18px]", "h-[18px] w-[18px]"],
  ["text-[16px]", "h-4 w-4"],
  ["text-[15px]", "h-[15px] w-[15px]"],
  ["text-[14px]", "h-[14px] w-[14px]"],
  ["text-[13px]", "h-[13px] w-[13px]"],
  ["text-6xl", "h-[3.75rem] w-[3.75rem]"],
  ["text-4xl", "h-9 w-9"],
  ["text-3xl", "h-7 w-7"],
  ["text-2xl", "h-6 w-6"],
  ["text-base", "h-4 w-4"],
];

const FILE = [
  "components/akademik/AkademikBanner.tsx",
  "components/akademik/FormBK.tsx",
  "components/beranda/AgendaKegiatan.tsx",
  "components/beranda/BeritaTerkini.tsx",
  "components/beranda/Hero.tsx",
  "components/beranda/LokasiSekolahBanner.tsx",
  "components/beranda/PapanPengumuman.tsx",
  "components/beranda/QuickHighlights.tsx",
  "components/beranda/SambutanKepsek.tsx",
  "components/bk/BKChatModal.tsx",
  "components/jurusan/DaftarJurusan.tsx",
  "components/jurusan/JurusanBanner.tsx",
  "components/jurusan/JurusanCta.tsx",
  "components/kabar/FeaturedNews.tsx",
  "components/kabar/GaleriVisual.tsx",
  "components/kabar/KabarBanner.tsx",
  "components/layout/MobileMenu.tsx",
  "components/layout/Navbar.tsx",
  "components/profil/DewanGuru.tsx",
  "components/profil/FasilitasKampus.tsx",
  "components/profil/ProfilHeader.tsx",
  "components/profil/VisiMisi.tsx",
  "app/(public)/berita/[slug]/page.tsx",
  "app/(public)/fasilitas/page.tsx",
];

let total = 0;

for (const rel of FILE) {
  const path = join(process.cwd(), rel);
  let src = readFileSync(path, "utf8");
  const dipakai = new Set();
  let jumlah = 0;

  src = src.replace(
    /<span className="material-symbols-outlined([^"]*)"([^>]*)>([\s\S]*?)<\/span>/g,
    (utuh, cls, atribut, isi) => {
      const nama = isi.trim();
      if (!/^[a-z_]+$/.test(nama) || !PETA[nama]) return utuh; // dinamis / teks lain: biarkan
      const komponen = PETA[nama];
      dipakai.add(komponen);
      jumlah++;

      let sisa = cls.trim() ? ` ${cls.trim()}` : "";
      let dim = "h-6 w-6"; // material default 24px
      for (const [teks, ekui] of UKURAN) {
        if (cls.includes(teks)) {
          dim = ekui;
          sisa = sisa.replace(teks, "");
          break;
        }
      }
      sisa = sisa.replace(/\s+/g, " ").trim();

      const ekstra = atribut
        .replace(/aria-hidden="true"/g, "")
        .trim();
      return `<${komponen} aria-hidden="true" className="${[dim, sisa].filter(Boolean).join(" ")}"${ekstra ? ` ${ekstra}` : ""} />`;
    },
  );

  if (jumlah === 0) continue;

  const daftar = [...dipakai].sort();
  const iLucide = src.indexOf("lucide-react");
  const sudahAda = iLucide !== -1;
  if (sudahAda) {
    src = src.replace(
      /import \{ ([^}]*?) \} from "lucide-react";/,
      (_m, lama) => {
        const gabung = [...new Set([...lama.split(",").map((s) => s.trim()), ...daftar])]
          .filter(Boolean)
          .sort();
        return `import { ${gabung.join(", ")} } from "lucide-react";`;
      },
    );
  } else {
    const imp = `import { ${daftar.join(", ")} } from "lucide-react";\n`;
    src = /^"use client";\r?\n/.test(src)
      ? src.replace(/^("use client";\r?\n)/, `$1${imp}`)
      : imp + src;
  }

  writeFileSync(path, src);
  console.log(`${rel}: ${jumlah} ikon -> ${daftar.join(", ")}`);
  total += jumlah;
}

console.log(`TOTAL: ${total}`);
