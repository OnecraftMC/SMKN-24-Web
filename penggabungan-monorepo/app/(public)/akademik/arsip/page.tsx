import type { Metadata } from "next";
import DirektoriArsip from "@/components/akademik/DirektoriArsip";
import { getArsip } from "@/lib/api";

export const metadata: Metadata = {
  title: "Direktori Arsip | Akademik SMK Negeri 24 Jakarta",
  description: "Cari dan unduh dokumen akademik serta berkas resmi SMK Negeri 24 Jakarta.",
};

export default async function DirektoriArsipPage() {
  const arsip = await getArsip();
  return <DirektoriArsip dokumen={arsip.data} error={arsip.error} />;
}
