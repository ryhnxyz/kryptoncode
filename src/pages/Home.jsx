import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Bot, Database, Network } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import BackgroundGlow from '../components/BackgroundGlow';
import DotMatrixMarquee from '../components/DotMatrixMarquee';
import SpectrumBars from '../components/SpectrumBars';

export default function Home() {
  const { t } = useLanguage();
  const tickerItems = t('home.ticker').split(';');

  const stats = [1, 2, 3, 4].map((n) => ({
    value: t(`home.stat${n}Value`),
    label: t(`home.stat${n}Label`),
  }));

  const services = [
    { icon: Bot, title: t('home.svc1Title'), desc: t('home.svc1Desc'), meta: t('home.svc1Meta'), to: '/products' },
    { icon: Database, title: t('home.svc2Title'), desc: t('home.svc2Desc'), meta: t('home.svc2Meta'), to: '/products' },
    { icon: Network, title: t('home.svc3Title'), desc: t('home.svc3Desc'), meta: t('home.svc3Meta'), to: '/pool' },
  ];

  const steps = [1, 2, 3, 4].map((n) => ({
    path: t(`home.step${n}Path`),
    title: t(`home.step${n}Title`),
    desc: t(`home.step${n}Desc`),
  }));

  const faqs = [1, 2, 3, 4].map((n) => ({
    q: t(`home.faq${n}Q`),
    a: t(`home.faq${n}A`),
  }));

  return (
    <main>
      {/* Hero — animated signal field band */}
      <section className="k-hero k-band k-band--hero">
        <BackgroundGlow />
        <p className="hero-eyebrow animate-slide-up">{t('common.studio')}</p>
        <h1 className="hero-title animate-slide-up">
          {t('home.title1')}<span className="highlight">{t('home.titleHighlight')}</span>{t('home.title2')}<br />
          {t('home.title3')}
        </h1>
        <p className="hero-subtitle animate-slide-up delay-100">{t('home.subtitle')}</p>
        <div className="hero-actions animate-slide-up delay-200">
          <Link className="k-btn k-btn--primary k-btn--lg" to="/products">
            <span>{t('home.ctaPrimary')}</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <a className="k-btn k-btn--ghost k-btn--lg" href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
            <span>{t('home.ctaSecondary')}</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <SpectrumBars height={56} className="hero-spectrum animate-slide-up delay-300" />
        <p className="k-hero-note animate-slide-up delay-300">{t('home.note')}</p>
      </section>

      {/* Dot-matrix marquee */}
      <DotMatrixMarquee text={tickerItems.join('   ·   ')} />

      {/* Stats */}
      <section className="k-section k-section--tight" aria-label="KryptonCode stats">
        <div className="k-stats">
          {stats.map((s, i) => (
            <article className="k-stat" key={i} data-reveal style={{ '--reveal-delay': `${i * 80}ms` }}>
              <span className="k-stat-index">{String(i + 1).padStart(2, '0')} /</span>
              <span className="k-stat-value">{s.value}</span>
              <span className="k-stat-label">{s.label}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Services — raised panel band */}
      <section className="k-section k-band k-band--panel" aria-labelledby="services-title">
        <div className="k-section-head" data-reveal>
          <div>
            <span className="k-eyebrow">{t('home.servicesEyebrow')}</span>
            <h2 className="k-h2" id="services-title">{t('home.servicesTitle')}</h2>
          </div>
          <Link className="k-section-link" to="/products">
            {t('home.servicesLink')}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="k-services">
          {services.map(({ icon: Icon, title, desc, meta, to }, i) => (
            <Link className="k-service" to={to} key={i} data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
              <div className="k-service-row">
                <span className="k-service-icon"><Icon strokeWidth={1.6} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <span className="k-arrow"><ArrowUpRight aria-hidden="true" /></span>
              </div>
              <div className="k-service-divider" aria-hidden="true" />
              <p>{desc}</p>
              <span className="k-service-meta">{meta}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Pool feature band */}
      <section className="k-section k-section--tight" aria-labelledby="pool-band-title">
        <div className="k-pool-band" data-reveal>
          <div>
            <span className="k-eyebrow">{t('home.poolEyebrow')}</span>
            <h2 className="k-h2" id="pool-band-title">{t('home.poolTitle')}</h2>
            <p>{t('home.poolDesc')}</p>
            <div className="k-pool-band-actions">
              <Link className="k-btn k-btn--primary" to="/pool">
                <span>{t('home.poolCta1')}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <a className="k-btn k-btn--ghost" href="https://t.me/kryptoncode_bot?start=genapi" target="_blank" rel="noopener noreferrer">
                <span>{t('home.poolCta2')}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="k-pool-panel" aria-hidden="true">
            <div className="k-pool-panel-head">
              <span className="k-pool-panel-title">{t('home.poolPanelTitle')}</span>
              <span className="products-status-dot" />
            </div>
            <div className="k-pool-mini-grid">
              <div className="k-pool-mini"><b>45.2K</b><span>{t('home.poolMini1')}</span></div>
              <div className="k-pool-mini"><b>5</b><span>{t('home.poolMini2')}</span></div>
              <div className="k-pool-mini"><b>10/12</b><span>{t('home.poolMini3')}</span></div>
              <div className="k-pool-mini"><b>66%</b><span>{t('home.poolMini4')}</span></div>
            </div>
            <div className="pool-capacity-bar">
              <div className="pool-capacity-fill pool-capacity-fill--good" style={{ width: '34%' }} />
            </div>
            <SpectrumBars height={30} align="bottom" className="k-pool-panel-spectrum" />
            <div className="k-pool-panel-foot">
              <span>{t('home.poolFoot1')}</span>
              <span>{t('home.poolFoot2')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps — terminal scanline band */}
      <section className="k-section k-band k-band--scan" aria-labelledby="steps-title">
        <div className="k-section-head" data-reveal>
          <div>
            <span className="k-eyebrow">{t('home.stepsEyebrow')}</span>
            <h2 className="k-h2" id="steps-title">{t('home.stepsTitle')}</h2>
          </div>
        </div>
        <div className="k-steps">
          {steps.map((s, i) => (
            <article className="k-step" data-index={String(i + 1).padStart(2, '0')} key={i} data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
              <span className="k-step-path">{s.path}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="k-section k-section--tight" aria-labelledby="faq-title">
        <div className="k-section-head" data-reveal>
          <div>
            <span className="k-eyebrow">{t('home.faqEyebrow')}</span>
            <h2 className="k-h2" id="faq-title">{t('home.faqTitle')}</h2>
          </div>
        </div>
        <div className="k-faq k-faq-list">
          {faqs.map((f, i) => (
            <details key={i} data-reveal style={{ '--reveal-delay': `${i * 70}ms` }}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA banner — inverted off-white band (flat, overcode language) */}
      <section className="k-band k-band--cta k-cta--light" aria-labelledby="cta-title">
        <div className="k-cta" data-reveal>
          <span className="k-eyebrow">{t('home.ctaEyebrow')}</span>
          <h2 className="k-cta-title" id="cta-title">{t('home.ctaTitle')}</h2>
          <p>{t('home.ctaDesc')}</p>
          <div className="k-cta-actions">
            <a className="k-btn k-btn--primary k-btn--lg" href="https://t.me/kryptoncodes" target="_blank" rel="noopener noreferrer">
              <span>{t('home.ctaChat')}</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <Link className="k-btn k-btn--ghost k-btn--lg" to="/products">
              <span>{t('home.ctaExplore')}</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
