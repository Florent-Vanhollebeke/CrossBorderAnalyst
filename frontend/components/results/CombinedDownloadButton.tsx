'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { api } from '@/lib/api';
import type { CompareFiscalResponse, PredictRentResponse, SupportedCity } from '@/lib/api';
import type { RentFormData } from '@/lib/schemas';

// Coordonnées par défaut pour chaque ville (même valeurs que SwissCantonMap)
const CITY_COORDS: Record<SupportedCity, { lat: number; lng: number }> = {
  Geneve:   { lat: 46.2044, lng: 6.1432 },
  Lausanne: { lat: 46.5197, lng: 6.6323 },
  Zurich:   { lat: 47.3769, lng: 8.5417 },
  Basel:    { lat: 47.5596, lng: 7.5886 },
};

const SWISS_CITIES: SupportedCity[] = ['Geneve', 'Lausanne', 'Zurich', 'Basel'];

interface CombinedDownloadButtonProps {
  fiscalResults: CompareFiscalResponse[];
  rentResult: PredictRentResponse;
  rentParams: RentFormData | null;
}

export function CombinedDownloadButton({ fiscalResults, rentResult, rentParams }: CombinedDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      // Récupérer le loyer réel pour chaque ville suisse avec les mêmes paramètres
      const cityRents: Record<string, number> = {};
      if (rentParams) {
        await Promise.all(
          SWISS_CITIES.map(async (city) => {
            try {
              const coords = CITY_COORDS[city];
              const result = await api.predictRent({
                ...rentParams,
                city,
                latitude: coords.lat,
                longitude: coords.lng,
              });
              cityRents[city] = result.predicted_rent_chf;
            } catch {
              // Fallback : loyer de la ville simulée
              cityRents[city] = rentResult.predicted_rent_chf;
            }
          })
        );
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/v1/generate-pdf/combined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscal: fiscalResults, rent: rentResult, city_rents: cityRents }),
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
        {loading ? 'Calcul loyers…' : 'Télécharger l\'analyse complète'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
