import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';

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
      
      <div className="animate-slide-up delay-200" style={{ marginTop: '40px' }}>
        <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-dark btn-lg">
            {t('community.join')} <ArrowUpRight weight="bold" size={18} />
          </button>
        </a>
      </div>
    </main>
  );
}
