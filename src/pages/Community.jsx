import React from 'react';
import { ArrowUpRight, MessagesSquare, Users, Wrench } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Community() {
  const { t } = useLanguage();
  const [first, ...rest] = t('community.title').split(' ');

  const perks = [
    { icon: MessagesSquare, label: t('community.perk1') },
    { icon: Wrench, label: t('community.perk2') },
    { icon: Users, label: t('community.perk3') },
  ];

  return (
    <main className="page-content">
      <section className="k-hero community-hero">
        <p className="hero-eyebrow animate-slide-up">{t('common.studio')}</p>
        <h1 className="hero-title animate-slide-up">
          {first} <span className="highlight">{rest.join(' ')}</span>
        </h1>
        <p className="hero-subtitle animate-slide-up delay-100">{t('community.subtitle')}</p>
        <div className="hero-actions animate-slide-up delay-200">
          <a
            className="k-btn k-btn--primary k-btn--lg"
            href="https://t.me/kryptoncodes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t('community.join')}</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <div className="k-community-perks animate-slide-up delay-300">
          {perks.map(({ icon: Icon, label }, i) => (
            <span className="k-chip" key={i}>
              <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
