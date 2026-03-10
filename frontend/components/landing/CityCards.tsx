'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const cities = [
  {
    key: 'geneve',
    canton: 'GE',
    taxRate: '~14%',
    specialty: { fr: 'Finance, commodites', en: 'Finance, commodities' },
  },
  {
    key: 'lausanne',
    canton: 'VD',
    taxRate: '~14%',
    specialty: { fr: 'Tech, pharma, EPFL', en: 'Tech, pharma, EPFL' },
  },
  {
    key: 'zurich',
    canton: 'ZH',
    taxRate: '~12%',
    specialty: { fr: 'Finance, tech, assurance', en: 'Finance, tech, insurance' },
  },
  {
    key: 'basel',
    canton: 'BS',
    taxRate: '~13%',
    specialty: { fr: 'Pharma, chimie, logistique', en: 'Pharma, chemistry, logistics' },
  },
];

export function CityCards() {
  const t = useTranslations('cities');
  const { locale } = useParams();
  const lang = (locale as string) === 'en' ? 'en' : 'fr';

  return (
    <section id="cities" className="bg-gray-50 py-20">
      <div className="container-app">
        <h2 className="text-center text-3xl font-bold text-gray-900">{t('title')}</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((city, i) => (
            <motion.div
              key={city.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link href={`/${locale}/simulator?city=${city.key === 'geneve' ? 'Geneve' : city.key === 'zurich' ? 'Zurich' : city.key === 'basel' ? 'Basel' : 'Lausanne'}`}>
                <Card className="group h-full cursor-pointer transition-all hover:shadow-md hover:border-brand-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-brand-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t(city.key)}
                        </h3>
                      </div>
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {city.canton}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">IS</span>
                        <span className="font-medium text-gray-900">{city.taxRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{lang === 'fr' ? 'Secteurs' : 'Sectors'}</span>
                        <span className="text-gray-700">{city.specialty[lang]}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                      {lang === 'fr' ? 'Simuler' : 'Simulate'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
