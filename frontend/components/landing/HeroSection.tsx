'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const t = useTranslations('hero');
  const { locale } = useParams();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-24 sm:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-app relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-800/50 px-4 py-1.5 text-sm text-brand-200">
            <BarChart3 className="h-4 w-4" />
            France vs Suisse
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="block leading-tight">{t('title_main')}</span>
            <span className="block bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              {t('title_accent')}
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-brand-200/80">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/simulator`}>
              <Button size="lg" className="gap-2 bg-white text-brand-900 hover:bg-brand-50">
                {t('cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#cities">
              <Button variant="ghost" size="lg" className="text-brand-200 hover:bg-brand-800 hover:text-white">
                {t('secondary_cta')}
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8 text-center"
        >
          {[
            { value: '4', label: locale === 'fr' ? 'Cantons suisses' : 'Swiss cantons' },
            { value: '1 200+', label: locale === 'fr' ? 'Annonces immobilières' : 'Property listings' },
            { value: '76%', label: locale === 'fr' ? 'Precision ML' : 'ML accuracy' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-brand-300">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
