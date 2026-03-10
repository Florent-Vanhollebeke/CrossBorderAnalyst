'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompareFiscalResponse } from '@/lib/api';

interface FiscalChartProps {
  results: CompareFiscalResponse[];
}

export function FiscalChart({ results }: FiscalChartProps) {
  const data = results.map((r) => ({
    name: `${r.city} (${r.currency})`,
    'IS': Math.round(r.corporate_tax_amount),
    'Charges patronales': Math.round(r.employer_social_charges_amount),
    'Resultat net': Math.round(r.net_result),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison visuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => new Intl.NumberFormat('fr-CH').format(value)}
            />
            <Legend />
            <Bar dataKey="IS" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Charges patronales" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Resultat net" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
