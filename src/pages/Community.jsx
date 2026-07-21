import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ActionLink from '../components/ActionLink';

export default function Community() {
  const { t } = useLanguage();
  const [firstWord, ...remainingWords] = t('community.title').split(' ');

  return (
    <main className="hero-section community-page">
      <div className="hero-copy">
        <p className="hero-eyebrow animate-slide-up">{t('community.eyebrow')}</p>
        <h1 className="hero-title animate-slide-up community-title">
          {firstWord} <span className="highlight">{remainingWords.join(' ')}</span>
        </h1>
        <p className="hero-subtitle animate-slide-up delay-100">
          {t('community.subtitle')}
        </p>
      </div>

      <div className="hero-actions animate-slide-up delay-200">
        <ActionLink href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
          {t('community.join')}
        </ActionLink>
        <ActionLink variant="secondary" to="/products">
          {t('community.explore')}
        </ActionLink>
      </div>

      <p className="hero-note animate-slide-up delay-300">{t('community.note')}</p>
    </main>
  );
}
