'use client';

import { useTranslations } from 'next-intl';
import { ProfileCard } from './ProfileCard';
import { StatsCard } from './StatsCard';
import { QuickActions } from './QuickActions';
import { SimulationHistoryList } from './SimulationHistoryList';

interface DashboardShellProps {
  email: string;
  createdAt: string;
  locale: string;
}

export function DashboardShell({ email, createdAt, locale }: DashboardShellProps) {
  const t = useTranslations('account');

  return (
    <div className="container-app py-12">
      <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ProfileCard email={email} createdAt={createdAt} locale={locale} />
        <StatsCard />
        <QuickActions locale={locale} />
        <SimulationHistoryList locale={locale} />
      </div>
    </div>
  );
}
