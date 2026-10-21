"use client";

/**
 * Poros waktu dashboard admin — tanda tangan halaman Overview.
 *
 * Halaman dibaca sebagai SATU HARI yang berjalan ke bawah, bukan sebagai
 * kumpulan kartu modul. Sumbu vertikal memetakan jam ke jarak; garis
 * "sekarang" bergerak mengikuti waktu lokal sehingga admin langsung tahu mana
 * yang sudah lewat dan mana yang akan datang. Urgensi adalah jarak terhadap
 * garis itu, bukan ukuran kartu atau warna.
 *
 * PRIVASI. Kartu kerja di poros ini anonim untuk data siswa: pesan BK tampil
 * sebagai "Pesan konseling" + hasil triase (kategori, tingkat kesulitan, tanda
 * perlu perhatian) tanpa nama, kelas, nomor HP, isi pesan, atau NISN. Pengajuan
 * prestasi menampilkan nama lomba dan tingkatnya, bukan nama siswa. Detail
 * tetap ada di /admin/bk dan /admin/prestasi.
 *
 * RAK TANPA JAM. Item tanpa jam yang bisa dibaca (agenda tanpa kolom waktu,
 * pengajuan tanpa waktu kedatangan) tidak dibuang: mereka menunggu di rak
 * tersendiri, tetap ikut diurutkan menurut prioritas.
 */

import { Fragment } from "react";
import Link from "next/link";
import { CalendarClock, MessageSquareHeart, Trophy } from "lucide-react";
import Badge from "@/components/ui/Badge";

export type NadaTag = "netral" | "perhatian" | "mendesak";

export type WorkItem = {
  /** Unik di dalam poros. */
  id: string;
  jenis: "bk" | "prestasi" | "agenda";
  label: string;
  judul: string;
  detail: string | null;
  /** Menit sejak tengah malam; null bila tidak ada jam yang bisa dibaca. */
  menit: number | null;
  /** Tanggal nyata item — membedakan hari ini dari yang tertunda. */
  tanggal: Date | null;
  /** true bila item berasal dari hari sebelum hari ini dan belum ditangani. */
  tertunda: boolean;
  tag: { teks: string; nada: NadaTag } | null;
  href: string;
  aksi: string;
  /** Jumlah bukti/lampiran; 0 berarti tidak ada. */
  lampiran: number;
};

/** Panjang poros dalam piksel CSS (≈660px ter-render pada zoom 0,75). */
const TINGGI_POROS = 880;
const LEBAR_KOLOM_JAM = 58;
const MENIT_PER_HARI = 24 * 60;
const TINGGI_KARTU = 62;
const JARAK_KARTU = 8;

/**
 * Badge hasil triase. Pasangan warna dipilih dari token yang memang
 * berpasangan (permutation), bukan dari token yang kebetulan aman: amber untuk
 * perhatian, merah muda Error untuk yang mendesak. Merah tidak pernah dipakai
 * sebagai hiasan.
 */
