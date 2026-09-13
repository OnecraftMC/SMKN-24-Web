export default function FormAspirasi() {
  return (
    <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-2xl mx-auto bg-surface-container-lowest p-space-xl rounded-3xl border border-surface-container shadow-md space-y-4 text-center">
        <span className="inline-block p-3 rounded-2xl bg-secondary-container/20 text-secondary">
          <span className="material-symbols-outlined text-[32px]">edit_note</span>
        </span>
        <h3 className="font-headline-md font-bold text-primary">Kirimkan Karya &amp; Prestasi Ananda</h3>
        <p className="text-body-sm text-on-surface-variant">
          Punya artikel opini, liputan kejuaraan mandiri, atau hasil karya saintifik siswa? Publikasikan karya terbaik Anda di buletin &amp; portal resmi SMKN 24 Jakarta.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <a href="mailto:humassmkn24jakarta@gmail.com?subject=Kirim%20Karya%20%2F%20Prestasi%20Siswa" className="px-space-lg py-2.5 rounded-xl bg-primary text-surface font-label-md font-bold hover:bg-primary-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span> Kirim Karya Tulisan / Foto
          </a>
        </div>
      </div>
    </div>
  );
}
