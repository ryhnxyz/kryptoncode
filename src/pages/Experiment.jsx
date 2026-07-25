import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, FlaskConical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { experimentsData } from '../data/experimentsData';
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
function LabWelcome({ t, onDone }) {
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
    if (reducedMotion) { finish(); return undefined; }

    const exitTimer = window.setTimeout(beginExit, WELCOME_HOLD_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') beginExit(); };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [beginExit, finish, reducedMotion]);

  if (reducedMotion) return null;

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

export default function Experiment() {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState('all');
  // The welcome plays on every entrance to the Lab (labs.google behavior),
  // but never underneath the site-wide splash — it waits its turn.
  const [showWelcome, setShowWelcome] = useState(() => siteSplashDone());

  useEffect(() => {
    if (siteSplashDone()) return undefined;
    const onSplashDone = () => setShowWelcome(true);
    window.addEventListener('krypton:splash-done', onSplashDone, { once: true });
    return () => window.removeEventListener('krypton:splash-done', onSplashDone);
  }, []);

  const items = useMemo(
    () => experimentsData.filter((e) => filter === 'all' || e.status === filter),
    [filter],
  );

  return (
    <>
      <AnimatePresence>
        {showWelcome && <LabWelcome t={t} onDone={() => setShowWelcome(false)} />}
      </AnimatePresence>

      <main className="lab-page page-content" aria-hidden={showWelcome}>
        {/* Catalog intro */}
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

        {/* Catalog */}
        <section className="exp-grid" aria-label={t('lab.catalogLabel')}>
          {items.map((exp, i) => {
            const desc = language === 'id' ? exp.desc_id : exp.desc_en;
            const Wrapper = exp.url ? 'a' : 'article';
            const wrapperProps = exp.url
              ? { href: exp.url, target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Wrapper
                key={`${filter}-${exp.id}`}
                className="exp-card"
                data-reveal
                style={{ '--reveal-delay': `${Math.min(i * 70, 350)}ms` }}
                data-index={String(i + 1).padStart(3, '0')}
                {...wrapperProps}
              >
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
                    {exp.url && <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />}
                  </span>
                </div>
              </Wrapper>
            );
          })}
          {items.length === 0 && (
            <div className="exp-empty">{t('lab.empty')}</div>
          )}
        </section>
      </main>
    </>
  );
}
