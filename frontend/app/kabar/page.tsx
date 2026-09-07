import KabarBanner from '@/components/kabar/KabarBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import GaleriVisual from '@/components/kabar/GaleriVisual';
import FormAspirasi from '@/components/kabar/FormAspirasi';

export default function KabarPage() {
  return (
    <>
      <KabarBanner />
      <FeaturedNews />
      <GaleriVisual />
      <FormAspirasi />
    </>
  );
}