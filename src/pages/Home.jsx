import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ActionLink from '../components/ActionLink';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="hero-section">
      <div className="hero-copy">
        <p className="hero-eyebrow animate-slide-up">{t('home.eyebrow')}</p>
        <h1 className="hero-title animate-slide-up">
          {t('home.title1')}<span className="highlight">{t('home.titleHighlight')}</span>{t('home.title2')}<br />
          {t('home.title3')}
        </h1>

        <p className="hero-subtitle animate-slide-up delay-100">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="hero-actions animate-slide-up delay-200">
        <ActionLink to="/products">{t('home.ctaPrimary')}</ActionLink>
        <ActionLink variant="secondary" href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
          {t('home.ctaSecondary')}
        </ActionLink>
      </div>

      <p className="hero-note animate-slide-up delay-300">
        {t('home.note')}
      </p>
    </main>
  );
}
