'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, Building2 } from 'lucide-react';
import { FiscalForm } from './FiscalForm';
import { RentForm } from './RentForm';
import { FiscalResults } from '@/components/results/FiscalResults';
import { RentResults } from '@/components/results/RentResults';
import { CombinedDownloadButton } from '@/components/results/CombinedDownloadButton';
import type { CompareFiscalResponse, PredictRentResponse } from '@/lib/api';
import type { RentFormData } from '@/lib/schemas';

type Tab = 'fiscal' | 'rent';
type View = 'form' | 'results';

export function SimulationWizard() {
  const t = useTranslations('simulator');
  const [activeTab, setActiveTab] = useState<Tab>('fiscal');
  const [fiscalView, setFiscalView] = useState<View>('form');
  const [rentView, setRentView] = useState<View>('form');
  const [fiscalResult, setFiscalResult] = useState<CompareFiscalResponse[] | null>(null);
  const [rentResult, setRentResult] = useState<PredictRentResponse | null>(null);
  const [rentParams, setRentParams] = useState<RentFormData | null>(null);

  const tabs = [
    { key: 'fiscal' as Tab, label: t('tab_fiscal'), icon: Calculator, done: !!fiscalResult },
    { key: 'rent' as Tab, label: t('tab_rent'), icon: Building2, done: !!rentResult },
  ];

  const handleFiscalResult = (results: CompareFiscalResponse[]) => {
    setFiscalResult(results);
    setFiscalView('results');
  };

  const handleRentResult = (result: PredictRentResponse, params: RentFormData) => {
    setRentResult(result);
    setRentParams(params);
    setRentView('results');
  };

  const bothDone = !!fiscalResult && !!rentResult;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>

      {bothDone && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <div>
            <p className="font-semibold text-emerald-800">{t('combined_ready')}</p>
            <p className="text-sm text-emerald-600">{t('combined_ready_sub')}</p>
          </div>
          <CombinedDownloadButton fiscalResults={fiscalResult} rentResult={rentResult} rentParams={rentParams} />
        </div>
      )}

      <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.done && (
              <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'fiscal' ? (
          fiscalView === 'results' && fiscalResult ? (
            <FiscalResults results={fiscalResult} onBack={() => setFiscalView('form')} />
          ) : (
            <FiscalForm onResult={handleFiscalResult} />
          )
        ) : (
          rentView === 'results' && rentResult ? (
            <RentResults result={rentResult} onBack={() => setRentView('form')} />
          ) : (
            <RentForm onResult={handleRentResult} />
          )
        )}
      </div>
    </div>
  );
}
