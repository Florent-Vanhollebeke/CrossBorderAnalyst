import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

const locales = ['fr', 'en', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return {
    title: locale === 'fr'
      ? 'SwissRelocator - Comparaison fiscale France-Suisse'
      : locale === 'de'
      ? 'SwissRelocator - Steuervergleich Frankreich-Schweiz'
      : 'SwissRelocator - France-Switzerland Tax Comparison',
    description: locale === 'fr'
      ? 'Simulez votre implantation en Suisse : fiscalite, loyers, charges sociales.'
      : locale === 'de'
      ? 'Simulieren Sie Ihre Niederlassung in der Schweiz: Steuern, Mieten, Sozialabgaben.'
      : 'Simulate your relocation to Switzerland: taxation, rents, social charges.',
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
