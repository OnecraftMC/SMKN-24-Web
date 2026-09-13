export default function ProfilHeader() {
  return (
    <div className="bg-primary text-on-primary py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative overflow-hidden">
      <div className="max-w-container-max mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 text-secondary-container font-label-sm font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Identitas &amp; Visi Masa Depan</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg lg:text-[2.75rem] font-bold text-surface tracking-tight">Profil Lengkap SMKN 24 Jakarta</h1>
        <p className="font-body-lg text-primary-fixed max-w-3xl">
          Lembaga pendidikan terakreditasi A Unggul berdedikasi melahirkan insan cendekia yang kokoh dalam iman, terampil dalam teknologi, dan berkontribusi nyata bagi peradaban.
        </p>
      </div>
    </div>
  );
}
