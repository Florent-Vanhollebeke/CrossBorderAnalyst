import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { RagChat } from '@/components/rag/RagChat';

interface Props {
  params: { locale: string };
}

export default async function AdvisorPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'advisor' });

  return (
    <main className="container-app py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-500">{t('subtitle')}</p>
      </div>
      <RagChat />
    </main>
  );
}