/** Nada tag memandu warna; geraknya: `mendesak` berdenyut sekali. */
const GAYA_NADA: Record<NadaTag, string> = {
  netral: "bg-surface-container text-on-surface-variant",
  perhatian: "bg-secondary-container text-on-secondary-fixed",
  mendesak: "bg-error-container text-on-error-container",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function jamLabel(menit: number): string {
  return `${String(Math.floor(menit / 60)).padStart(2, "0")}:${String(
    menit % 60,
  ).padStart(2, "0")}`;
}

function tanggalPendek(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/** Posisi kartu: dari jam, lalu didorong turun agar tidak saling tumpang tindih. */
function hitungTataLetak(items: WorkItem[]): { item: WorkItem; top: number }[] {
  const urut = items
    .filter((item) => item.menit !== null)
    .slice()
    .sort((a, b) => (a.menit ?? 0) - (b.menit ?? 0));

  let lantai = 0;
  return urut.map((item) => {
    const ideal = ((item.menit ?? 0) / MENIT_PER_HARI) * TINGGI_POROS;
    const top = Math.max(ideal, lantai);
    lantai = top + TINGGI_KARTU + JARAK_KARTU;
    return { item, top };
  });
}

function IkonJenis({ jenis }: { jenis: WorkItem["jenis"] }) {
  const Ikon =
    jenis === "bk" ? MessageSquareHeart : jenis === "prestasi" ? Trophy : CalendarClock;
  return <Ikon aria-hidden className="h-4 w-4 shrink-0 text-on-surface-variant" />;
}

/** Warna tepi kiri kartu — warna keadaan hanya di sini, bukan di hiasan lain. */
function warnaTepi(nada: NadaTag | undefined): string {
  if (nada === "mendesak") return "bg-error";
  if (nada === "perhatian") return "bg-secondary-container";
  return "bg-outline-variant";
}

function BarisMeta({ item }: { item: WorkItem }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-space-xs text-on-surface-variant">
      <span className="font-label-sm text-label-sm">{item.label}</span>
      {item.detail && (
        <>
          <span aria-hidden>·</span>
          <span className="font-label-sm text-label-sm">{item.detail}</span>
        </>
      )}
      {item.lampiran > 0 && (
        <>
          <span aria-hidden>·</span>
          <span className="font-label-sm text-label-sm">
            {formatNumber(item.lampiran)} lampiran
          </span>
        </>
      )}
      <Link
        href={item.href}
        className="ml-auto shrink-0 font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
      >
        {item.aksi}
        <span className="sr-only"> — {item.label}</span>
      </Link>
    </div>
  );
}

function KartuKerja({ item, top }: { item: WorkItem; top: number }) {
  return (
    <li className="absolute right-0 left-0" style={{ top: `${top}px` }}>
      <div className="rounded-xl border border-surface-container bg-surface-container-lowest py-2 pl-3.5 pr-3 shadow-sm">
        <div
          aria-hidden
          className={`absolute left-0 h-[62px] w-[3px] rounded-full ${warnaTepi(
            item.tag?.nada,
          )}`}
        />
        <div className="flex items-center gap-space-xs">
          <IkonJenis jenis={item.jenis} />
          <p className="truncate font-label-md text-label-md font-bold text-on-surface">
            {item.judul}
          </p>
          {item.tag && (
            <Badge
              variant="adat"
              className={GAYA_NADA[item.tag.nada]}
              tone={item.tag.nada === "mendesak" ? "attention" : "static"}
              label={item.tag.teks}
            />
          )}
        </div>
        <BarisMeta item={item} />
      </div>
    </li>
  );
}

/** Daftar harian untuk ponsel: poros vertikal tidak muat di layar sempit. */
function DaftarHarian({ items, nowMenit }: { items: WorkItem[]; nowMenit: number | null }) {
  const urut = items
    .filter((item) => item.menit !== null)
    .slice()
    .sort((a, b) => (a.menit ?? 0) - (b.menit ?? 0));

  if (urut.length === 0) {
    return (
      <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant">
        Tidak ada pekerjaan bertanggal untuk hari ini.
      </p>
    );
  }

  // Indeks item pertama yang belum lewat — penanda "sekarang" disisipkan satu
  // kali di sana, dihitung tanpa mengubah variabel saat render.
  const indeksSekarang =
    nowMenit === null
      ? -1
      : urut.findIndex((item) => (item.menit ?? 0) >= nowMenit);

  return (
    <ol className="space-y-space-sm">
      {urut.map((item, index) => {
        const sisipSekarang = index === indeksSekarang;

        return (
          <Fragment key={item.id}>
            {sisipSekarang && (
              <li className="flex items-center gap-space-xs" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-secondary-container" />
                <span className="h-px flex-1 bg-secondary-container" />
                <span className="font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                  Sekarang
                </span>
              </li>
            )}
            <li className="rounded-xl border border-surface-container bg-surface-container-lowest p-3">
              <div className="flex items-center gap-space-xs">
                <span className="tabular-nums font-label-md text-label-md font-bold text-secondary">
                  {jamLabel(item.menit ?? 0)}
                </span>
                <IkonJenis jenis={item.jenis} />
                <p className="truncate font-label-md text-label-md font-bold text-on-surface">
                  {item.judul}
                </p>
                {item.tag && (
                  <Badge
                    variant="adat"
                    className={`ml-auto ${GAYA_NADA[item.tag.nada]}`}
                    tone={item.tag.nada === "mendesak" ? "attention" : "static"}
                    label={item.tag.teks}
                  />
                )}
              </div>
              <BarisMeta item={item} />
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

/** Rak Tanpa Jam: kasus yang tidak punya tenggat tetap punya tempat. */
function RakTanpaJam({ items }: { items: WorkItem[] }) {
  return (
    <section
      aria-label="Rak tanpa jam"
      className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-space-md"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-space-xs">
        <h3 className="font-title-md text-title-md font-bold text-on-surface">
          Tanpa Jam
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {items.length > 0
            ? `${formatNumber(items.length)} item menunggu tanpa tenggat`
            : "Tidak ada item tanpa jam"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
          Semua pekerjaan hari ini punya jam. Item tanpa jam — agenda yang
          waktunya belum diisi, pengajuan yang tanggalnya belum jelas — muncul di
          sini agar tidak hilang.
        </p>
      ) : (
        <ul className="mt-space-sm grid gap-space-sm sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-surface-container bg-surface-container-lowest px-space-sm py-2"
            >
              <p className="truncate font-label-md text-label-md font-bold text-on-surface">
                {item.judul}
              </p>
              <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                {item.label}
                {item.tanggal ? ` · ${tanggalPendek(item.tanggal)}` : ""}
              </p>
              <Link
                href={item.href}
                className="font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
              >
                {item.aksi}
                <span className="sr-only"> — {item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TimeSpine({
  items,
  now,
  state,
  message,
}: {
  items: WorkItem[];
  now: Date | null;
  state: "loading" | "error" | "ok";
  message?: string;
}) {
  const tanpaJam = items.filter((item) => item.menit === null);
  const bertanggal = items.filter((item) => item.menit !== null);
  const tertunda = bertanggal.filter((item) => item.tertunda);
  const hariIni = bertanggal.filter((item) => !item.tertunda);
  const tataLetak = hitungTataLetak(hariIni);
  const nowMenit = now ? now.getHours() * 60 + now.getMinutes() : null;
  const nowTop = nowMenit === null ? null : (nowMenit / MENIT_PER_HARI) * TINGGI_POROS;
  const jamTicks = Array.from({ length: 13 }, (_, i) => i * 2);

  return (
    <div className="space-y-space-md">
      <div className="flex flex-wrap items-baseline justify-between gap-space-xs">
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
          Poros Hari Ini
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {state === "ok"
            ? `${formatNumber(bertanggal.length)} pekerjaan bertanggal · ${formatNumber(
                tanpaJam.length,
              )} tanpa jam`
            : "Memuat pekerjaan hari ini…"}
        </p>
      </div>

      {state === "error" ? (
        <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
          <p className="font-body-md text-body-md font-bold text-error">
            Poros hari ini gagal dimuat
          </p>
          <p className="mt-1 break-words font-body-sm text-body-sm text-on-surface-variant">
            {message} Muat ulang lewat tombol di atas. Bagian lain halaman ini
            tetap berlaku untuk sumber yang berhasil dimuat.
          </p>
        </div>
      ) : state === "loading" ? (
        <div
          className="animate-pulse rounded-xl border border-surface-container bg-surface-container-lowest"
          style={{ height: `${TINGGI_POROS}px` }}
          role="status"
        >
          <span className="sr-only">Memuat poros waktu…</span>
        </div>
      ) : (
        <>
          {tertunda.length > 0 && (
            <section
              aria-label="Menunggu dari hari sebelumnya"
              className="rounded-xl border border-surface-container bg-surface-container-high p-space-md"
            >
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Menunggu dari hari sebelumnya
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Belum ditangani dan tanggalnya sudah lewat — karena itu ada di
                paling atas.
              </p>
              <ul className="mt-space-sm grid gap-space-sm sm:grid-cols-2">
                {tertunda.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-surface-container bg-surface-container-lowest px-space-sm py-2"
                  >
                    <p className="truncate font-label-md text-label-md font-bold text-on-surface">
                      {item.judul}
                    </p>
                    <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                      {item.label} · {item.tanggal ? tanggalPendek(item.tanggal) : "—"} ·{" "}
                      {jamLabel(item.menit ?? 0)}
                    </p>
                    <Link
                      href={item.href}
                      className="font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
                    >
                      {item.aksi}
                      <span className="sr-only"> — {item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Desktop: poros vertikal, jam ke jarak, kartu bertumpu padanya. */}
          <section
            aria-label="Poros waktu hari ini"
            className="relative hidden rounded-xl border border-surface-container bg-surface-container-lowest px-space-md pb-space-md pt-space-sm md:block"
          >
            {hariIni.length === 0 && (
              <p className="mb-space-sm font-body-sm text-body-sm text-on-surface-variant">
                Tidak ada pekerjaan bertanggal untuk hari ini. Agenda hari ini
                bisa diisi dari modul Agenda; pesan dan pengajuan yang masuk akan
                muncul di poros ini sesuai jam masuknya.
              </p>
            )}

            <div className="relative" style={{ height: `${TINGGI_POROS}px` }}>
              <div
                aria-hidden
                className="absolute top-0 bottom-0 bg-chart-spine"
                style={{ left: `${LEBAR_KOLOM_JAM - 10}px`, width: "2px" }}
              />
              {jamTicks.map((jam) => (
                <Fragment key={jam}>
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 border-t border-surface-container"
                    style={{ top: `${(jam / 24) * TINGGI_POROS}px` }}
                  />
                  <span
                    aria-hidden
                    className="absolute w-[44px] font-label-sm text-label-sm tabular-nums text-on-surface-variant"
                    style={{
                      top: `${(jam / 24) * TINGGI_POROS - 8}px`,
                    }}
                  >
                    {String(jam).padStart(2, "0")}:00
                  </span>
                </Fragment>
              ))}

              {nowTop !== null && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-0 left-0 z-20"
                  style={{ top: `${nowTop}px` }}
                >
                  <div className="h-0.5 w-full bg-secondary-container" />
                  <span className="absolute -top-2.5 left-0 h-5 w-5 -translate-x-1 rounded-full bg-secondary-container" />
                </div>
              )}

              <ul className="absolute inset-0" style={{ left: `${LEBAR_KOLOM_JAM + 8}px` }}>
                {tataLetak.map(({ item, top }) => (
                  <KartuKerja key={item.id} item={item} top={top} />
                ))}
              </ul>
            </div>

            <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
              {now
                ? `Garis kuning menandai sekarang — ${jamLabel(
                    now.getHours() * 60 + now.getMinutes(),
                  )}.`
                : "Menyelaraskan garis sekarang…"}
            </p>
          </section>

          {/* Ponsel: poros menjadi daftar harian; tidak tiga panel sempit. */}
          <div className="md:hidden">
            <DaftarHarian items={hariIni} nowMenit={nowMenit} />
          </div>

          <RakTanpaJam items={tanpaJam} />
        </>
      )}
    </div>
  );
}