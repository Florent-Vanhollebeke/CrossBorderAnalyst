'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { rentSchema, type RentFormData } from '@/lib/schemas';
import { api, type PredictRentResponse, type ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const RENT_CITIES = ['Geneve', 'Lausanne', 'Zurich', 'Basel'] as const;

interface RentFormProps {
  onResult: (result: PredictRentResponse) => void;
}

export function RentForm({ onResult }: RentFormProps) {
  const t = useTranslations('simulator.rent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RentFormData>({
    resolver: zodResolver(rentSchema),
    defaultValues: {
      city: 'Geneve',
      surface: 150,
      property_type: 'bureau',
      has_parking: false,
      has_lift: true,
    },
  });

  const onSubmit = async (data: RentFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.predictRent(data);
      onResult(result);
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
          <div className="space-y-1">
            <label htmlFor="rent-city" className="block text-sm font-medium text-gray-700">
              {t('city')}
            </label>
            <select
              id="rent-city"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('city')}
            >
              {RENT_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
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
