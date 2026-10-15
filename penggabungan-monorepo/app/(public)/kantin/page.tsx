import type { Metadata } from "next";
import KantinStorefront from "@/components/kantin/KantinStorefront";

export const metadata: Metadata = {
  title: "Kantin Sekolah — SMKN 24 Jakarta",
  description: "Pilih menu kantin, pesan, dan bayar dengan GoPay atau QRIS.",
};

export default function KantinPage() {
  return <KantinStorefront />;
}
