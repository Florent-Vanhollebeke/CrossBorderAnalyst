import { unstable_setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default function ResultsPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  redirect(`/${locale}/simulator`);
}
