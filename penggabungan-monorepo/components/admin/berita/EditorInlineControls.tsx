"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  SeparatorHorizontal,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { toolBtn } from "./editorToolbarBits";

/** Format inline: tebal/miring/garis bawah/coret. */
export function InlineControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <>
      <button type="button" title="Tebal" aria-label="Tebal" aria-pressed={editor.isActive("bold")} disabled={disabled} className={toolBtn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Miring" aria-label="Miring" aria-pressed={editor.isActive("italic")} disabled={disabled} className={toolBtn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Garis bawah" aria-label="Garis bawah" aria-pressed={editor.isActive("underline")} disabled={disabled} className={toolBtn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Coret" aria-label="Coret" aria-pressed={editor.isActive("strike")} disabled={disabled} className={toolBtn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

/** Alignment teks paragraf/heading. */
export function AlignControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <>
      <button type="button" title="Rata kiri" aria-label="Rata kiri" disabled={disabled} className={toolBtn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Rata tengah" aria-label="Rata tengah" disabled={disabled} className={toolBtn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Rata kanan" aria-label="Rata kanan" disabled={disabled} className={toolBtn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Rata kiri-kanan" aria-label="Rata kiri-kanan" disabled={disabled} className={toolBtn(editor.isActive({ textAlign: "justify" }))} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <AlignJustify aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}

/** List, kutipan, garis pemisah. */
export function ListControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <>
      <button type="button" title="Daftar bullet" aria-label="Daftar bullet" disabled={disabled} className={toolBtn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Daftar bernomor" aria-label="Daftar bernomor" disabled={disabled} className={toolBtn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Kutipan" aria-label="Kutipan" disabled={disabled} className={toolBtn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" title="Garis pemisah" aria-label="Garis pemisah" disabled={disabled} className={toolBtn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <SeparatorHorizontal aria-hidden className="h-4 w-4" />
      </button>
    </>
  );
}
