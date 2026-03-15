'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, Home, TrendingUp, Info, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PredictRentResponse } from '@/lib/api';
import { formatCHF, formatEUR } from '@/lib/api';
import { localizeCity } from '@/lib/cities';

interface RentResultsProps {
  result: PredictRentResponse;
  onBack: () => void;
}

export function RentResults({ result, onBack }: RentResultsProps) {
  const t = useTranslations('results');
  const { locale } = useParams<{ locale: string }>();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/v1/generate-pdf/rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!resp.ok) throw new Error(`${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crossborderanalyst_rapport_loyer.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError('Impossible de générer le PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('rent.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {pdfLoading ? 'Génération…' : 'Télécharger PDF'}
            </button>
            {pdfError && <p className="text-xs text-red-500">{pdfError}</p>}
          </div>
          <Button variant="secondary" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </div>
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
              {localizeCity(result.city, locale)} &middot; {result.surface} m²
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
            {/* Barre visuelle min → prédiction → max */}
            {(() => {
              const range = result.confidence_range.max_chf - result.confidence_range.min_chf;
              const pct = range > 0
                ? ((result.predicted_rent_chf - result.confidence_range.min_chf) / range) * 100
                : 50;
              return (
                <div className="mt-3">
                  <div className="relative h-2 rounded-full bg-gray-200">
                    <div
                      className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600"
                      style={{ left: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{formatCHF(result.confidence_range.min_chf)}</span>
                    <span>{formatCHF(result.confidence_range.max_chf)}</span>
                  </div>
                </div>
              );
            })()}
            <p className="mt-2 text-sm text-gray-500">
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
              <dt className="text-gray-500">{t('rent.model_type')}</dt>
              <dd className="font-medium text-gray-900">{result.model_info.model_type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('rent.r2_score')}</dt>
              <dd className="font-medium text-gray-900">{(result.model_info.r2_score * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('rent.training_data')}</dt>
              <dd className="font-medium text-gray-900">{result.model_info.training_data}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('rent.last_updated')}</dt>
              <dd className="font-medium text-gray-900">{result.model_info.last_updated}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
