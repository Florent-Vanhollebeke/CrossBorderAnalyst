'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PlayCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogoutButton } from './LogoutButton';

export function QuickActions({ locale }: { locale: string }) {
  const t = useTranslations('account.quick_actions');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link
          href={`/${locale}/simulator`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <PlayCircle className="h-4 w-4" />
          {t('go_to_simulator')}
        </Link>
        <LogoutButton locale={locale} />
      </CardContent>
    </Card>
  );
}
