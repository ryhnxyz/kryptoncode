import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <main className="hero-section">
      <h1 className="hero-title animate-slide-up">
        {t('home.title1')}<span className="highlight">{t('home.titleHighlight')}</span>{t('home.title2')}<br/>
        {t('home.title3')}
      </h1>
      
      <p className="hero-subtitle animate-slide-up delay-100">
        {t('home.subtitle')}
      </p>
      
      <div className="hero-actions animate-slide-up delay-200">
        <button className="btn-primary" onClick={() => navigate('/products')}>{t('home.ctaPrimary')}</button>
        <a href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">{t('home.ctaSecondary')}</button>
        </a>
      </div>
    </main>
  );
}
