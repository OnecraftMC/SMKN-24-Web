"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { API_BASE_URL, getStoredToken } from "@/lib/admin/api";
import type { BKEvidenceDTO } from "@/lib/admin/types";

/**
 * Lampiran bukti privat pengadu (foto/suara).
 *
 * Diambil dengan token admin; tidak pernah dibuka ke publik.
 */
export default function BKEvidence({ files }: { files: BKEvidenceDTO[] }) {
  const [items, setItems] = useState<Array<{ file: BKEvidenceDTO; url: string | null }>>([]);

  useEffect(() => {
    const controller = new AbortController();
    const createdUrls: string[] = [];
    const token = getStoredToken();
    void Promise.all(files.map(async (file) => {
      if (!token) return { file, url: null };
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/bk/media/index.php?file=${encodeURIComponent(file.storedName)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const url = URL.createObjectURL(await response.blob());
        createdUrls.push(url);
        return { file, url };
      } catch {
        return { file, url: null };
      }
    })).then(setItems);

    return () => {
      controller.abort();
      createdUrls.forEach(URL.revokeObjectURL);
    };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
      <p className="font-label-md text-label-md font-bold text-on-surface">Lampiran privat pengadu</p>
      <p className="mt-1 text-xs text-on-surface-variant">Hanya admin terautentikasi yang dapat membuka berkas ini.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {items.map(({ file, url }) => (
          <div key={file.storedName} className="max-w-full rounded-lg border border-surface-container p-2">
            <p className="mb-2 text-xs font-semibold text-on-surface">{file.label} ({Math.ceil(file.size / 1024)} KB)</p>
            {url && file.mime.startsWith("image/") ? (
              <a href={url} target="_blank" rel="noreferrer">
                <Image
                  src={url}
                  alt="Bukti foto pengadu"
                  width={256}
                  height={192}
                  unoptimized
                  className="max-h-48 max-w-64 rounded object-contain"
                />
              </a>
            ) : url && file.mime.startsWith("audio/") ? (
              <audio controls src={url} className="max-w-full" aria-label="Pesan suara pengadu" />
            ) : (
              <p role="status" className="text-xs text-on-surface-variant">Lampiran gagal dimuat.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
