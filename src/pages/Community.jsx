import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';

export default function Community() {
  const { t } = useLanguage();

  return (
    <main className="hero-section" style={{ marginTop: '80px', paddingBottom: '40px' }}>
      <h1 className="hero-title animate-slide-up" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
        {t('community.title').split(' ')[0]} <span className="highlight">{t('community.title').split(' ').slice(1).join(' ')}</span>
      </h1>
      <p className="hero-subtitle animate-slide-up delay-100">
        {t('community.subtitle')}
      </p>
      
      <div className="hero-actions animate-slide-up delay-200">
        <a
          className={cn(buttonVariants({ size: 'lg' }), 'hero-cta')}
          href="https://t.me/kryptoncodes"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('community.join')}
          <ArrowUpRight data-icon="inline-end" weight="bold" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
