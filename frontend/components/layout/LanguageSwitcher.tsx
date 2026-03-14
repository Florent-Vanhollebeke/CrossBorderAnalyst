'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

const LOCALES = ['fr', 'en', 'de'] as const;
const LABELS: Record<string, string> = { fr: 'FR', en: 'EN', de: 'DE' };

export function LanguageSwitcher() {
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Globe className="h-4 w-4 text-gray-400 mr-1" />
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
            locale === l
              ? 'bg-emerald-500 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          aria-current={locale === l ? 'true' : undefined}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
