import type { Agenda, Berita, Pengumuman } from "@shared/types";

const baseUrl = process.env.NEXT_PUBLIC_MAIN_WEB_URL || "http://localhost:3000";

export type ContentKind = "berita" | "pengumuman" | "agenda";
export type ContentRecord = Berita | Pengumuman | Agenda;

export async function getContent<T extends ContentRecord>(kind: ContentKind): Promise<T[]> {
  const response = await fetch(`${baseUrl}/api/${kind}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Gagal memuat ${kind} (${response.status})`);
  return response.json() as Promise<T[]>;
}

export async function createContent(kind: ContentKind, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Gagal menyimpan ${kind} (${response.status})`);
  }
  return response.json();
}
