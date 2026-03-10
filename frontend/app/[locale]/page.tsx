import { unstable_setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { ValueProps } from '@/components/landing/ValueProps';
import { CityCards } from '@/components/landing/CityCards';

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <ValueProps />
      <CityCards />
    </>
  );
}
