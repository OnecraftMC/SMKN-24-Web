"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
// FontSize sudah menjadi bagian TextStyle di Tiptap v3 (lihat
// node_modules/@tiptap/extension-text-style/dist/index.js: FontSize).
import { Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/admin/upload";
import { EditorToolbar } from "./EditorToolbar";
import { TableControls } from "./EditorMediaControls";

/**
 * Editor rich-text berita (Tiptap) — toolbar gaya WP/Blogger.
 *
 * Output `getHTML()` dikirim ke backend sebagai `isi`; backend membersihkan
 * via sanitizeBeritaHtml() sebelum simpan. Nilai awal boleh teks polos
 * (data lama) — Tiptap menampilkannya sebagai satu paragraf.
 */
export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const toolbarId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      TextStyle,
      Underline,
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapImage.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap min-h-[16rem] px-3 py-2.5 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  function setHtml(html: string) {
    if (!editor) return;
    editor.commands.setContent(html || "", { emitUpdate: true });
  }

  const applyLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan (https://…)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  async function handleImageFile(file: File | undefined) {
    if (!file || !editor) return;
    setUploadError(null);
    setUploading(true);
    try {
      const path = await uploadImage(file);
      editor.chain().focus().setImage({ src: path }).run();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!editor) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant"
      >
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        Memuat editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        uploading={uploading}
        toolbarId={toolbarId}
        fileRef={fileRef}
        onApplyLink={applyLink}
      />
      <TableControls editor={editor} disabled={disabled} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleImageFile(e.target.files?.[0])}
      />
      <EditorContent editor={editor} id={toolbarId} />
      {uploadError && (
        <p role="alert" className="border-t border-surface-container px-3 py-2 font-body-sm text-body-sm text-error">
          {uploadError}
        </p>
      )}
      <RichTextEditorSync editor={editor} value={value} setHtml={setHtml} />
    </div>
  );
}

/** Menjaga konten sinkron bila `value` diubah dari luar (muat edit / draf AI). */
function RichTextEditorSync({
  editor,
  value,
  setHtml,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  value: string;
  setHtml: (html: string) => void;
}) {
  const lastExternal = useRef(value);
  useEffect(() => {
    if (value !== lastExternal.current && value !== editor.getHTML()) {
      setHtml(value);
    }
    lastExternal.current = value;
  }, [value, editor, setHtml]);
  return null;
}
