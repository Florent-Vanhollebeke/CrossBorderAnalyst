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
  const title = locale === 'fr'
    ? 'CrossBorder Analyst — Analyse d\'implantation France-Suisse'
    : locale === 'de'
    ? 'CrossBorder Analyst — Frankreich-Schweiz Standortanalyse'
    : 'CrossBorder Analyst — France-Switzerland Implantation Analysis';

  const description = locale === 'fr'
    ? 'Comparaison fiscale professionnelle, prédiction de loyer ML et conseil réglementaire pour les décisions d\'implantation cross-border France-Suisse.'
    : locale === 'de'
    ? 'Professioneller Steuervergleich, ML-Mietprognose und regulatorische Beratung für grenzüberschreitende Ansiedlungsentscheidungen Frankreich–Schweiz.'
    : 'Professional cross-border fiscal comparison, ML rent prediction, and regulatory advisory for France-Switzerland implantation decisions.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CrossBorder Analyst',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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
