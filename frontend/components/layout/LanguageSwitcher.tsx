'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const LOCALES = ['fr', 'en', 'de'] as const;
  const LABELS: Record<string, string> = { fr: 'FR', en: 'EN', de: 'DE' };

  const switchLocale = () => {
    const idx = LOCALES.indexOf(locale as typeof LOCALES[number]);
    const newLocale = LOCALES[(idx + 1) % LOCALES.length];
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <Globe className="h-4 w-4" />
      {LABELS[locale as string] ?? 'FR'}
    </button>
  );
}
