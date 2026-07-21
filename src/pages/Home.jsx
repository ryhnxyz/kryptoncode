import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="hero-section">
      <div className="hero-copy">
        <p className="hero-eyebrow animate-slide-up">{t('common.studio')}</p>
        <h1 className="hero-title animate-slide-up">
          {t('home.title1')}<span className="highlight">{t('home.titleHighlight')}</span>{t('home.title2')}<br />
          {t('home.title3')}
        </h1>

        <p className="hero-subtitle animate-slide-up delay-100">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="hero-actions animate-slide-up delay-200">
        <Link className={cn(buttonVariants({ size: 'lg' }), 'hero-cta')} to="/products">
          <span>{t('home.ctaPrimary')}</span>
          <ArrowUpRight data-icon="inline-end" className="button-arrow" weight="bold" aria-hidden="true" />
        </Link>
        <a className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'hero-cta')} href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
          <span>{t('home.ctaSecondary')}</span>
          <ArrowUpRight data-icon="inline-end" className="button-arrow" weight="bold" aria-hidden="true" />
        </a>
      </div>

      <p className="hero-note animate-slide-up delay-300">
        {t('home.note')}
      </p>
    </main>
  );
}
