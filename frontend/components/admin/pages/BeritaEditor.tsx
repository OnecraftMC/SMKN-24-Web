"use client";

interface BeritaEditorProps {
  setCurrentPage: (page: string) => void;
}

export default function BeritaEditor({ setCurrentPage }: BeritaEditorProps) {
  return (
    <div className="page-section fade-in">
      <button
        onClick={() => setCurrentPage("berita")}
        className="inline-flex items-center gap-space-2xs font-label-md text-label-md text-primary mb-space-md hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke daftar berita
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-space-lg items-start">
        <div className="space-y-space-md">
          <input
            className="w-full font-headline-sm text-headline-sm text-on-surface font-bold placeholder:text-on-surface-variant/60 border-0 border-b-2 border-outline-variant focus:outline-none focus:border-primary pb-space-sm bg-transparent"
            placeholder="Judul berita..."
            type="text"
          />
          <input
            className="w-full font-body-sm text-body-sm text-on-surface-variant placeholder:text-on-surface-variant/60 border-0 focus:outline-none bg-transparent"
            placeholder="Ringkasan singkat (muncul di daftar berita)..."
            type="text"
          />

          <div className="rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-space-2xs py-space-2xl text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer transition-all">
            <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
            <p className="font-label-md text-label-md font-bold">Unggah Gambar Unggulan</p>
            <p className="font-label-sm text-label-sm">JPG/PNG, rasio 16:9 direkomendasikan</p>
          </div>

          <div className="rounded-t-xl border border-outline-variant border-b-0 bg-surface-container-low px-space-sm py-space-xs flex flex-wrap items-center gap-space-2xs">
            <select className="px-space-xs py-1 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
              <option>Paragraf</option>
              <option>Judul 1</option>
              <option>Judul 2</option>
              <option>Judul 3</option>
              <option>Kutipan</option>
            </select>
            <div className="w-px h-5 bg-outline-variant mx-space-2xs"></div>
            <button className="editor-tool-btn" title="Tebal" type="button"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
            <button className="editor-tool-btn" title="Miring" type="button"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
            <button className="editor-tool-btn" title="Garis bawah" type="button"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
            <button className="editor-tool-btn" title="Coret" type="button"><span className="material-symbols-outlined text-[18px]">strikethrough_s</span></button>
            <div className="w-px h-5 bg-outline-variant mx-space-2xs"></div>
            <button className="editor-tool-btn" title="Poin" type="button"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
            <button className="editor-tool-btn" title="Bernomor" type="button"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
            <button className="editor-tool-btn" title="Rata kiri" type="button"><span className="material-symbols-outlined text-[18px]">format_align_left</span></button>
            <button className="editor-tool-btn" title="Rata tengah" type="button"><span className="material-symbols-outlined text-[18px]">format_align_center</span></button>
            <div className="w-px h-5 bg-outline-variant mx-space-2xs"></div>
            <button className="editor-tool-btn" title="Tautan" type="button"><span className="material-symbols-outlined text-[18px]">link</span></button>
            <button className="editor-tool-btn" title="Sisipkan gambar" type="button"><span className="material-symbols-outlined text-[18px]">image</span></button>
            <button className="editor-tool-btn" title="Bersihkan format" type="button"><span className="material-symbols-outlined text-[18px]">format_clear</span></button>
          </div>

          <div
            contentEditable
            className="min-h-[360px] rounded-b-xl border border-outline-variant bg-surface-container-lowest px-space-md py-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            data-placeholder="Mulai tulis isi berita di sini..."
          ></div>
        </div>

        <div className="space-y-space-md xl:sticky xl:top-24">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md space-y-space-sm">
            <h3 className="font-label-md text-label-md text-on-surface font-bold">Publikasikan</h3>
            <div className="flex items-center justify-between font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Status</span>
              <select className="px-space-xs py-1 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm">
                <option>Draf</option>
                <option>Dipublikasikan</option>
              </select>
            </div>
            <div className="flex items-center justify-between font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Tanggal</span>
              <input className="px-space-xs py-1 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm" type="date" />
            </div>
            <div className="pt-space-sm flex gap-space-xs">
              <button className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container-low">Simpan Draf</button>
              <button className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container">Publikasikan</button>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md space-y-space-sm">
            <h3 className="font-label-md text-label-md text-on-surface font-bold">Kategori</h3>
            <div className="flex flex-wrap gap-space-2xs">
              <label className="px-space-sm py-1 rounded-full border border-outline-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-container-low">
                <input className="hidden" type="checkbox" /> Prestasi
              </label>
              <label className="px-space-sm py-1 rounded-full border border-outline-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-container-low">
                <input className="hidden" type="checkbox" /> Kegiatan
              </label>
              <label className="px-space-sm py-1 rounded-full border border-outline-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-container-low">
                <input className="hidden" type="checkbox" /> Pengumuman
              </label>
              <label className="px-space-sm py-1 rounded-full border border-outline-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-container-low">
                <input className="hidden" type="checkbox" /> PPDB
              </label>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .editor-tool-btn {
          padding: 6px;
          border-radius: 8px;
          color: #44474e;
        }
        .editor-tool-btn:hover {
          background: #e5eeff;
          color: #00142f;
        }
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #74777f;
        }
      `}</style>
    </div>
  );
}