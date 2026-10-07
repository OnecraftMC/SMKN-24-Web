"use client";

import type { RefObject } from "react";
import type { Editor } from "@tiptap/react";
import {
  ImagePlus,
  Link2,
  Link2Off,
  Loader2,
  Redo2,
  Table,
  Undo2,
} from "lucide-react";
import { toolBtn } from "./editorToolbarBits";

/** Tautan: tambah/edit + hapus. */
export function LinkControls({
  editor,
  disabled,
  onApplyLink,
}: {
  editor: Editor;
  disabled: boolean;
  onApplyLink: () => void;
}) {
  return (
    <>
      <button type="button" title="Tambah/edit tautan" aria-label="Tambah atau edit tautan" disabled={disabled} className={toolBtn(editor.isActive("link"))} onClick={onApplyLink}>
        <Link2 aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Hapus tautan" aria-label="Hapus tautan" disabled={!editor.isActive("link") || disabled} className={toolBtn(false)} onClick={() => editor.chain().focus().unsetLink().run()}>
        <Link2Off aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

/** Media: sisip gambar + sisip tabel. */
export function MediaControls({
  editor,
  disabled,
  uploading,
  fileRef,
}: {
  editor: Editor;
  disabled: boolean;
  uploading: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <button type="button" title="Sisipkan gambar" aria-label="Sisipkan gambar" disabled={disabled || uploading} className={toolBtn(false)} onClick={() => fileRef.current?.click()}>
        {uploading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <ImagePlus aria-hidden className="h-4 w-4" />}
      </button>
      <button type="button" title="Sisipkan tabel 3x3" aria-label="Sisipkan tabel 3 kolom 3 baris" disabled={disabled} className={toolBtn(false)} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <Table aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

/** Riwayat: urungkan + ulangi. */
export function HistoryControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <>
      <button type="button" title="Urungkan" aria-label="Urungkan" disabled={disabled || !editor.can().undo()} className={toolBtn(false)} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Ulangi" aria-label="Ulangi" disabled={disabled || !editor.can().redo()} className={toolBtn(false)} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

/** Baris kontrol tabel — hanya tampil saat kursor di dalam tabel. */
export function TableControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  if (!editor.isActive("table")) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-surface-container bg-surface-container-low/40 px-2 py-1.5" aria-label="Kontrol tabel">
      <span className="px-1 font-label-sm text-label-sm font-bold text-on-surface-variant">Tabel:</span>
      {(
        [
          ["Tambah kolom", () => editor.chain().focus().addColumnAfter().run()],
          ["Hapus kolom", () => editor.chain().focus().deleteColumn().run()],
          ["Tambah baris", () => editor.chain().focus().addRowAfter().run()],
          ["Hapus baris", () => editor.chain().focus().deleteRow().run()],
          ["Hapus tabel", () => editor.chain().focus().deleteTable().run()],
        ] as const
      ).map(([label, run]) => (
        <button key={label} type="button" disabled={disabled} className={toolBtn(false)} onClick={run}>
          {label}
        </button>
      ))}
    </div>
  );
}
