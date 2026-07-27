import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FlaskConical,
  Lock,
  TriangleAlert,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { experimentsData } from '../data/experimentsData';
import { fetchExperiments } from '../lib/neonClient';

/**
 * ExperimentDetail — one entry of the Krypton Library.
 * Layout: hero (title + copy) → media panel (preview image / pattern +
 * live-preview & download actions) → the prompt (mono block with copy) →
 * index card (category / status / year / tags) → prev-next shelf nav.
 */
export default function ExperimentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Entri dimuat dari Neon (dikelola via /dashboard); data statis bawaan jadi
  // tampilan awal + fallback. `loaded` mencegah "not found" palsu untuk entri
  // baru yang belum ada di bundle statis saat halaman dibuka langsung.
  const [all, setAll] = useState(experimentsData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchExperiments()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setAll(rows);
      })
      .catch(() => {
        /* offline / Data API down — tetap pakai data statis */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const exp = useMemo(() => all.find((e) => e.slug === slug) || null, [all, slug]);

  // Fresh entry → always start from the top of the sheet.
  useEffect(() => {
    window.scrollTo(0, 0);
    setCopied(false);
  }, [slug]);

  const shelf = useMemo(
    () => (exp ? all.filter((e) => e.category === exp.category) : []),
    [all, exp],
  );
  const pos = exp ? shelf.findIndex((e) => e.id === exp.id) : -1;
  const prev = pos > 0 ? shelf[pos - 1] : null;
  const next = pos >= 0 && pos < shelf.length - 1 ? shelf[pos + 1] : null;

  const backPath = exp ? `/experiment?cat=${exp.category}` : '/experiment';

  const copyPrompt = async () => {
    if (!exp?.prompt) return;
    try {
      await navigator.clipboard.writeText(exp.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  if (!exp && !loaded) {
    return (
      <main className="expd-page page-content" aria-busy="true">
        <div className="exp-empty">…</div>
      </main>
    );
  }

  if (!exp) {
    return (
      <main className="expd-page page-content">
        <article className="detail-state menu-surface">
          <TriangleAlert aria-hidden="true" />
          <h1>{t('lab.detail.notFound')}</h1>
          <button
            className="product-button product-button-primary"
            onClick={() => navigate('/experiment')}
          >
            <ArrowLeft aria-hidden="true" />
            {t('lab.detail.back')}
          </button>
        </article>
      </main>
    );
  }

  const desc = language === 'id' ? exp.desc_id : exp.desc_en;
  const expIndex = String(pos + 1).padStart(3, '0');

  return (
    <main className="expd-page page-content animate-fade-in">
      {/* Toolbar — back to the shelf this entry lives on */}
      <div className="product-detail-toolbar">
        <button className="product-detail-back" onClick={() => navigate(backPath)}>
          <ArrowLeft aria-hidden="true" />
          {t('lab.detail.back')}
        </button>
        <span className="expd-crumb">
          <FlaskConical size={12} strokeWidth={1.8} aria-hidden="true" />
          {t('lab.kicker')} / {t(`lab.category.${exp.category}`)} / {expIndex}
        </span>
      </div>

      <article className="expd-layout">
        {/* 01 · Hero */}
        <header className="expd-hero" data-reveal>
          <div className="expd-eyebrow">
            <span className={`exp-status exp-status--${exp.status}`}>
              <i aria-hidden="true" />
              {t(`lab.status.${exp.status}`)}
            </span>
            <span className="expd-eyebrow-cat">{t(`lab.category.${exp.category}`)}</span>
            <span className="expd-eyebrow-year">{exp.year}</span>
          </div>
          <h1>{exp.title}</h1>
          <p>{desc}</p>
          <div className="exp-tags expd-tags">
            {exp.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>

        {/* 02 · Media panel + actions */}
        <section className="expd-media-card" aria-label={t('lab.detail.previewLabel')} data-reveal>
          <div className="expd-media">
            {exp.preview ? (
              <img src={exp.preview} alt={exp.title} loading="lazy" />
            ) : (
              <div className="expd-media-ph" aria-hidden="true">
                <span>{expIndex}</span>
              </div>
            )}
          </div>
          <div className="expd-actions">
            {exp.previewUrl ? (
              <a
                className="k-btn k-btn--primary"
                href={exp.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('lab.detail.preview')} <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            ) : (
              <span className="k-btn k-btn--ghost is-disabled" aria-disabled="true">
                <Lock size={14} strokeWidth={2} aria-hidden="true" /> {t('lab.detail.noPreview')}
              </span>
            )}
            {exp.downloadUrl ? (
              <a
                className="k-btn k-btn--ghost"
                href={exp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                {t('lab.detail.download')} <Download size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            ) : (
              <span className="k-btn k-btn--ghost is-disabled" aria-disabled="true">
                <Lock size={14} strokeWidth={2} aria-hidden="true" /> {t('lab.detail.noDownload')}
              </span>
            )}
          </div>
        </section>

        <div className="expd-grid">
          {/* 03 · The prompt */}
          <section className="expd-prompt-card" aria-labelledby="expd-prompt-title" data-reveal>
            <header className="expd-section-head">
              <span className="expd-section-index" aria-hidden="true">01</span>
              <h2 id="expd-prompt-title">{t('lab.detail.promptTitle')}</h2>
              {exp.prompt && (
                <button
                  type="button"
                  className={`expd-copy ${copied ? 'is-copied' : ''}`}
                  onClick={copyPrompt}
                >
                  {copied ? (
                    <>
                      <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                      {t('lab.detail.copied')}
                    </>
                  ) : (
                    <>
                      <Copy size={13} strokeWidth={1.8} aria-hidden="true" />
                      {t('lab.detail.copy')}
                    </>
                  )}
                </button>
              )}
            </header>
            {exp.prompt ? (
              <pre className="expd-prompt"><code>{exp.prompt}</code></pre>
            ) : (
              <p className="expd-prompt-empty">{t('lab.detail.promptEmpty')}</p>
            )}
          </section>

          {/* 04 · Index card */}
          <section className="expd-meta-card" aria-labelledby="expd-meta-title" data-reveal>
            <header className="expd-section-head">
              <span className="expd-section-index" aria-hidden="true">02</span>
              <h2 id="expd-meta-title">{t('lab.detail.metaTitle')}</h2>
            </header>
            <dl className="expd-meta">
              <div>
                <dt>{t('lab.detail.category')}</dt>
                <dd>{t(`lab.category.${exp.category}`)}</dd>
              </div>
              <div>
                <dt>{t('lab.detail.status')}</dt>
                <dd>{t(`lab.status.${exp.status}`)}</dd>
              </div>
              <div>
                <dt>{t('lab.detail.year')}</dt>
                <dd>{exp.year}</dd>
              </div>
              <div>
                <dt>{t('lab.detail.tags')}</dt>
                <dd>{exp.tags.join(' · ')}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* 05 · Shelf navigation */}
        {(prev || next) && (
          <nav className="expd-nav" aria-label={t('lab.detail.navLabel')}>
            {prev ? (
              <Link className="expd-nav-link" to={`/experiment/${prev.slug}`}>
                <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>
                  <small>{t('lab.detail.prev')}</small>
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="expd-nav-spacer" aria-hidden="true" />
            )}
            {next ? (
              <Link className="expd-nav-link expd-nav-link--next" to={`/experiment/${next.slug}`}>
                <span>
                  <small>{t('lab.detail.next')}</small>
                  {next.title}
                </span>
                <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            ) : (
              <span className="expd-nav-spacer" aria-hidden="true" />
            )}
          </nav>
        )}
      </article>
    </main>
  );
}
