import { unstable_setRequestLocale } from 'next-intl/server';
import { SimulationWizard } from '@/components/simulator/SimulationWizard';

export default function SimulatorPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);

  return (
    <section className="container-app py-12">
      <SimulationWizard />
    </section>
  );
}
