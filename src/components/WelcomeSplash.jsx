import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { createCinematicAudio } from '../lib/cinematicAudio';

const ParticleField = lazy(() => import('./ParticleField'));
const sceneKeys = ['welcome', 'systems', 'ship'];
const SCENE_DURATION = 6200;
const TOTAL_DURATION = SCENE_DURATION * sceneKeys.length;
const ease = [0.76, 0, 0.24, 1];

const transitions = [
  {
    initial: { opacity: 0, x: '-18vw', rotateY: 7, scale: 0.92, filter: 'blur(12px)' },
    animate: { opacity: 1, x: 0, rotateY: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, x: '22vw', rotateY: -8, scale: 1.04, filter: 'blur(10px)' },
  },
  {
    initial: { opacity: 0, x: '16vw', rotateZ: 1.2, scale: 1.06, filter: 'blur(8px)' },
    animate: { opacity: 1, x: 0, rotateZ: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, x: '-14vw', rotateZ: -1, scale: 0.96, filter: 'blur(12px)' },
  },
  {
    initial: { opacity: 0, scale: 0.82, filter: 'blur(16px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.28, filter: 'blur(20px)' },
  },
];

export default function WelcomeSplash({ onComplete }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('opening');
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const startedAt = useRef(0);
  const sceneRef = useRef(0);
  const leavingRef = useRef(false);
  const timeline = useRef({ progress: 0, scene: 0, local: 0 });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.cancelAnimationFrame(frameRef.current);
    localStorage.setItem('krypton_intro_v2', 'complete');
    audioRef.current?.resolve();
    window.setTimeout(() => {
      audioRef.current?.stop();
      onComplete();
    }, reducedMotion ? 180 : 1150);
  }, [onComplete, reducedMotion]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('ready'), reducedMotion ? 180 : 1200);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frameRef.current);
      document.body.style.overflow = overflow;
      audioRef.current?.stop();
    };
  }, [reducedMotion]);

  const beginFilm = async () => {
    audioRef.current?.stop();
    audioRef.current = createCinematicAudio();
    await audioRef.current?.start();
    setPhase('film');
    setScene(0);
    sceneRef.current = 0;
    startedAt.current = performance.now();

    const tick = (now) => {
      const elapsed = Math.min(now - startedAt.current, TOTAL_DURATION);
      const progress = elapsed / TOTAL_DURATION;
      const nextScene = Math.min(sceneKeys.length - 1, Math.floor(elapsed / SCENE_DURATION));
      const local = Math.min(1, (elapsed - nextScene * SCENE_DURATION) / SCENE_DURATION);
      timeline.current = { progress, scene: nextScene, local };
      if (nextScene !== sceneRef.current) {
        sceneRef.current = nextScene;
        setScene(nextScene);
        audioRef.current?.cue(nextScene);
      }
      if (elapsed >= TOTAL_DURATION) finish();
      else frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
  };

  const toggleAudio = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current?.setMuted(next);
  };

  const key = sceneKeys[scene];
  const preset = transitions[scene];

  return (
    <motion.section className={`cinematic-intro intro-film intro-camera-${scene}`} animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.035 : 1 }} transition={{ duration: 1.1, ease }} aria-label={t('intro.label')}>
      <Suspense fallback={null}><ParticleField timeline={timeline} reducedMotion={reducedMotion} /></Suspense>
      <div className="intro-ambient" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-light-sweep" aria-hidden="true" />
      <div className="intro-film-grain" aria-hidden="true" />

      <header className="intro-film-topbar">
        <div className="intro-brand"><img src="/splash-logo.png" alt="" width="24" height="24" /><span>KryptonCode</span></div>
        {phase === 'film' && <div className="intro-film-actions">
          <button className="intro-audio-minimal" type="button" onClick={toggleAudio} aria-label={muted ? t('intro.unmute') : t('intro.mute')}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
          <button className="intro-skip-minimal" type="button" onClick={finish}>{t('intro.skip')}</button>
        </div>}
      </header>

      <AnimatePresence mode="sync">
        {phase === 'opening' && <motion.div className="intro-opening" key="opening" exit={{ opacity: 0, scale: 1.45, filter: 'blur(16px)' }} transition={{ duration: 0.95, ease }}>
          <motion.div className="intro-logo-core" initial={{ opacity: 0, scale: 0.78 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease }}><img src="/welcome-logo.png" alt="KryptonCode" /></motion.div>
        </motion.div>}

        {phase === 'ready' && <motion.div className="intro-center-panel intro-film-ready" key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.12, filter: 'blur(12px)' }} transition={{ duration: 0.9, ease }}>
          <p className="intro-eyebrow">AN INTERACTIVE FILM BY KRYPTONCODE</p>
          <h1>{t('intro.readyTitle')}</h1>
          <p className="intro-lead">{t('intro.readyDescription')}</p>
          <button className="intro-start" type="button" onClick={beginFilm}><span>{t('intro.start')}</span><ArrowRight size={18} /></button>
          <small>{t('intro.audioNote')}</small>
        </motion.div>}

        {phase === 'film' && <motion.div className={`intro-film-frame scene-${scene}`} key={key} initial={reducedMotion ? { opacity: 0 } : preset.initial} animate={preset.animate} exit={reducedMotion ? { opacity: 0 } : preset.exit} transition={{ duration: reducedMotion ? 0.1 : 1.35, ease }}>
          <p className="intro-film-kicker">{t(`intro.${key}.kicker`)}</p>
          <h1>{t(`intro.${key}.title`)}</h1>
          <p className="intro-film-description">{t(`intro.${key}.description`)}</p>
        </motion.div>}
      </AnimatePresence>

      {phase === 'film' && <div className="intro-film-timeline" aria-hidden="true"><motion.span key={scene} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SCENE_DURATION / 1000, ease: 'linear' }} /></div>}
    </motion.section>
  );
}
