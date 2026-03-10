'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { fiscalSchema, type FiscalFormData } from '@/lib/schemas';
import { api, type CompareFiscalResponse, type ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FISCAL_CITIES = ['Lyon', 'Geneve', 'Lausanne', 'Zurich', 'Basel'] as const;

interface FiscalFormProps {
  onResult: (results: CompareFiscalResponse[]) => void;
}

export function FiscalForm({ onResult }: FiscalFormProps) {
  const t = useTranslations('simulator.fiscal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FiscalFormData>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      revenue_annual: 500000,
      salary_director: 80000,
      num_employees: 5,
      average_employee_salary: 0,
      city: 'Geneve',
    },
  });

  const onSubmit = async (data: FiscalFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Compare selected city + Lyon (for FR vs CH comparison)
      const requests = data.city === 'Lyon'
        ? FISCAL_CITIES.filter(c => c !== 'Lyon').map(city =>
            api.compareFiscal({ ...data, city })
          )
        : [
            api.compareFiscal({ ...data, city: 'Lyon' }),
            api.compareFiscal(data),
          ];

      const results = await Promise.all(requests);
      onResult(results);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Erreur lors du calcul fiscal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            id="revenue_annual"
            label={t('revenue')}
            type="number"
            error={errors.revenue_annual?.message}
            {...register('revenue_annual', { valueAsNumber: true })}
          />

          <Input
            id="salary_director"
            label={t('salary_director')}
            type="number"
            error={errors.salary_director?.message}
            {...register('salary_director', { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="num_employees"
              label={t('num_employees')}
              type="number"
              error={errors.num_employees?.message}
              {...register('num_employees', { valueAsNumber: true })}
            />
            <Input
              id="average_employee_salary"
              label={t('avg_salary')}
              type="number"
              placeholder="0 = salaire dirigeant"
              error={errors.average_employee_salary?.message}
              {...register('average_employee_salary', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              {t('city')}
            </label>
            <select
              id="city"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('city')}
            >
              {FISCAL_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
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
