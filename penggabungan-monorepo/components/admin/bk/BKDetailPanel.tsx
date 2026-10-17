"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  MessageSquareText,
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
import {
  buildAssistantPlan,
  maskPhone,
  parseTranskrip,
  STATUS_LIST,
} from "./bk-helpers";

type Props = {
  row: PesanBKDTO | null;
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

  if (!row) {
    return (
      <section
        aria-label="Detail pesan BK"
        className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-surface-container bg-surface-container-lowest p-space-lg text-center"
      >
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Pilih salah satu pesan di antrean untuk melihat detail dan menindaklanjuti.
        </p>
      </section>
    );
  }

  const plan = buildAssistantPlan(row);
  const transcript = parseTranskrip(row.transkrip);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(plan.draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label={`Detail pesan dari ${row.nama}`}
      className="space-y-space-md rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface-container-lowest to-secondary-container p-space-lg shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-space-sm">
        <div className="flex items-start gap-space-sm">
          <button type="button" onClick={onBack} className={`${buttonGhostClass} lg:hidden`} aria-label="Kembali ke antrean">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Antrean
          </button>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles aria-hidden className="h-5 w-5" />
          </div>
          <div>
            <p className="font-label-md text-label-md font-bold text-primary">AI Asisten BK</p>
            <h2 className="mt-1 font-headline-sm text-headline-sm font-bold text-on-surface">
              {row.nama} · {row.kelas}
            </h2>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              {row.tanggal}
              {antreanGenting > 0 && (
                <> · <strong>{antreanGenting}</strong> kasus genting lain menunggu</>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={copyDraft} className={buttonGhostClass}>
          <Copy aria-hidden className="h-4 w-4" />
          {copied ? "Tersalin" : "Salin respons"}
        </button>
      </div>
      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="font-label-md text-label-md font-bold text-on-surface">Ringkasan situasi</p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface">{row.ringkasan ?? row.pesan}</p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          Keperluan: {row.keperluan}
          {row.noHp ? ` · ${maskPhone(row.noHp)}` : ""}
        </p>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="flex items-center gap-2 font-label-md text-label-md font-bold text-on-surface">
          <MessageSquareText aria-hidden className="h-4 w-4 text-primary" />
          Cerita siswa
        </p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface">{row.pesan}</p>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="font-label-md text-label-md font-bold text-on-surface">Riwayat chat</p>
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
          {transcript.length > 0 ? (
            transcript.map((entry, index) => (
              <div
                key={`${row.id}-${index}`}
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
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

      <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
        <p className="font-label-md text-label-md font-bold text-on-surface">Saran tindak lanjut</p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{plan.priorityText}</p>
        <ul className="mt-space-sm list-disc space-y-2 pl-5 font-body-sm text-body-sm text-on-surface">
          {plan.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <textarea
          readOnly
          value={plan.draft}
          rows={5}
          aria-label="Draf respons AI"
          className={`${fieldClass} mt-space-sm bg-surface-container-high text-on-surface`}
        />
      </div>

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

