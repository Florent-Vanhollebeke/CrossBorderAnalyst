import { unstable_setRequestLocale } from 'next-intl/server';
import { RagChat } from '@/components/rag/RagChat';

interface Props {
  params: { locale: string };
}

export default function AdvisorPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  return (
    <main className="container-app py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Conseiller fiscal IA</h1>
        <p className="mt-1 text-gray-500">
          Posez vos questions sur la fiscalité et l&apos;immobilier France / Suisse.
          Les réponses sont basées sur des données officielles actualisées.
        </p>
      </div>
      <RagChat />
    </main>
  );
}
