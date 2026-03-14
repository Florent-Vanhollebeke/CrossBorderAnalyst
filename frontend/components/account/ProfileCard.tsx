'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileCardProps {
  email: string;
  createdAt: string;
  locale: string;
}

export function ProfileCard({ email, createdAt, locale }: ProfileCardProps) {
  const t = useTranslations('account.profile');
  const initials = email.split('@')[0].slice(0, 2).toUpperCase();
  const memberSince = new Date(createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{email}</p>
          <p className="mt-1 text-sm text-gray-500">
            {t('member_since')} {memberSince}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
