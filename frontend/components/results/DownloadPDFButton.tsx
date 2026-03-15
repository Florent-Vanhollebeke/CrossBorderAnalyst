'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CompareFiscalResponse } from '@/lib/api';

interface DownloadPDFButtonProps {
  results: CompareFiscalResponse[];
}

export function DownloadPDFButton({ results }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/v1/generate-pdf/fiscal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });

      if (!resp.ok) {
        throw new Error(`Erreur serveur : ${resp.status}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crossborderanalyst_rapport_fiscal.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Impossible de générer le PDF. Réessayez.');
      console.error('PDF download error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        onClick={handleDownload}
        disabled={loading || results.length === 0}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {loading ? 'Génération…' : 'Télécharger le rapport PDF'}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
