import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { createCinematicAudio } from '../lib/cinematicAudio';
import LanguageSelector from './LanguageSelector';
import ParticleField from './ParticleField';

const sceneKeys = ['welcome', 'systems', 'ship'];

export default function WelcomeSplash({ onComplete }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('opening');
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef(null);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const timer = window.setTimeout(() => finish(), reducedMotion ? 800 : 2200);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      audioRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase !== 'story') return;
      if (event.key === 'ArrowRight') goToScene(Math.min(scene + 1, 2));
      if (event.key === 'ArrowLeft') goToScene(Math.max(scene - 1, 0));
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const startExperience = async () => {
    audioRef.current = createCinematicAudio();
    await audioRef.current?.start();
    setPhase(localStorage.getItem('app_language') ? 'story' : 'language');
  };

  const startStory = () => {
    setPhase('story');
    audioRef.current?.cue(0);
  };

  const goToScene = (nextScene) => {
    if (nextScene === scene) return;
    setScene(nextScene);
    audioRef.current?.cue(nextScene);
  };

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    localStorage.setItem('krypton_intro_v2', 'complete');
    audioRef.current?.stop();
    window.setTimeout(onComplete, reducedMotion ? 250 : 1100);
  };

  const toggleAudio = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioRef.current?.setMuted(nextMuted);
  };

  const activeKey = sceneKeys[scene];

  return (
    <motion.section
      className={`cinematic-intro ${leaving ? 'is-leaving' : ''}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0.2 : 1, ease: [0.76, 0, 0.24, 1] }}
      aria-label={t('intro.label')}
    >
      {phase !== 'opening' && (
        <>
          <ParticleField scene={phase === 'story' ? scene : -1} reducedMotion={reducedMotion} />
          <div className="intro-vignette" aria-hidden="true" />
          <div className="intro-scanline" aria-hidden="true" />

          <header className="intro-topbar">
            <div className="intro-brand">
              <img src="/splash-logo.png" alt="" width="28" height="28" />
              <span>KryptonCode</span>
            </div>
            <div className="intro-top-actions">
              {phase !== 'ready' && (
                <button className="intro-icon-button" type="button" onClick={toggleAudio} aria-label={muted ? t('intro.unmute') : t('intro.mute')}>
                  {muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                </button>
              )}
              {phase === 'story' && <button className="intro-skip" type="button" onClick={finish}>{t('intro.skip')}</button>}
            </div>
          </header>
        </>
      )}

      <AnimatePresence mode="wait">
        {phase === 'opening' && (
          <motion.div
            className="intro-opening"
            key="opening"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{ position: 'relative', width: '140px', height: '140px' }}
            >
              {/* Static pure logo underneath */}
              <img
                src="/welcome-logo.png"
                alt="KryptonCode"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'contain' }}
              />
              {/* Animated chrome shimmer masked to the logo shape */}
              <motion.div
                className="fx-chrome-logo"
                aria-hidden="true"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  WebkitMaskImage: 'url(/welcome-logo.png)',
                  maskImage: 'url(/welcome-logo.png)',
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {phase === 'ready' && (
          <motion.div className="intro-center-panel" key="ready" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <p className="intro-eyebrow">KRYPTON / 00—03</p>
            <h1>{t('intro.readyTitle')}</h1>
            <p className="intro-lead">{t('intro.readyDescription')}</p>
            <button className="intro-start" type="button" onClick={startExperience}>
              <span>{t('intro.start')}</span><ArrowRight size={20} aria-hidden="true" />
            </button>
            <small>{t('intro.audioNote')}</small>
          </motion.div>
        )}

        {phase === 'language' && (
          <motion.div className="intro-center-panel" key="language" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="intro-eyebrow">KRYPTON / LANGUAGE</p>
            <h1>{t('language.welcomeTitle')}</h1>
            <p className="intro-lead">{t('language.welcomeDescription')}</p>
            <LanguageSelector mode="welcome" onSelect={startStory} />
          </motion.div>
        )}

        {phase === 'story' && (
          <motion.div className="intro-story" key={scene} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}>
            <div className="intro-scene-copy">
              <motion.p className="intro-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{`0${scene + 1} / 03 · ${t(`intro.${activeKey}.kicker`)}`}</motion.p>
              <motion.h1 initial={{ y: 70 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>{t(`intro.${activeKey}.title`)}</motion.h1>
              <motion.p className="intro-lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>{t(`intro.${activeKey}.description`)}</motion.p>
              <motion.div className="intro-scene-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                {[0, 1, 2].map((item) => <span key={item}>{t(`intro.${activeKey}.tag${item + 1}`)}</span>)}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'story' && (
        <footer className="intro-controls">
          <div className="intro-progress" aria-label={t('intro.progress')}>
            {sceneKeys.map((key, index) => (
              <button key={key} className={index === scene ? 'is-active' : index < scene ? 'is-complete' : ''} type="button" onClick={() => goToScene(index)} aria-label={`${t('intro.step')} ${index + 1}`} aria-current={index === scene ? 'step' : undefined}>
                <span /><b>{`0${index + 1}`}</b>
              </button>
            ))}
          </div>
          <div className="intro-nav-buttons">
            <button type="button" onClick={() => goToScene(scene - 1)} disabled={scene === 0} aria-label={t('intro.back')}><ArrowLeft size={20} aria-hidden="true" /></button>
            {scene < 2 ? (
              <button className="intro-next" type="button" onClick={() => goToScene(scene + 1)}>{t('intro.next')}<ArrowRight size={20} aria-hidden="true" /></button>
            ) : (
              <button className="intro-next" type="button" onClick={finish}>{t('intro.enter')}<ArrowRight size={20} aria-hidden="true" /></button>
            )}
          </div>
        </footer>
      )}
    </motion.section>
  );
}
