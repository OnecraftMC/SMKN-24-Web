import { Megaphone } from "lucide-react";
import Link from "next/link";
import type { PengumumanView } from "@/lib/shared/mappers";
import { IkonLucide } from "@/lib/ikonLucide";
import Badge from "@/components/ui/Badge";

export default function PapanPengumuman({
  pengumuman,
  error,
}: {
  pengumuman: PengumumanView[];
  error: string | null;
}) {
  return (
    <div className="lg:col-span-5 space-y-space-lg">
      <div>
        <div className="inline-flex items-center gap-2 text-secondary font-bold font-label-sm text-label-sm uppercase tracking-wider">
          <Megaphone aria-hidden="true" className="micro-icon h-[18px] w-[18px]" />
          <span>Papan Informasi</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-primary font-bold">
          Pengumuman Penting
        </h2>
      </div>

      <div className="micro-stagger space-y-space-sm">
        {pengumuman.map((item) => (
          <div
            key={item.id}
            className={`micro-row p-space-md rounded-2xl ${
              item.variant === "secondary"
                ? "bg-secondary-container/15 text-on-surface transition-all hover:bg-secondary-container/25 border border-secondary-container/20"
                : "bg-surface-container-low text-on-surface transition-all hover:bg-surface-container border border-surface-container"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant={item.variant === "secondary" ? "inkSecondary" : "inkSolid"}
                className="uppercase tracking-wider"
                label={item.badge || item.kategori}
              />
              {item.status && (
                <span className="font-body-sm text-body-sm text-secondary font-bold text-xs">
                  {item.status}
                </span>
              )}
            </div>
            <h3 className="font-title-md text-title-md text-primary font-bold">{item.judul}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {item.deskripsi}
            </p>
            {item.linkHref && item.linkLabel && (
              <Link
                href={item.linkHref}
                className="mt-space-sm pt-space-xs flex items-center justify-between text-xs text-secondary font-bold cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <IkonLucide nama={item.icon || "info"} className="h-4 w-4" />
                  {item.linkLabel}
                </span>
                <IkonLucide nama={item.actionIcon || "arrow_forward"} className="micro-arrow h-[18px] w-[18px]" />
              </Link>
            )}
          </div>
        ))}
        {pengumuman.length === 0 && (
          <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
            {error ? `Pengumuman belum dapat dimuat: ${error}` : "Belum ada pengumuman aktif."}
          </p>
        )}
      </div>
    </div>
  );
}