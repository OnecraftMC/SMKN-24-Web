import KabarBanner from '@/components/kabar/KabarBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import GaleriVisual from '@/components/kabar/GaleriVisual';
import FormAspirasi from '@/components/kabar/FormAspirasi';
import { Reveal } from '@/components/ui/Reveal';

export default function KabarPage() {
  return (
    <>
      <Reveal>
        <KabarBanner />
      </Reveal>
      <Reveal>
        <FeaturedNews />
      </Reveal>
      <Reveal>
        <GaleriVisual />
      </Reveal>
      <Reveal>
        <FormAspirasi />
      </Reveal>
    </>
  );
}