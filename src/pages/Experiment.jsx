import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, FlaskConical, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  experimentCategories,
  experimentsData,
  getCategoryCount,
} from '../data/experimentsData';
import SpectrumBars from '../components/SpectrumBars';

const WELCOME_HOLD_MS = 2900;   // when the exit choreography starts
const WELCOME_DONE_MS = 3700;   // when the overlay unmounts

const siteSplashDone = () => window.localStorage.getItem('krypton_intro_v2') === 'complete';

const BLOBS = [
  // [suffix, exit X (vw), exit Y (vh), enter delay]
  ['a', -30, -18, 0],
  ['b', 32, -22, 0.08],
  ['c', -34, 22, 0.16],
  ['d', 30, 26, 0.1],
  ['e', 0, 32, 0.22],
];

const EASE = [0.16, 1, 0.3, 1];

/**
 * LabWelcome — labs.google-style welcome screen, krypton palette.
 * A timed splash: monochrome organic blobs bloom in around the centered
 * brand, hold a beat, then drift apart as the screen hands over to the
 * dark catalog. Pure animation — no scrolling involved.
 */
function LabWelcome({ t, onDone, hold = false }) {
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const beginExit = useCallback(() => {
    setLeaving(true);
    window.setTimeout(finish, reducedMotion ? 60 : WELCOME_DONE_MS - WELCOME_HOLD_MS);
  }, [finish, reducedMotion]);

  useEffect(() => {
    if (reducedMotion && !hold) { finish(); return undefined; }

    // hold mode (?intro=1): stay on screen until the user skips — handy for
    // previewing/tuning the choreography.
    const exitTimer = hold ? 0 : window.setTimeout(beginExit, WELCOME_HOLD_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') beginExit(); };
    window.addEventListener('keydown', onKey);

    return () => {
      if (exitTimer) window.clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [beginExit, finish, reducedMotion, hold]);

  if (reducedMotion && !hold) return null;

  return (
    <motion.div
      className="lab-welcome"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.55, delay: leaving ? 0.45 : 0, ease: 'easeInOut' }}
      aria-label={t('lab.openingLabel')}
    >
      {/* Organic blob field */}
      <div className="lab-blobs" aria-hidden="true">
        {BLOBS.map(([suffix, dx, dy, delay]) => (
          <motion.i
            key={suffix}
            className={`lab-blob lab-blob--${suffix}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={
              leaving
                ? { x: `${dx}vw`, y: `${dy}vh`, scale: 0.55, opacity: 0 }
                : { x: 0, y: 0, scale: 1, opacity: 1 }
            }
            transition={
              leaving
                ? { duration: 0.75, ease: [0.55, 0, 0.55, 1] }
                : { duration: 1.05, delay, ease: EASE }
            }
          />
        ))}
      </div>

      {/* HUD frame */}
      <motion.div
        className="lab-welcome-frame"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.6, delay: leaving ? 0 : 0.5 }}
      >
        <span>KRYPTON — LAB</span>
        <span>{new Date().getFullYear()}</span>
      </motion.div>

      {/* Centered brand copy (labs.google composition) */}
      <motion.div
        className="lab-welcome-copy"
        animate={leaving ? { y: -36, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: leaving ? 0.55 : 0.01 }}
      >
        <motion.span
          className="lab-welcome-badge"
          aria-hidden="true"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
        >
          <FlaskConical size={22} strokeWidth={1.7} />
        </motion.span>
        <motion.p
          className="lab-welcome-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {t('lab.openingKicker')}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.62, ease: EASE }}
        >
          {t('lab.openingTitle')}
        </motion.h1>
        <motion.p
          className="lab-welcome-sub"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
        >
          {t('lab.openingSub')}
        </motion.p>
      </motion.div>

      {/* Timed progress line */}
      <div className="lab-welcome-progress" aria-hidden="true"><i /></div>

      <button type="button" className="lab-welcome-skip" onClick={beginExit}>
        {t('lab.skip')}
      </button>
    </motion.div>
  );
}

const STATUSES = ['all', 'live', 'wip', 'archived'];

/**
 * Experiment — the Krypton Library.
 * A library-shaped catalog: an index of category shelves (design first),
 * a filterable grid of entries, and a detail page per entry
 * (/experiment/:slug) with live preview, download, and the prompt.
 */
export default function Experiment() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');

  // Active shelf lives in the URL (?cat=design) so it survives refresh
  // and can be shared / linked back to from detail pages.
  const catParam = searchParams.get('cat');
  const category = experimentCategories.some((c) => c.id === catParam) ? catParam : 'all';

  const selectCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('cat');
    else next.set('cat', id);
    setSearchParams(next, { replace: true });
  };

  // The welcome plays on every entrance to the Lab (labs.google behavior),
  // but never underneath the site-wide splash — it waits its turn.
  // ?intro=1 holds it open (preview/tuning mode).
  const holdIntro = new URLSearchParams(window.location.search).has('intro');
  const [showWelcome, setShowWelcome] = useState(() => holdIntro || siteSplashDone());

  useEffect(() => {
    if (siteSplashDone()) return undefined;
    const onSplashDone = () => setShowWelcome(true);
    window.addEventListener('krypton:splash-done', onSplashDone, { once: true });
    return () => window.removeEventListener('krypton:splash-done', onSplashDone);
  }, []);

  const items = useMemo(
    () =>
      experimentsData.filter(
        (e) =>
          (category === 'all' || e.category === category) &&
          (filter === 'all' || e.status === filter),
      ),
    [category, filter],
  );

  return (
    <>
      <AnimatePresence>
        {showWelcome && <LabWelcome t={t} hold={holdIntro} onDone={() => setShowWelcome(false)} />}
      </AnimatePresence>

      <main className="lab-page page-content" aria-hidden={showWelcome}>
        {/* 01 · Library intro */}
        <section className="products-intro lab-intro animate-slide-up" aria-labelledby="lab-heading">
          <div className="products-kicker">
            <FlaskConical size={12} strokeWidth={1.8} aria-hidden="true" />
            {t('lab.kicker')}
          </div>
          <div className="products-intro-grid">
            <h1 id="lab-heading">{t('lab.headline')}</h1>
            <div className="products-intro-copy">
              <p>{t('lab.intro')}</p>
            </div>
          </div>
          <SpectrumBars height={54} className="lab-spectrum" />
          <div className="products-separator" />
          <div className="products-meta">
            <span>{t('lab.metaLeft')}</span>
            <div className="exp-filters" role="group" aria-label={t('lab.filterLabel')}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`exp-filter ${filter === s ? 'is-active' : ''}`}
                  aria-pressed={filter === s}
                  onClick={() => setFilter(s)}
                >
                  {t(`lab.filter.${s}`)}
                </button>
              ))}
            </div>
            <span>
              {items.length} {t('lab.count')}
            </span>
          </div>
        </section>

        {/* 02 · Shelf index — pick a category */}
        <section className="lib-index" aria-label={t('lab.shelfLabel')} data-reveal>
          <div className="lib-index-head">
            <span>[ {t('lab.shelfKicker')} ]</span>
            <span>
              {experimentsData.length} {t('lab.count')}
            </span>
          </div>
          <div className="lib-rows">
            <button
              type="button"
              className={`lib-row ${category === 'all' ? 'is-active' : ''}`}
              aria-pressed={category === 'all'}
              onClick={() => selectCategory('all')}
            >
              <span className="lib-row-index" aria-hidden="true">00</span>
              <span className="lib-row-name">{t('lab.category.all')}</span>
              <span className="lib-row-count">
                {experimentsData.length} {t('lab.entries')}
              </span>
              <ArrowRight className="lib-row-arrow" size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
            {experimentCategories.map((c, i) => {
              const count = getCategoryCount(c.id);
              const soon = c.soon || count === 0;
              const rowIndex = String(i + 1).padStart(2, '0');
              if (soon) {
                return (
                  <div key={c.id} className="lib-row is-soon" aria-disabled="true">
                    <span className="lib-row-index" aria-hidden="true">{rowIndex}</span>
                    <span className="lib-row-name">{t(`lab.category.${c.id}`)}</span>
                    <span className="lib-row-soon">
                      <Lock size={11} strokeWidth={2} aria-hidden="true" />
                      {t('lab.shelfSoon')}
                    </span>
                  </div>
                );
              }
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`lib-row ${category === c.id ? 'is-active' : ''}`}
                  aria-pressed={category === c.id}
                  onClick={() => selectCategory(c.id)}
                >
                  <span className="lib-row-index" aria-hidden="true">{rowIndex}</span>
                  <span className="lib-row-name">{t(`lab.category.${c.id}`)}</span>
                  <span className="lib-row-count">
                    {count} {t('lab.entries')}
                  </span>
                  <ArrowRight className="lib-row-arrow" size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        {/* 03 · Catalog grid — every card opens its detail page */}
        <section className="exp-grid" aria-label={t('lab.catalogLabel')}>
          {items.map((exp, i) => {
            const desc = language === 'id' ? exp.desc_id : exp.desc_en;
            return (
              <Link
                key={`${category}-${filter}-${exp.id}`}
                to={`/experiment/${exp.slug}`}
                className="exp-card exp-card--library"
                style={{ '--card-delay': `${Math.min(i * 60, 320)}ms` }}
                data-index={String(i + 1).padStart(3, '0')}
              >
                <div className="exp-thumb" aria-hidden="true">
                  {exp.preview ? (
                    <img src={exp.preview} alt="" loading="lazy" />
                  ) : (
                    <span className="exp-thumb-ph">{String(i + 1).padStart(3, '0')}</span>
                  )}
                  <span className="exp-thumb-cat">{t(`lab.category.${exp.category}`)}</span>
                </div>
                <div className="exp-card-top">
                  <span className="exp-index" aria-hidden="true">{String(i + 1).padStart(3, '0')}</span>
                  <span className={`exp-status exp-status--${exp.status}`}>
                    <i aria-hidden="true" />
                    {t(`lab.status.${exp.status}`)}
                  </span>
                </div>
                <h2>{exp.title}</h2>
                <p>{desc}</p>
                <div className="exp-foot">
                  <div className="exp-tags">
                    {exp.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <span className="exp-year">
                    {exp.year}
                    <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
          {items.length === 0 && (
            <div className="exp-empty">{t('lab.empty')}</div>
          )}
        </section>

        {/* 04 · Outro — submit an idea */}
        <section className="lab-outro" data-reveal>
          <div className="lab-outro-copy">
            <span className="lab-outro-kicker">[ {t('lab.outroKicker')} ]</span>
            <h2>{t('lab.outroTitle')}</h2>
            <p>{t('lab.outroDesc')}</p>
          </div>
          <a
            className="k-btn k-btn--primary"
            href="https://t.me/kryptoncodes"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('lab.outroCta')} <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </section>
      </main>
    </>
  );
}
