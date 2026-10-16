"use client";

import type { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react";
import MorphSelect, {
  MorphSelectTrigger,
  MorphSelectValue,
  MorphSelectContent,
  MorphSelectItem,
} from "@/components/ui/select-morph";
import { toolBtn, Divider } from "./editorToolbarBits";

export type EditorLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const FONT_SIZES = [
  { label: "Kecil", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Besar", value: "18px" },
  { label: "Sangat besar", value: "24px" },
  { label: "Judul kecil", value: "32px" },
] as const;

const HEADING_ICONS = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6] as const;

/** Blok: dropdown jenis teks + ukuran + heading cepat. */
export function BlockControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const activeLevel = ([1, 2, 3, 4, 5, 6] as EditorLevel[]).find((l) =>
    editor.isActive("heading", { level: l }),
  );
  return (
    <>
      <MorphSelect
        disabled={disabled}
        value={String(activeLevel ?? (editor.isActive("paragraph") ? "p" : ""))}
        onValueChange={(v) => {
          if (v === "p" || v === "") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: Number(v) as EditorLevel }).run();
          }
        }}
        className="w-auto"
      >
        <MorphSelectTrigger className="h-9 rounded-md border border-outline-variant bg-surface-container-lowest px-2 font-label-sm text-label-sm font-bold text-on-surface">
          <MorphSelectValue />
        </MorphSelectTrigger>
        <MorphSelectContent>
          <MorphSelectItem value="p">Paragraf</MorphSelectItem>
          {([1, 2, 3, 4, 5, 6] as EditorLevel[]).map((l) => (
            <MorphSelectItem key={l} value={String(l)}>
              Heading {l}
            </MorphSelectItem>
          ))}
        </MorphSelectContent>
      </MorphSelect>

      <MorphSelect
        disabled={disabled}
        value={
          FONT_SIZES.find((s) => s.value !== "" && editor.isActive("textStyle", { fontSize: s.value }))
            ?.value ?? ""
        }
        onValueChange={(v) => {
          if (v === "") {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(v).run();
          }
        }}
        className="w-auto"
      >
        <MorphSelectTrigger className="h-9 rounded-md border border-outline-variant bg-surface-container-lowest px-2 font-label-sm text-label-sm font-bold text-on-surface">
          <MorphSelectValue />
        </MorphSelectTrigger>
        <MorphSelectContent>
          {FONT_SIZES.map((s) => (
            <MorphSelectItem key={s.label} value={s.value}>
              {s.label}
            </MorphSelectItem>
          ))}
        </MorphSelectContent>
      </MorphSelect>

      <Divider />

      {([1, 2, 3, 4, 5, 6] as EditorLevel[]).map((l) => {
        const Icon = HEADING_ICONS[l - 1];
        const active = editor.isActive("heading", { level: l });
        return (
          <button
            key={l}
            type="button"
            title={`Heading ${l}`}
            aria-label={`Heading ${l}`}
            aria-pressed={active}
            disabled={disabled}
            className={toolBtn(active)}
            onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
          >
            <Icon aria-hidden className="h-4 w-4" />
          </button>
        );
      })}
    </>
  );
}
