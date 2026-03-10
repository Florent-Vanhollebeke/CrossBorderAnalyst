'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <Globe className="h-4 w-4" />
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
