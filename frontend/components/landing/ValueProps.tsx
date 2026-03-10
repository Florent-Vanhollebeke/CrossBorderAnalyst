'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Calculator, Brain, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const props = [
  { key: 'fiscal', icon: Calculator, color: 'text-blue-600 bg-blue-100' },
  { key: 'rent', icon: Brain, color: 'text-emerald-600 bg-emerald-100' },
  { key: 'privacy', icon: ShieldCheck, color: 'text-violet-600 bg-violet-100' },
] as const;

export function ValueProps() {
  const t = useTranslations('value_props');

  return (
    <section className="py-20">
      <div className="container-app">
        <h2 className="text-center text-3xl font-bold text-gray-900">{t('title')}</h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {props.map((prop, i) => (
            <motion.div
              key={prop.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className={`inline-flex rounded-lg p-3 ${prop.color}`}>
                    <prop.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {t(`${prop.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {t(`${prop.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
