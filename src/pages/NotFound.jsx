import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <main className="page-content animate-fade-in">
      <div className="nf-wrap">
        <span className="nf-code" aria-hidden="true">404</span>
        <h1 className="nf-title">{t('notFound.title')}</h1>
        <p className="nf-desc">{t('notFound.desc')}</p>
        <button className="k-btn k-btn--primary" onClick={() => navigate('/')}>
          <ArrowLeft aria-hidden="true" /> {t('notFound.back')}
        </button>
      </div>
    </main>
  );
}
