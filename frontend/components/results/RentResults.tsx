'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Home, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PredictRentResponse } from '@/lib/api';
import { formatCHF, formatEUR } from '@/lib/api';

interface RentResultsProps {
  result: PredictRentResponse;
  onBack: () => void;
}

export function RentResults({ result, onBack }: RentResultsProps) {
  const t = useTranslations('results');

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('rent.title')}</h1>
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>
      </div>

      {/* Main KPI */}
      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="pt-6 text-center">
          <Home className="mx-auto h-8 w-8 text-brand-600" />
          <p className="mt-2 text-sm text-gray-600">{t('rent.predicted_rent')}</p>
          <p className="mt-1 text-4xl font-bold text-brand-800">
            {formatCHF(result.predicted_rent_chf)}
            <span className="text-lg font-normal text-gray-500"> /mois</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            ~ {formatEUR(result.predicted_rent_eur)}
          </p>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-gray-500">{t('rent.price_per_m2')}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCHF(result.price_per_m2_chf)}/m2
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {result.city} &middot; {result.surface} m2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-gray-500">{t('rent.confidence')}</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCHF(result.confidence_range.min_chf)} &ndash; {formatCHF(result.confidence_range.max_chf)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              MAE: &plusmn;{formatCHF(result.confidence_range.mae_chf)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('rent.model_info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Modele</dt>
              <dd className="font-medium text-gray-900">{result.model_info.model_type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">R2 score</dt>
              <dd className="font-medium text-gray-900">{(result.model_info.r2_score * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-gray-500">Donnees</dt>
              <dd className="font-medium text-gray-900">{result.model_info.training_data}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Mise a jour</dt>
              <dd className="font-medium text-gray-900">{result.model_info.last_updated}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
