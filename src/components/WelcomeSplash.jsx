import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { createCinematicAudio } from '../lib/cinematicAudio';

const ParticleField = lazy(() => import('./ParticleField'));

const sceneKeys = ['welcome', 'systems', 'ship'];
const SCENE_DURATION = 7200;

export default function WelcomeSplash({ onComplete }) {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState('opening');
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const speechRef = useRef(null);
  const timeline = useRef({ scene: 0, local: 0 });
  const startedAt = useRef(0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('ready'), reducedMotion ? 200 : 1300);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
      document.body.style.overflow = overflow;
      audioRef.current?.stop();
    };
  }, [reducedMotion]);

  const speakScene = (index) => {
    if (!window.speechSynthesis || muted) return;
    window.speechSynthesis.cancel();
    const key = sceneKeys[index];
    const utterance = new SpeechSynthesisUtterance(`${t(`intro.${key}.title`)} ${t(`intro.${key}.description`)}`);
    utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 0.92;
    utterance.volume = 0.84;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const beginFilm = async () => {
    audioRef.current = createCinematicAudio();
    await audioRef.current?.start();
    setPhase('film');
    setScene(0);
    startedAt.current = performance.now();
    speakScene(0);
    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt.current;
      const nextScene = Math.min(2, Math.floor(elapsed / SCENE_DURATION));
      timeline.current = { scene: nextScene, local: (elapsed % SCENE_DURATION) / SCENE_DURATION };
      setScene((current) => {
        if (current !== nextScene) {
          audioRef.current?.cue(nextScene);
          speakScene(nextScene);
          return nextScene;
        }
        return current;
      });
      if (elapsed >= SCENE_DURATION * 3) finish();
    }, 80);
  };

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    window.clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    localStorage.setItem('krypton_intro_v2', 'complete');
    audioRef.current?.stop();
    window.setTimeout(onComplete, reducedMotion ? 200 : 1250);
  };

  const toggleAudio = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current?.setMuted(next);
    if (next) window.speechSynthesis?.cancel();
    else if (phase === 'film') speakScene(scene);
  };

  const key = sceneKeys[scene];
  return (
    <motion.section className="cinematic-intro intro-film" animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.08 : 1 }} transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }} aria-label={t('intro.label')}>
      <Suspense fallback={null}>
        <ParticleField timeline={timeline} reducedMotion={reducedMotion} />
      </Suspense>
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-film-grain" aria-hidden="true" />

      <header className="intro-film-topbar">
        <div className="intro-brand"><img src="/splash-logo.png" alt="" width="24" height="24" /><span>KryptonCode</span></div>
        {phase === 'film' && <div className="intro-film-actions">
          <button className="intro-audio-minimal" type="button" onClick={toggleAudio} aria-label={muted ? t('intro.unmute') : t('intro.mute')}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
          <button className="intro-skip-minimal" type="button" onClick={finish}>{t('intro.skip')}</button>
        </div>}
      </header>

      <AnimatePresence mode="sync">
        {phase === 'opening' && <motion.div className="intro-opening" key="opening" exit={{ opacity: 0, scale: 1.7, filter: 'blur(18px)' }} transition={{ duration: 1.1 }}>
          <motion.div className="intro-logo-core" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1 }}><img src="/welcome-logo.png" alt="KryptonCode" /></motion.div>
        </motion.div>}

        {phase === 'ready' && <motion.div className="intro-center-panel intro-film-ready" key="ready" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.35, filter: 'blur(16px)' }} transition={{ duration: 1 }}>
          <p className="intro-eyebrow">AN INTERACTIVE FILM BY KRYPTONCODE</p>
          <h1>{t('intro.readyTitle')}</h1>
          <p className="intro-lead">{t('intro.readyDescription')}</p>
          <button className="intro-start" type="button" onClick={beginFilm}><span>{t('intro.start')}</span><ArrowRight size={18} /></button>
          <small>{t('intro.audioNote')}</small>
        </motion.div>}

        {phase === 'film' && <motion.div className={`intro-film-frame scene-${scene}`} key={key} initial={{ opacity: 0, scale: 0.72, z: -300, filter: 'blur(24px)' }} animate={{ opacity: 1, scale: 1, z: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.5, z: 300, filter: 'blur(28px)' }} transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}>
          <p className="intro-film-kicker">{t(`intro.${key}.kicker`)}</p>
          <h1>{t(`intro.${key}.title`)}</h1>
          <p className="intro-film-description">{t(`intro.${key}.description`)}</p>
        </motion.div>}
      </AnimatePresence>

      {phase === 'film' && <div className="intro-film-timeline" aria-hidden="true"><motion.span key={scene} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SCENE_DURATION / 1000, ease: 'linear' }} /></div>}
    </motion.section>
  );
}
