import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container-app py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-brand-900">SwissRelocator</span>
          </div>
          <p className="text-sm text-gray-500">{t('description')}</p>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Florent Vanhollebeke. {t('legal')}
          </p>
        </div>
      </div>
    </footer>
  );
}
