'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { CompareFiscalResponse, PredictRentResponse } from '@/lib/api';

interface CombinedDownloadButtonProps {
  fiscalResults: CompareFiscalResponse[];
  rentResult: PredictRentResponse;
}

export function CombinedDownloadButton({ fiscalResults, rentResult }: CombinedDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/v1/generate-pdf/combined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscal: fiscalResults, rent: rentResult }),
      });
      if (!resp.ok) throw new Error(`${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'swissrelocator_analyse_complete.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de générer le PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        <FileDown className="h-4 w-4" />
        {loading ? 'Génération…' : 'Télécharger l\'analyse complète'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
