'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, Building2 } from 'lucide-react';
import { FiscalForm } from './FiscalForm';
import { RentForm } from './RentForm';
import { FiscalResults } from '@/components/results/FiscalResults';
import { RentResults } from '@/components/results/RentResults';
import type { CompareFiscalResponse, PredictRentResponse } from '@/lib/api';

type Tab = 'fiscal' | 'rent';

export function SimulationWizard() {
  const t = useTranslations('simulator');
  const [activeTab, setActiveTab] = useState<Tab>('fiscal');
  const [fiscalResult, setFiscalResult] = useState<CompareFiscalResponse[] | null>(null);
  const [rentResult, setRentResult] = useState<PredictRentResponse | null>(null);

  const tabs = [
    { key: 'fiscal' as Tab, label: t('tab_fiscal'), icon: Calculator },
    { key: 'rent' as Tab, label: t('tab_rent'), icon: Building2 },
  ];

  const handleReset = () => {
    setFiscalResult(null);
    setRentResult(null);
  };

  // Show results if available
  if (activeTab === 'fiscal' && fiscalResult) {
    return <FiscalResults results={fiscalResult} onBack={handleReset} />;
  }
  if (activeTab === 'rent' && rentResult) {
    return <RentResults result={rentResult} onBack={handleReset} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>

      {/* Tabs */}
      <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); handleReset(); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="mt-8">
        {activeTab === 'fiscal' ? (
          <FiscalForm onResult={setFiscalResult} />
        ) : (
          <RentForm onResult={setRentResult} />
        )}
      </div>
    </div>
  );
}
