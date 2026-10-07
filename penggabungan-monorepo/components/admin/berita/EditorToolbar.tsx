"use client";

import type { RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { BlockControls } from "./EditorBlockControls";
import { InlineControls, AlignControls, ListControls } from "./EditorInlineControls";
import { LinkControls, MediaControls, HistoryControls } from "./EditorMediaControls";
import { Divider } from "./editorToolbarBits";

export type EditorToolbarProps = {
  editor: Editor;
  disabled: boolean;
  uploading: boolean;
  toolbarId: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onApplyLink: () => void;
};

/** Toolbar editor berita gaya WP/Blogger — merakit semua blok kontrol. */
export function EditorToolbar({
  editor,
  disabled,
  uploading,
  toolbarId,
  fileRef,
  onApplyLink,
}: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Toolbar editor berita"
      aria-controls={toolbarId}
      className="flex flex-wrap items-center gap-1 border-b border-surface-container bg-surface-container-low/60 p-2"
    >
      <BlockControls editor={editor} disabled={disabled} />
      <Divider />
      <InlineControls editor={editor} disabled={disabled} />
      <Divider />
      <AlignControls editor={editor} disabled={disabled} />
      <Divider />
      <ListControls editor={editor} disabled={disabled} />
      <Divider />
      <LinkControls editor={editor} disabled={disabled} onApplyLink={onApplyLink} />
      <MediaControls editor={editor} disabled={disabled} uploading={uploading} fileRef={fileRef} />
      <Divider />
      <HistoryControls editor={editor} disabled={disabled} />
    </div>
  );
}
