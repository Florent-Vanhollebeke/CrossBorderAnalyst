'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { SimulationEntry } from './SimulationHistoryList';

export function StatsCard() {
  const t = useTranslations('account.stats');
  const [count, setCount] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('crossborderanalyst_history');
      const history: SimulationEntry[] = raw ? JSON.parse(raw) : [];
      setCount(history.length);
      if (history.length > 0) {
        const latest = history.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        setLastDate(new Date(latest.timestamp).toLocaleDateString());
      }
    } catch {
      // localStorage non disponible ou données corrompues
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-emerald-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">{t('total_simulations')}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{count}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t('last_activity')}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {lastDate ?? t('never')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
