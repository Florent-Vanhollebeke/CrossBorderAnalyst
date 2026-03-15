'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalChart } from './FiscalChart';
import { DownloadPDFButton } from './DownloadPDFButton';
import type { CompareFiscalResponse } from '@/lib/api';
import { formatCHF, formatEUR } from '@/lib/api';

interface FiscalResultsProps {
  results: CompareFiscalResponse[];
  onBack: () => void;
}

function formatAmount(amount: number, currency: string): string {
  return currency === 'CHF' ? formatCHF(amount) : formatEUR(amount);
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function FiscalResults({ results, onBack }: FiscalResultsProps) {
  const t = useTranslations('results');

  const lyon = results.find(r => r.country === 'FR');
  const swiss = results.filter(r => r.country === 'CH');
  const bestSwiss = swiss.reduce((a, b) => a.net_result > b.net_result ? a : b, swiss[0]);

  const savings = bestSwiss && lyon
    ? bestSwiss.net_result * (bestSwiss.currency === 'CHF' ? 1.064 : 1) - lyon.net_result
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('fiscal.title')}</h1>
        <div className="flex items-center gap-3">
          <DownloadPDFButton results={results} />
          <Button variant="secondary" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {lyon && bestSwiss && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-500">{t('fiscal.net_result')} Lyon</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatAmount(lyon.net_result, lyon.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-500">{t('fiscal.net_result')} {bestSwiss.city}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatAmount(bestSwiss.net_result, bestSwiss.currency)}
              </p>
            </CardContent>
          </Card>
          <Card className={savings > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-500">
                {savings > 0 ? t('fiscal.savings') : t('fiscal.extra_cost')}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                {savings > 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <p className={`text-2xl font-bold ${savings > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatEUR(Math.abs(savings))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fiscal.title')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-max w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500" />
                {results.map((r) => (
                  <th key={r.city} className="px-3 sm:px-6 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                    {r.city} ({r.currency})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 sm:px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{t('fiscal.corporate_tax')}</td>
                {results.map((r) => (
                  <td key={r.city} className="px-3 sm:px-6 py-3 text-right">
                    <span className="text-gray-500">{pct(r.corporate_tax_rate)}</span>
                    <br />
                    <span className="font-medium">{formatAmount(r.corporate_tax_amount, r.currency)}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 sm:px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{t('fiscal.employer_charges')}</td>
                {results.map((r) => (
                  <td key={r.city} className="px-3 sm:px-6 py-3 text-right">
                    <span className="text-gray-500">{pct(r.employer_social_charges_rate)}</span>
                    <br />
                    <span className="font-medium">{formatAmount(r.employer_social_charges_amount, r.currency)}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 sm:px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{t('fiscal.total_employer_cost')}</td>
                {results.map((r) => (
                  <td key={r.city} className="px-3 sm:px-6 py-3 text-right font-medium">
                    {formatAmount(r.total_employer_cost, r.currency)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 sm:px-6 py-3 text-gray-900 whitespace-nowrap">{t('fiscal.net_result')}</td>
                {results.map((r) => (
                  <td key={r.city} className={`px-3 sm:px-6 py-3 text-right ${r.net_result >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatAmount(r.net_result, r.currency)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Chart */}
      <FiscalChart results={results} />
    </div>
  );
}
