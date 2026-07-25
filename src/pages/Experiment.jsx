import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, FlaskConical, Play } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { experimentsData } from '../data/experimentsData';
import SpectrumBars from '../components/SpectrumBars';

const OPENING_KEY = 'krypton_lab_intro_v1';
const OPENING_MAX_MS = 8600; // safety fallback if 'ended' never fires

/**
 * LabOpening — cinematic entrance for the Lab. Different concept from the
 * site's WelcomeSplash: a single generated film plays full-bleed while three
 * staged text beats fade through, then the page reveals itself.
 */
function LabOpening({ onFinish }) {
  const { t } = useLanguage();
  const [beat, setBeat] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef(null);
  const doneRef = useRef(false);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.sessionStorage.setItem(OPENING_KEY, 'seen');
    window.setTimeout(onFinish, reducedMotion ? 120 : 760);
  }, [onFinish, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) { finish(); return undefined; }

    const timers = [
      window.setTimeout(() => setBeat(1), 500),
      window.setTimeout(() => setBeat(2), 2500),
      window.setTimeout(() => setBeat(3), 4900),
      window.setTimeout(finish, OPENING_MAX_MS),
    ];

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);

    return () => {
      timers.forEach(window.clearTimeout);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [finish, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <motion.div
      className={`lab-opening ${leaving ? 'is-leaving' : ''}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
      aria-label={t('lab.openingLabel')}
    >
      <video
        ref={videoRef}
        className="lab-opening-video"
        src="/lab-opening.mp4"
        poster="/lab-opening-poster.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <div className="lab-opening-shade" aria-hidden="true" />
      <div className="lab-opening-grain" aria-hidden="true" />

      <div className="lab-opening-frame" aria-hidden="true">
        <span>KRYPTON — LAB</span>
        <span>{new Date().getFullYear()}</span>
      </div>

      <div className="lab-opening-copy">
        <AnimatePresence>
          {beat >= 1 && (
            <motion.p
              key="eyebrow"
              className="lab-opening-eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {t('lab.openingKicker')}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {beat >= 2 && (
            <motion.h1
              key="title"
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {t('lab.openingTitle')}
            </motion.h1>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {beat >= 3 && (
            <motion.p
              key="sub"
              className="lab-opening-sub"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {t('lab.openingSub')}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="lab-opening-progress" aria-hidden="true"><i /></div>

      <button className="lab-skip" type="button" onClick={finish}>
        {t('lab.skip')}
      </button>
    </motion.div>
  );
}

const STATUSES = ['all', 'live', 'wip', 'archived'];

export default function Experiment() {
  const { t, language } = useLanguage();
  const [showOpening, setShowOpening] = useState(
    () => window.sessionStorage.getItem(OPENING_KEY) !== 'seen',
  );
  const [filter, setFilter] = useState('all');

  const items = useMemo(
    () => experimentsData.filter((e) => filter === 'all' || e.status === filter),
    [filter],
  );

  const replay = () => {
    window.sessionStorage.removeItem(OPENING_KEY);
    setShowOpening(true);
  };

  return (
    <>
      <AnimatePresence>
        {showOpening && <LabOpening onFinish={() => setShowOpening(false)} />}
      </AnimatePresence>

      <main
        className="lab-page page-content"
        style={{ opacity: showOpening ? 0 : 1, transition: 'opacity 0.7s ease-in' }}
        aria-hidden={showOpening}
      >
        {/* Head — same visual language as the other inner pages */}
        <section className="products-intro lab-intro animate-slide-up" aria-labelledby="lab-heading">
          <div className="products-kicker">
            <FlaskConical size={12} strokeWidth={1.8} aria-hidden="true" />
            {t('lab.kicker')}
          </div>
          <div className="products-intro-grid">
            <h1 id="lab-heading">{t('lab.headline')}</h1>
            <div className="products-intro-copy">
              <p>{t('lab.intro')}</p>
              <button type="button" className="lab-replay" onClick={replay}>
                <Play size={14} strokeWidth={1.8} aria-hidden="true" />
                {t('lab.replay')}
              </button>
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
                key={exp.id}
                className={`exp-card animate-slide-up delay-${Math.min((i + 1) * 100, 500)}`}
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
