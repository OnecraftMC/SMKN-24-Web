"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { PesanBKDTO, StatusPesanBK } from "@/lib/admin/types";
import {
  buttonGhostClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "@/components/ui/select-morph";
import BKEvidence from "./BKEvidence";
import Badge from "@/components/ui/Badge";
import {
  GAYA_KESULITAN,
  buildAssistantPlan,
  maskPhone,
  parseTranskrip,
  STATUS_LIST,
} from "./bk-helpers";

type Props = {
  row: PesanBKDTO | null;
  hasOpenCases: boolean;
  antreanGenting: number;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  replyBusy: boolean;
  replyError: string | null;
  replySuccess: string | null;
  onSendReply: (event: React.FormEvent<HTMLFormElement>) => void;
  busyId: number | null;
  onChangeStatus: (row: PesanBKDTO, status: StatusPesanBK) => void;
  onDelete: (row: PesanBKDTO) => void;
  onBack: () => void;
};
export default function BKDetailPanel({
  row,
  hasOpenCases,
  antreanGenting,
  replyText,
  onReplyTextChange,
  replyBusy,
  replyError,
  replySuccess,
  onSendReply,
  busyId,
  onChangeStatus,
  onDelete,
  onBack,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [chatFocus, setChatFocus] = useState(false);
  const focusTranscriptRef = useRef<HTMLDivElement | null>(null);
  const focusReplyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!chatFocus || !row) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = focusTranscriptRef.current;
      if (panel) panel.scrollTop = panel.scrollHeight;
      focusReplyRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chatFocus, row]);

  if (!row) {
    return (
      <section
        aria-label="Detail pesan BK"
        className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-surface-container bg-surface-container-lowest p-space-lg text-center"
      >
        <div>
          <p className="font-title-md text-title-md font-bold text-on-surface">
            {hasOpenCases ? "Pilih pesan BK" : "Tidak ada laporan terbuka"}
          </p>
          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
            {hasOpenCases
              ? "Pilih salah satu pesan di antrean untuk melihat detail dan menindaklanjuti."
              : "Semua laporan sudah selesai. Pilih laporan pada bagian Selesai untuk melihat riwayatnya."}
          </p>
        </div>
      </section>
    );
  }

  const plan = buildAssistantPlan(row);
  const transcript = parseTranskrip(row.transkrip);

  const copyDraft = async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(plan.draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopied(false);
      setCopyError(
        error instanceof Error
          ? "Draf tidak dapat disalin. Izinkan akses papan klip, lalu coba lagi."
          : "Draf tidak dapat disalin. Coba lagi.",
      );
    }
  };

  return (
    <section
      aria-label={`Detail pesan dari ${row.nama}`}
      className="space-y-space-md"
    >
      {chatFocus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bk-chat-focus-title"
          className="fixed inset-0 z-[100] flex flex-col bg-surface-container-lowest"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-surface-container bg-primary-container px-4 py-3 text-surface sm:px-6">
            <div className="min-w-0">
              <p className="font-label-sm font-bold uppercase tracking-wide text-surface-container-high">Mode fokus · Riwayat chat lengkap</p>
              <h2 id="bk-chat-focus-title" className="truncate font-title-md font-bold">
                {row.nama} · {row.kelas}
              </h2>
              <p className="text-xs text-surface-container-high">{row.tanggal}</p>
            </div>
            <button
              type="button"
              onClick={() => setChatFocus(false)}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/25 px-3 font-label-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Minimize2 aria-hidden className="size-4" />
              Tutup fokus
            </button>
          </header>
          <div ref={focusTranscriptRef} className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low px-4 py-5 sm:px-6">
            <div className="mx-auto w-full max-w-4xl space-y-3">
              {transcript.length > 0 ? transcript.map((entry, index) => (
                <div
                  key={`focus-${row.id}-${index}`}
                  className={`flex ${entry.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <p className={`max-w-[min(90%,52rem)] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${entry.sender === "user" ? "bg-primary text-surface" : "bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-surface-container"}`}>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide opacity-70">
                      {entry.sender === "user" ? "Siswa" : entry.sender === "counselor" ? "Guru BK" : "Konselor AI"}
                    </span>
                    {entry.text}
                  </p>
                </div>
              )) : (
                <div className="rounded-2xl bg-surface-container-lowest p-4 text-sm leading-relaxed text-on-surface shadow-sm">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Cerita siswa</span>
                  <p className="whitespace-pre-wrap">{row.pesan}</p>
                </div>
              )}
            </div>
          </div>
          <form onSubmit={onSendReply} className="shrink-0 border-t border-surface-container bg-surface-container-lowest p-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex max-w-4xl items-end gap-2">
              {row.canReply ? (
                <>
                  <label htmlFor="bk-reply-focus" className="sr-only">Balasan Guru BK</label>
                  <textarea
                    ref={focusReplyRef}
                    id="bk-reply-focus"
                    value={replyText}
                    onChange={(event) => onReplyTextChange(event.target.value)}
                    rows={2}
                    maxLength={5000}
                    disabled={replyBusy}
                    className={`${fieldClass} min-h-12 flex-1 resize-y`}
                    placeholder="Tulis balasan untuk siswa…"
                  />
                  <button type="submit" disabled={replyBusy || replyText.trim() === ""} className={`${buttonGhostClass} min-h-12 shrink-0`}>
                    {replyBusy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
                    <span className="hidden sm:inline">{replyBusy ? "Mengirim…" : "Kirim"}</span>
                  </button>
                </>
              ) : (
                <p className="w-full rounded-xl bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
                  Balasan portal tidak tersedia untuk pesan ini karena tidak terhubung dengan ID perangkat siswa.
                </p>
              )}
            </div>
            {replyError && <p role="alert" className="mx-auto mt-2 max-w-4xl text-sm text-error">{replyError}</p>}
            {replySuccess && <p role="status" className="mx-auto mt-2 max-w-4xl text-sm text-primary">{replySuccess}</p>}
          </form>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-space-sm">
        <div className="flex items-start gap-space-sm">
          <button type="button" onClick={onBack} className={`${buttonGhostClass} lg:hidden`} aria-label="Kembali ke antrean">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Antrean
          </button>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-container-high text-primary">
            <Sparkles aria-hidden className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-label-md text-label-md font-bold text-primary">Rencana tindak lanjut</p>
            <h2 className="mt-1 break-words font-headline-sm text-headline-sm font-bold text-on-surface [overflow-wrap:anywhere]">
              {row.nama} · {row.kelas}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <span>{row.tanggal}</span>
              {row.butuhPerhatian && (
                <Badge tone="attention" variant="errorSolid" aria-label="Pesan butuh perhatian segera" label="Perlu perhatian" />
              )}
              {row.tingkatKesulitan && (
                <Badge variant="adat" className={GAYA_KESULITAN[row.tingkatKesulitan]} label={row.tingkatKesulitan} />
              )}
              <Badge variant="neutral" label={row.status} />
              {antreanGenting > 0 && (
                <span><strong>{antreanGenting}</strong> kasus prioritas lain menunggu</span>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => void copyDraft()} className={buttonGhostClass}>
          <Copy aria-hidden className="h-4 w-4" />
          {copied ? "Tersalin" : "Salin respons"}
        </button>
      </div>
      {copyError && <p role="alert" className="font-body-sm text-body-sm text-error">{copyError}</p>}

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="font-label-md text-label-md font-bold text-on-surface">Saran untuk ditinjau</p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Ini pengingat administratif, bukan keputusan klinis. Guru BK menentukan langkah penanganan.
        </p>
        <p className="mt-space-sm rounded-lg bg-surface-container-low px-space-sm py-space-sm font-body-sm text-body-sm text-on-surface [overflow-wrap:anywhere]">
          {plan.priorityText}
        </p>
        <ul className="mt-space-sm list-disc space-y-2 pl-5 font-body-sm text-body-sm text-on-surface [overflow-wrap:anywhere]">
          {plan.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-space-md font-label-sm text-label-sm font-bold text-on-surface">Draf respons</p>
        <p className="mt-1 whitespace-pre-wrap font-body-sm text-body-sm text-on-surface [overflow-wrap:anywhere]">
          {plan.draft}
        </p>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="font-label-md text-label-md font-bold text-on-surface">Ringkasan situasi</p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface [overflow-wrap:anywhere]">{row.ringkasan ?? row.pesan}</p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant [overflow-wrap:anywhere]">
          Keperluan: {row.keperluan}
          {row.noHp ? ` · ${maskPhone(row.noHp)}` : ""}
        </p>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="flex items-center gap-2 font-label-md text-label-md font-bold text-on-surface">
          <MessageSquareText aria-hidden className="h-4 w-4 text-primary" />
          Cerita siswa
        </p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface [overflow-wrap:anywhere]">{row.pesan}</p>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <div className="flex items-center justify-between gap-2">
          <p className="font-label-md text-label-md font-bold text-on-surface">Riwayat chat</p>
          <button
            type="button"
            onClick={() => setChatFocus(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 font-label-sm font-bold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Maximize2 aria-hidden className="size-4" />
            Fokus chat
          </button>
        </div>
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
          {transcript.length > 0 ? (
            transcript.map((entry, index) => (
              <div
                key={`${row.id}-${index}`}
                className={`break-words rounded-lg px-3 py-2 text-xs leading-relaxed [overflow-wrap:anywhere] ${
                  entry.sender === "user"
                    ? "bg-primary/10 text-on-surface"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {entry.text}
              </div>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant">
              Belum ada riwayat percakapan sebelumnya.
            </p>
          )}
        </div>
      </div>

      <BKEvidence files={row.media ?? []} />

      <form
        onSubmit={onSendReply}
        className="rounded-xl border border-primary/15 bg-surface-container-lowest p-space-md"
      >
        <label htmlFor="bk-reply" className="font-label-md text-label-md font-bold text-on-surface">
          Balasan Guru BK
        </label>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Balasan akan tampil di tab Riwayat BK milik perangkat siswa yang mengirim cerita ini.
        </p>
        {row.canReply ? (
          <>
            <textarea
              id="bk-reply"
              value={replyText}
              onChange={(event) => onReplyTextChange(event.target.value)}
              rows={4}
              maxLength={5000}
              disabled={replyBusy}
              className={`${fieldClass} mt-space-sm`}
              placeholder="Tulis respons yang empatik dan langkah tindak lanjut untuk siswa…"
            />
            <div className="mt-space-sm flex flex-wrap items-center justify-between gap-space-sm">
              <span className="font-body-sm text-body-sm text-on-surface-variant">{replyText.length}/5000</span>
              <button type="submit" disabled={replyBusy || replyText.trim() === ""} className={buttonGhostClass}>
                {replyBusy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
                {replyBusy ? "Mengirim…" : "Kirim balasan ke siswa"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-space-sm rounded-lg bg-surface-container-high px-3 py-2 font-body-sm text-body-sm text-on-surface-variant" role="status">
            Pesan ini tidak terhubung ke riwayat perangkat siswa, jadi balasan dari portal tidak dapat ditampilkan secara privat.
          </p>
        )}
        {replyError && <p className="mt-space-sm font-body-sm text-body-sm text-error" role="alert">{replyError}</p>}
        {replySuccess && <p className="mt-space-sm font-body-sm text-body-sm text-primary" role="status">{replySuccess}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-space-sm">
        <MorphSelect value={row.status} onValueChange={(v) => onChangeStatus(row, v as StatusPesanBK)} disabled={busyId === row.id}>
          <MorphSelectTrigger className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm">
            <MorphSelectValue />
          </MorphSelectTrigger>
          <MorphSelectContent>
            {STATUS_LIST.map((s) => (
              <MorphSelectItem key={s} value={s}>
                {s}
              </MorphSelectItem>
            ))}
          </MorphSelectContent>
        </MorphSelect>
        {busyId === row.id && (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin text-on-surface-variant" />
        )}
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 font-label-sm text-label-sm font-bold text-error"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          Hapus
        </button>
      </div>
    </section>
  );
}
