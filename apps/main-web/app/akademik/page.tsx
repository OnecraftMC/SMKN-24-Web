import AkademikBanner from '@/components/akademik/AkademikBanner';
import JadwalMatriks from '@/components/akademik/JadwalMatriks';
import KalenderUnduhan from '@/components/akademik/KalenderUnduhan';
import FormBK from '@/components/akademik/FormBK';
import { Reveal } from '@/components/ui/Reveal';
import { backendAktif, getJadwal } from '@/lib/api';
import { JADWAL_KOSONG, jadwalContoh } from '@/lib/fallback';

export default async function AkademikPage() {
  const jadwalRes = await getJadwal();
  const jadwal = jadwalRes.data ?? (!backendAktif() ? jadwalContoh() : JADWAL_KOSONG);

  return (
    <>
      <Reveal>
        <AkademikBanner />
      </Reveal>
      <Reveal>
        <JadwalMatriks jadwal={jadwal} error={jadwalRes.error} />
      </Reveal>
      <Reveal>
        <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
            <KalenderUnduhan />
            <div className="lg:col-span-5">
              <FormBK />
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}