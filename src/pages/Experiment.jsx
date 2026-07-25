import React, { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, FlaskConical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { experimentsData } from '../data/experimentsData';
import SpectrumBars from '../components/SpectrumBars';

/**
 * LabStage — labs.google-style welcome splash, krypton palette.
 * An off-white pinned screen with slow-morphing organic blobs and the brand
 * centered; scrolling drifts the blobs apart, fades the copy, and releases
 * the stage into the dark catalog. No video — pure CSS/JS scene.
 */
const BLOBS = [
  // [class suffix, parallax X, parallax Y]
  ['a', -34, -20],
  ['b', 36, -26],
  ['c', -38, 24],
  ['d', 34, 28],
  ['e', 0, 36],
];

function LabBlob({ suffix, dx, dy, drift, scale, opacity }) {
  const x = useTransform(drift, [0, 1], ['0vw', `${dx}vw`]);
  const y = useTransform(drift, [0, 1], ['0vh', `${dy}vh`]);
  return <motion.i className={`lab-blob lab-blob--${suffix}`} style={{ x, y, scale, opacity }} />;
}

function LabStage({ t }) {
  const stageRef = useRef(null);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  });

  /* Beat map (scroll progress 0 → 1)
     0.00–0.50  brand splash holds, blobs breathe
     0.10–0.62  blobs drift outward & shrink, copy floats up and fades
     0.66–1.00  off-white screen gives way to the dark canvas             */
  const copyOpacity = useTransform(scrollYProgress, [0, 0.4, 0.58], [1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.58], [0, -110]);
  const copyScale = useTransform(scrollYProgress, [0, 0.58], [1, 0.94]);
  const blobDrift = useTransform(scrollYProgress, [0.06, 0.72], [0, 1]);
  const blobScale = useTransform(blobDrift, [0, 1], [1, 0.42]);
  const blobOpacity = useTransform(scrollYProgress, [0.5, 0.78], [1, 0]);
  const exitOpacity = useTransform(scrollYProgress, [0.66, 0.94], [0, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.03, 0.12], [1, 1, 0]);

  const skipStage = () => {
    const el = stageRef.current;
    if (!el) return;
    const bottom = el.offsetTop + el.offsetHeight - window.innerHeight + 2;
    window.scrollTo({ top: bottom, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <section ref={stageRef} className="lab-stage" aria-label={t('lab.openingLabel')}>
      <div className="lab-stage-sticky">
        {/* Organic blob field */}
        <div className="lab-blobs" aria-hidden="true">
          {BLOBS.map(([suffix, dx, dy]) => (
            <LabBlob
              key={suffix}
              suffix={suffix}
              dx={dx}
              dy={dy}
              drift={blobDrift}
              scale={blobScale}
              opacity={blobOpacity}
            />
          ))}
        </div>

        {/* HUD frame */}
        <div className="lab-stage-frame" aria-hidden="true">
          <span>KRYPTON — LAB</span>
          <span>{new Date().getFullYear()}</span>
        </div>

        {/* Centered brand copy (labs.google composition) */}
        <motion.div
          className="lab-stage-copy"
          style={{ opacity: copyOpacity, y: copyY, scale: copyScale }}
        >
          <span className="lab-stage-badge" aria-hidden="true">
            <FlaskConical size={22} strokeWidth={1.7} />
          </span>
          <p className="lab-stage-eyebrow">{t('lab.openingKicker')}</p>
          <h1>{t('lab.openingTitle')}</h1>
          <p className="lab-stage-sub">{t('lab.openingSub')}</p>
        </motion.div>

        <motion.div className="lab-stage-hint" style={{ opacity: hintOpacity }} aria-hidden="true">
          <ArrowDown size={15} strokeWidth={1.8} />
          <span>{t('lab.scrollHint')}</span>
        </motion.div>

        <div className="lab-stage-actions">
          <button type="button" className="lab-stage-btn" onClick={skipStage}>
            {t('lab.skip')}
          </button>
        </div>

        <div className="lab-stage-progress" aria-hidden="true">
          <motion.i style={{ scaleX: scrollYProgress }} />
        </div>

        {/* Release into the dark canvas */}
        <motion.div className="lab-stage-exit" style={{ opacity: exitOpacity }} aria-hidden="true" />
      </div>
    </section>
  );
}

const STATUSES = ['all', 'live', 'wip', 'archived'];

export default function Experiment() {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState('all');

  const items = useMemo(
    () => experimentsData.filter((e) => filter === 'all' || e.status === filter),
    [filter],
  );

  return (
    <main className="lab-page">
      {/* labs.google-style scroll splash */}
      <LabStage t={t} />

      {/* Catalog intro */}
      <section className="products-intro lab-intro" aria-labelledby="lab-heading" data-reveal>
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
  );
}
