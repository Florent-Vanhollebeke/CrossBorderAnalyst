'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { History, TrendingUp, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface SimulationEntry {
  id: string;
  type: 'fiscal' | 'rent';
  timestamp: string;
  label: string;
  params: Record<string, unknown>;
}

export function SimulationHistoryList({ locale }: { locale: string }) {
  const t = useTranslations('account.history');
  const [history, setHistory] = useState<SimulationEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('swissrelocator_history');
      const entries: SimulationEntry[] = raw ? JSON.parse(raw) : [];
      setHistory(
        entries
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      );
    } catch {
      // localStorage non disponible ou données corrompues
    }
  }, []);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">{t('empty')}</p>
            <Link
              href={`/${locale}/simulator`}
              className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline"
            >
              {t('empty_cta')} →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                    entry.type === 'fiscal' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                >
                  {entry.type === 'fiscal' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <Home className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{entry.label}</p>
                  <p className="text-xs text-gray-400">
                    {entry.type === 'fiscal' ? t('type_fiscal') : t('type_rent')}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
