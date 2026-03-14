'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { rentSchema, type RentFormData } from '@/lib/schemas';
import { api, type PredictRentResponse, type ApiError, type SupportedCity } from '@/lib/api';
import { saveSimulation } from '@/lib/simulations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SwissCantonMap } from './SwissCantonMap';

interface RentFormProps {
  onResult: (result: PredictRentResponse, params: RentFormData) => void;
}

export function RentForm({ onResult }: RentFormProps) {
  const t = useTranslations('simulator.rent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RentFormData>({
    resolver: zodResolver(rentSchema),
    defaultValues: {
      city: 'Geneve',
      latitude: 46.2044,
      longitude: 6.1432,
      surface: 150,
      property_type: 'bureau',
      has_parking: false,
      has_lift: true,
    },
  });

  const selectedCity = watch('city');

  const handleCantonSelect = ({ city, lat, lng }: { city: SupportedCity; lat: number; lng: number }) => {
    setValue('city', city, { shouldValidate: true });
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: RentFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.predictRent(data);
      onResult(result, data);
      // Historique Supabase (avec fallback localStorage)
      try {
        await saveSimulation({
          type: 'rent',
          label: `${data.city} — ${data.surface} m² — ${result.predicted_rent_chf.toLocaleString()} CHF/mois`,
          params: data as Record<string, unknown>,
        });
      } catch { /* historique non critique */ }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Erreur lors de la prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Canton map selector */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('city')}
            </label>
            <SwissCantonMap
              selected={selectedCity}
              onSelect={handleCantonSelect}
            />
            {errors.city && (
              <p className="text-xs text-red-600">{errors.city.message}</p>
            )}
          </div>

          <Input
            id="surface"
            label={t('surface')}
            type="number"
            error={errors.surface?.message}
            {...register('surface', { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="pieces"
              label={t('pieces')}
              type="number"
              error={errors.pieces?.message}
              {...register('pieces', { valueAsNumber: true })}
            />
            <Input
              id="etage"
              label={t('etage')}
              type="number"
              error={errors.etage?.message}
              {...register('etage', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
              {t('property_type')}
            </label>
            <select
              id="property_type"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('property_type')}
            >
              <option value="bureau">{t('bureau')}</option>
              <option value="commercial">{t('commercial')}</option>
            </select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                {...register('has_parking')}
              />
              {t('parking')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                {...register('has_lift')}
              />
              {t('lift')}
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
