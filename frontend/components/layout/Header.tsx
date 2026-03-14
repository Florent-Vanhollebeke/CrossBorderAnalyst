'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Building2, LayoutDashboard, MessageSquare } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AuthButton } from './AuthButton';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const t = useTranslations('nav');
  const { locale } = useParams();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Building2 className="h-7 w-7 text-brand-600" />
          <span className="text-lg font-bold text-brand-900">SwissRelocator</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
          >
            {t('home')}
          </Link>
          <Link
            href={`/${locale}/simulator`}
            className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
          >
            {t('simulator')}
          </Link>
          <Link
            href={`/${locale}/advisor`}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            {t('advisor')}
          </Link>
          {user && (
            <Link
              href={`/${locale}/account`}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('account')}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
