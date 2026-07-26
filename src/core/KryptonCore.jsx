// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE
// Not a chatbot. A living intelligence at the center of the site.
// Docked bottom-right as a small black soul; tap it (or say
// "Hey Krypton") and the whole site dissolves into AI Space.
// Phase 1: mock + rule-based. Phase 2 swaps intentEngine for the
// real ai-agent bridge.
// ─────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Volume2, VolumeX, X } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { createOrbEngine } from './orbEngine';
import { createMicAnalyser, createNaturalSpeech, createWakeWord, createVoiceCapture } from './voice';
import { createCues } from './soundCues';
import * as liveApi from './liveApi';
import { interpret, REPLIES } from './intentEngine';
import { STRINGS, greeting } from './mockData';
import { SystemPanel, ProcessesPanel, LogsPanel, ResearchPanel, CodePanel, DeployPanel, BrowserPanel } from './panels';
import './aiCore.css';

const VOICE_OK_KEY = 'krypton_voice_ok';

export default function KryptonCore() {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const micRef = useRef(null);
  const speechRef = useRef(null);
  const wakeRef = useRef(null);
  const cuesRef = useRef(null);
  const restRef = useRef('idle');
  const proactiveRef = useRef(false);
  const openRef = useRef(false);
  const idleTimer = useRef(null);
  const exitRef = useRef(null);
  const historyRef = useRef([]);
  const chatAbortRef = useRef(null);
  const voiceModeRef = useRef(false);
  const captureRef = useRef(null);
  const startListenRef = useRef(null);
  const requestListenRef = useRef(null);
  const listeningRef = useRef(false);
  const streamingRef = useRef(false);
  const enterTimerRef = useRef(null);
  const listenTimerRef = useRef(null);
  const listenGenerationRef = useRef(0);
  const chatSessionRef = useRef(0);
  const speechSessionRef = useRef(0);
  const bargeTimerRef = useRef(null);
  const bargeLoudSinceRef = useRef(0);
  const bargeCooldownRef = useRef(0);
  const mountedRef = useRef(true);

  const [open, setOpen] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [panels, setPanels] = useState([]);           // [{id, query?, closing?}]
  const [youLine, setYouLine] = useState('');
  const [kryText, setKryText] = useState('');
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [stateSince, setStateSince] = useState(Date.now());
  const [elapsed, setElapsed] = useState('0.0s');
  const [streaming, setStreaming] = useState(false);

  /* ── boot: engine + factories ─────────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;
    const engine = createOrbEngine(canvasRef.current);
    engineRef.current = engine;
    micRef.current = createMicAnalyser();
    captureRef.current = createVoiceCapture(micRef.current, () => langRef.current, liveApi.API_BASE);
    speechRef.current = createNaturalSpeech(() => langRef.current, liveApi.API_BASE);
    cuesRef.current = createCues();
    wakeRef.current = createWakeWord(() => langRef.current, () => {
      if (!openRef.current) enterRef.current?.(true);
      else requestListenRef.current?.();
    });
    if (window.localStorage.getItem(VOICE_OK_KEY) === '1') {
      wakeRef.current.setEnabled(true);
    }
    // Unlock audio playback on the first real user gesture so the natural
    // neural voice can play later (wake word / streamed replies aren't gestures).
    const unlockOnce = () => {
      try { speechRef.current?.unlock?.(); cuesRef.current?.unlock?.(); } catch { /* noop */ }
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
    const t = setTimeout(() => setHintVisible(true), 1800);
    return () => {
      mountedRef.current = false;
      openRef.current = false;
      voiceModeRef.current = false;
      listeningRef.current = false;
      streamingRef.current = false;
      listenGenerationRef.current += 1;
      chatSessionRef.current += 1;
      speechSessionRef.current += 1;
      clearTimeout(t);
      clearTimeout(idleTimer.current);
      clearTimeout(enterTimerRef.current);
      clearTimeout(listenTimerRef.current);
      clearInterval(bargeTimerRef.current);
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
      try { chatAbortRef.current?.abort(); } catch { /* noop */ }
      captureRef.current?.cancel?.();
      wakeRef.current?.setEnabled(false);
      speechRef.current?.cancel();
      micRef.current?.disable();
      engine.destroy();
      document.body.classList.remove('kry-space-open');
    };
  }, []);

  /* ── orb state plumbing ───────────────────────────────────────── */
  const setOrb = useCallback((name) => {
    setOrbState(name);
    setStateSince(Date.now());
    engineRef.current?.setState(name);
    if (name !== 'idle' && name !== 'speaking') cuesRef.current?.state();
  }, []);

  const setStreamingState = useCallback((value) => {
    streamingRef.current = !!value;
    setStreaming(!!value);
  }, []);

  const clearScheduledListen = useCallback((invalidate = true) => {
    clearTimeout(listenTimerRef.current);
    listenTimerRef.current = null;
    if (invalidate) listenGenerationRef.current += 1;
  }, []);

  const hasLiveMicTrack = useCallback(() => {
    const tracks = micRef.current?.stream?.getAudioTracks?.() || [];
    return tracks.some((track) => track.readyState === 'live' && track.enabled !== false);
  }, []);

  // Schedule hands-free turn-taking only while the same voice generation is valid.
  // Capture startup can briefly race getUserMedia/MediaRecorder readiness, so retry
  // a few times with a capped backoff instead of silently leaving the orb idle.
  const scheduleListen = useCallback((delay = 350, maxRetries = 5) => {
    clearScheduledListen(true);
    const generation = listenGenerationRef.current;
    const attempt = async (retriesLeft, retryDelay) => {
      if (
        !mountedRef.current ||
        generation !== listenGenerationRef.current ||
        !openRef.current ||
        !voiceModeRef.current ||
        !captureRef.current?.supported
      ) return;
      if (listeningRef.current || captureRef.current?.active) return;
      if (streamingRef.current || speechRef.current?.isSpeaking?.()) {
        if (retriesLeft > 0) {
          listenTimerRef.current = setTimeout(() => attempt(retriesLeft - 1, Math.min(700, retryDelay * 1.5)), retryDelay);
        }
        return;
      }

      let ready = hasLiveMicTrack();
      if (!ready) {
        const enabled = await micRef.current?.enable();
        ready = !!enabled && hasLiveMicTrack();
      }
      if (ready) {
        engineRef.current?.setAudioSource(() => micRef.current?.getData());
        window.localStorage.setItem(VOICE_OK_KEY, '1');
      }
      if (
        !mountedRef.current ||
        generation !== listenGenerationRef.current ||
        !openRef.current ||
        !voiceModeRef.current
      ) return;

      const started = ready && await startListenRef.current?.(generation);
      if (!started && retriesLeft > 0 && generation === listenGenerationRef.current) {
        listenTimerRef.current = setTimeout(() => attempt(retriesLeft - 1, Math.min(700, retryDelay * 1.5)), retryDelay);
      } else if (!started && engineRef.current?.getState() !== 'speaking') {
        setOrb('idle');
      }
    };

    listenTimerRef.current = setTimeout(() => attempt(maxRetries, 140), Math.max(0, delay));
    return generation;
  }, [clearScheduledListen, hasLiveMicTrack, setOrb]);

  // Auto-close AI Space after 60s of no interaction → back to the small orb.
  const IDLE_MS = 60000;
  const bumpActivity = useCallback(() => {
    if (!openRef.current) return;
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => exitRef.current?.(), IDLE_MS);
  }, []);

  useEffect(() => {
    if (orbState === 'completed' || orbState === 'celebrating') {
      const t = setTimeout(() => setOrb('idle'), orbState === 'celebrating' ? 2600 : 3200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [orbState, setOrb]);

  useEffect(() => {
    if (!open) return undefined;
    const iv = setInterval(() => setElapsed(((Date.now() - stateSince) / 1000).toFixed(1) + 's'), 100);
    return () => clearInterval(iv);
  }, [open, stateSince]);

  /* ── speak with persona ───────────────────────────────────────── */
  const sayReply = useCallback((text, rest = 'idle', after) => {
    clearScheduledListen(true);
    const speechSession = ++speechSessionRef.current;
    restRef.current = rest;
    setKryText(text);
    speechRef.current?.speak(text, {
      onstart: () => {
        if (!mountedRef.current || speechSession !== speechSessionRef.current || !openRef.current) return;
        engineRef.current?.setSpeaking(true);
        setOrbState('speaking');
        engineRef.current?.setState('speaking');
        bumpActivity();
      },
      onend: () => {
        if (!mountedRef.current || speechSession !== speechSessionRef.current || !openRef.current) return;
        engineRef.current?.setSpeaking(false);
        setOrb(restRef.current);
        bumpActivity();
        after?.();
        if (voiceModeRef.current && captureRef.current?.supported) scheduleListen();
      },
    });
  }, [bumpActivity, clearScheduledListen, scheduleListen, setOrb]);

  /* ── panels ───────────────────────────────────────────────────── */
  const addPanel = useCallback((id, meta) => {
    setPanels((ps) => {
      if (ps.some((p) => p.id === id && !p.closing)) return ps;
      return [...ps.filter((p) => p.id !== id), { id, ...(meta || {}) }];
    });
  }, []);
  const removePanel = useCallback((id) => {
    setPanels((ps) => ps.map((p) => (p.id === id ? { ...p, closing: true } : p)));
    setTimeout(() => setPanels((ps) => ps.filter((p) => p.id !== id)), 460);
  }, []);
  const clearPanels = useCallback(() => {
    setPanels((ps) => ps.map((p) => ({ ...p, closing: true })));
    setTimeout(() => setPanels([]), 460);
  }, []);

  const onDeployDone = useCallback((variant) => {
    const rep = variant === 'restartBot' ? REPLIES.restartDone : REPLIES.deployDone;
    setOrb('completed');
    sayReply(rep[langRef.current], 'celebrating');
  }, [sayReply, setOrb]);

  /* ── listening + hands-free turn-taking ───────────────────────── */
  const cancelInFlight = useCallback((preserveListenGeneration = false) => {
    clearScheduledListen(!preserveListenGeneration);
    chatSessionRef.current += 1;
    speechSessionRef.current += 1;
    try { chatAbortRef.current?.abort(); } catch { /* noop */ }
    chatAbortRef.current = null;
    speechRef.current?.cancel();
    engineRef.current?.setSpeaking(false);
    setStreamingState(false);
  }, [clearScheduledListen, setStreamingState]);

  const stopListen = useCallback(() => {
    captureRef.current?.stop(false);
  }, []);

  const startListen = useCallback(async (scheduledGeneration = null) => {
    if (
      scheduledGeneration !== null &&
      scheduledGeneration !== listenGenerationRef.current
    ) return false;
    if (!mountedRef.current || !openRef.current || !voiceModeRef.current || !captureRef.current?.supported) return false;
    if (listeningRef.current || captureRef.current?.active) return true;

    // A direct or scheduled listen is also a barge-in: stale chat/TTS callbacks
    // are invalidated before capture starts, so they cannot reopen the mic later.
    cancelInFlight(scheduledGeneration !== null);
    captureRef.current?.cancel?.();
    wakeRef.current?.setEnabled(false);
    bargeCooldownRef.current = performance.now() + 700;
    const captureGeneration = listenGenerationRef.current;

    let ready = hasLiveMicTrack();
    if (!ready) {
      const ok = await micRef.current?.enable();
      ready = !!ok && hasLiveMicTrack();
    }
    if (ready) {
      engineRef.current?.setAudioSource(() => micRef.current?.getData());
      window.localStorage.setItem(VOICE_OK_KEY, '1');
    }
    if (
      !ready ||
      !mountedRef.current ||
      captureGeneration !== listenGenerationRef.current ||
      !openRef.current ||
      !voiceModeRef.current
    ) {
      if (mountedRef.current && openRef.current && captureGeneration === listenGenerationRef.current) {
        listeningRef.current = false;
        setListening(false);
        if (engineRef.current?.getState() !== 'speaking') setOrb('idle');
      }
      return false;
    }

    const started = captureRef.current?.start(
      (text) => {
        if (!mountedRef.current || captureGeneration !== listenGenerationRef.current) return;
        listeningRef.current = false;
        setListening(false);
        if (text) {
          voiceModeRef.current = true;
          setInput('');
          handleRef.current?.(text); // → orchestrator (thinking → reply → natural voice)
        } else {
          if (engineRef.current?.getState() === 'listening' || engineRef.current?.getState() === 'thinking') setOrb('idle');
          if (openRef.current && voiceModeRef.current) scheduleListen(500, 3);
          else if (window.localStorage.getItem(VOICE_OK_KEY) === '1') wakeRef.current?.setEnabled(true);
        }
      },
      (phase) => {
        if (phase !== 'transcribing' || captureGeneration !== listenGenerationRef.current) return;
        listeningRef.current = false;
        setListening(false);
        setOrb('thinking');
      }
    );
    if (started) {
      listeningRef.current = true;
      setListening(true);
      setOrb('listening');
      bumpActivity();
      return true;
    }

    listeningRef.current = false;
    setListening(false);
    if (engineRef.current?.getState() !== 'speaking') setOrb('idle');
    return false;
  }, [bumpActivity, cancelInFlight, hasLiveMicTrack, scheduleListen, setOrb]);
  useEffect(() => { startListenRef.current = startListen; }, [startListen]);

  const requestListen = useCallback(() => {
    try { speechRef.current?.unlock?.(); } catch { /* noop */ }
    voiceModeRef.current = true;
    const pending = startListenRef.current?.();
    const requestGeneration = listenGenerationRef.current;
    Promise.resolve(pending).then((started) => {
      if (
        !started &&
        requestGeneration === listenGenerationRef.current &&
        !listeningRef.current &&
        !captureRef.current?.active &&
        openRef.current &&
        voiceModeRef.current
      ) scheduleListen(140, 4);
    });
  }, [scheduleListen]);
  useEffect(() => { requestListenRef.current = requestListen; }, [requestListen]);

  // Unified talk toggle for taps / keys. Refs are authoritative so clicking the
  // orb while React still renders a stale listening/thinking frame barges in now.
  const talk = useCallback(() => {
    try { speechRef.current?.unlock?.(); } catch { /* noop */ }
    if (listeningRef.current || captureRef.current?.active) stopListen();
    else requestListen();
  }, [requestListen, stopListen]);

  // Passive barge-in while the core is working. Require sustained, clearly
  // voiced energy so ambient noise does not cancel useful work. TTS/capture are
  // hard gates, and the cooldown suppresses the tail of the user's last turn.
  useEffect(() => {
    if (!open) return undefined;
    const watched = new Set(['thinking', 'reading', 'searching', 'coding', 'browsing']);
    clearInterval(bargeTimerRef.current);
    bargeTimerRef.current = setInterval(() => {
      const now = performance.now();
      const eligible =
        openRef.current &&
        voiceModeRef.current &&
        watched.has(engineRef.current?.getState()) &&
        !speechRef.current?.isSpeaking?.() &&
        !listeningRef.current &&
        !captureRef.current?.active &&
        now >= bargeCooldownRef.current;
      if (!eligible) {
        bargeLoudSinceRef.current = 0;
        return;
      }
      const level = micRef.current?.getData?.()?.level || 0;
      if (level >= 0.13) {
        if (!bargeLoudSinceRef.current) bargeLoudSinceRef.current = now;
        if (now - bargeLoudSinceRef.current >= 220) {
          bargeLoudSinceRef.current = 0;
          bargeCooldownRef.current = now + 900;
          requestListenRef.current?.();
        }
      } else if (level < 0.09) {
        bargeLoudSinceRef.current = 0;
      }
    }, 45);
    return () => {
      clearInterval(bargeTimerRef.current);
      bargeTimerRef.current = null;
      bargeLoudSinceRef.current = 0;
    };
  }, [open]);

  /* ── enter / exit AI Space ────────────────────────────────────── */
  const enter = useCallback((withVoice = true) => {
    if (openRef.current) return;
    clearScheduledListen(true);
    const enterGeneration = listenGenerationRef.current;
    openRef.current = true;
    setOpen(true);
    setHintVisible(false);
    document.body.classList.add('kry-space-open');
    engineRef.current?.setPlacement('center');
    engineRef.current?.nudge();
    cuesRef.current?.unlock();
    cuesRef.current?.enter();
    speechRef.current?.unlock?.();
    wakeRef.current?.setEnabled(false);
    voiceModeRef.current = !!withVoice;
    micRef.current?.enable().then((ok) => {
      if (ok && openRef.current && enterGeneration === listenGenerationRef.current) {
        engineRef.current?.setAudioSource(() => micRef.current?.getData());
        window.localStorage.setItem(VOICE_OK_KEY, '1');
      }
    });
    bumpActivity();
    clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      if (!openRef.current || enterGeneration !== listenGenerationRef.current) return;
      if (voiceModeRef.current) {
        // Voice entry should feel immediate: show the greeting visually and open
        // the mic instead of making the user wait for a spoken intro to finish.
        setKryText(langRef.current === 'id' ? 'Aku mendengarkan.' : 'I am listening.');
        setOrb('idle');
        scheduleListen(0, 5);
      } else {
        sayReply(greeting(langRef.current), 'idle');
      }
    }, 260);
  }, [bumpActivity, clearScheduledListen, sayReply, scheduleListen, setOrb]);
  const enterRef = useRef(null);
  useEffect(() => { enterRef.current = enter; }, [enter]);

  const exit = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    voiceModeRef.current = false;
    listeningRef.current = false;
    bargeLoudSinceRef.current = 0;
    clearTimeout(idleTimer.current);
    clearTimeout(enterTimerRef.current);
    clearScheduledListen(true);
    clearInterval(bargeTimerRef.current);
    bargeTimerRef.current = null;
    chatSessionRef.current += 1;
    speechSessionRef.current += 1;
    try { chatAbortRef.current?.abort(); } catch { /* noop */ }
    chatAbortRef.current = null;
    captureRef.current?.cancel?.();
    speechRef.current?.cancel();
    setStreamingState(false);
    setListening(false);
    setOpen(false);
    document.body.classList.remove('kry-space-open');
    engineRef.current?.setPlacement('dock');
    engineRef.current?.setSpeaking(false);
    setToast(null);
    clearPanels();
    setYouLine('');
    setKryText('');
    setOrb('idle');
    cuesRef.current?.exit();
    if (window.localStorage.getItem(VOICE_OK_KEY) === '1') wakeRef.current?.setEnabled(true);
  }, [clearPanels, clearScheduledListen, setOrb, setStreamingState]);
  useEffect(() => { exitRef.current = exit; }, [exit]);

  /* ── orchestrator: live /api/core/chat over SSE ───────────────── */
  const streamChatToCore = useCallback((message) => {
    clearTimeout(enterTimerRef.current);
    clearScheduledListen(true);
    try { chatAbortRef.current?.abort(); } catch { /* noop */ }
    speechRef.current?.cancel();
    engineRef.current?.setSpeaking(false);
    const chatSession = ++chatSessionRef.current;
    const speechSession = ++speechSessionRef.current;
    const ac = new AbortController();
    chatAbortRef.current = ac;
    setStreamingState(true);
    setKryText('');
    setOrb('thinking');
    bargeCooldownRef.current = performance.now() + 700;
    let buf = '';
    let fedIdx = 0;
    let terminalHandled = false;
    const isCurrent = () =>
      mountedRef.current &&
      openRef.current &&
      chatSession === chatSessionRef.current &&
      speechSession === speechSessionRef.current &&
      !ac.signal.aborted;

    // Stream the spoken reply sentence-by-sentence so Krypton starts talking
    // after the first sentence instead of waiting for the whole answer.
    speechRef.current?.beginStream({
      onstart: () => {
        if (!isCurrent()) return;
        engineRef.current?.setSpeaking(true);
        setOrbState('speaking');
        engineRef.current?.setState('speaking');
        bumpActivity();
      },
      onend: () => {
        if (!isCurrent()) return;
        engineRef.current?.setSpeaking(false);
        setStreamingState(false);
        setOrb('idle');
        bumpActivity();
        if (voiceModeRef.current && captureRef.current?.supported) scheduleListen();
      },
    });
    const feedSentences = (final) => {
      if (!isCurrent()) return;
      const seg = buf.slice(fedIdx);
      const re = /[^.!?…\n]*[.!?…\n]+/g;
      let m; let last = 0;
      while ((m = re.exec(seg))) { const s = m[0].trim(); if (s) speechRef.current?.feed(s); last = re.lastIndex; }
      if (last) fedIdx += last;
      if (final) { const tail = buf.slice(fedIdx).trim(); if (tail) speechRef.current?.feed(tail); fedIdx = buf.length; }
    };
    const stageToState = (stage, agent) => {
      if (stage === 'agent') {
        return ({ system: 'reading', 'hermes-engineer': 'coding', browser: 'browsing', research: 'searching', general: 'thinking' })[agent] || 'thinking';
      }
      return 'thinking';
    };
    const recover = (msg) => {
      if (!isCurrent() || terminalHandled) return;
      terminalHandled = true;
      chatAbortRef.current = null;
      setStreamingState(false);
      speechSessionRef.current += 1;
      speechRef.current?.cancel();
      engineRef.current?.setSpeaking(false);
      setOrb('idle');
      sayReply(msg, 'idle');
    };
    liveApi.streamChat({
      message,
      lang: langRef.current,
      history: historyRef.current,
      signal: ac.signal,
      handlers: {
        stage: (d) => { if (!isCurrent() || terminalHandled) return; if (engineRef.current?.getState() !== 'speaking') setOrb(stageToState(d.stage, d.agent)); bumpActivity(); },
        panel: (d) => {
          if (!isCurrent() || terminalHandled) return;
          if (d.action === 'show') addPanel(d.id, d.id === 'research' ? { query: message.slice(0, 42) } : undefined);
          else if (d.action === 'hide') removePanel(d.id);
        },
        token: (d) => { if (!isCurrent() || terminalHandled) return; buf += d.t || ''; setKryText(buf); feedSentences(false); bumpActivity(); },
        done: (d) => {
          if (!isCurrent() || terminalHandled) return;
          terminalHandled = true;
          chatAbortRef.current = null;
          setStreamingState(false);
          const text = String((d && d.text) || buf).trim();
          buf = text;
          setKryText(text);
          feedSentences(true);
          speechRef.current?.endStream();
          if (text) {
            historyRef.current = [...historyRef.current, { role: 'user', content: message }, { role: 'assistant', content: text }].slice(-6);
          }
        },
        error: () => recover(langRef.current === 'id' ? 'Maaf, koneksi ke inti terganggu. Coba lagi ya.' : 'Sorry, the core connection dropped. Try again.'),
      },
    }).catch(() => recover(langRef.current === 'id' ? 'Aku belum bisa menjangkau server inti sekarang.' : 'I could not reach the core server just now.'));
  }, [addPanel, bumpActivity, clearScheduledListen, removePanel, sayReply, scheduleListen, setOrb, setStreamingState]);

  /* ── instant local intents: live platform facts without an LLM wait ── */
  const runInstantIntent = useCallback((local) => {
    if (!local || !['greeting', 'thanks', 'system', 'processes', 'logs'].includes(local.intent)) return false;
    cancelInFlight();
    const session = ++chatSessionRef.current;
    const isCurrent = () => mountedRef.current && openRef.current && session === chatSessionRef.current;
    (local.show || []).forEach((id) => addPanel(id));

    if (local.intent === 'greeting' || local.intent === 'thanks') {
      sayReply(local.reply[langRef.current] || local.reply.id, 'idle');
      return true;
    }
    if (local.intent === 'logs') {
      sayReply(
        langRef.current === 'id'
          ? 'Log terbaru sudah kubuka. Aku tetap mendengarkan.'
          : 'The latest logs are open. I am still listening.',
        'idle'
      );
      return true;
    }

    setOrb('reading');
    const request = local.intent === 'system' ? liveApi.getSystem() : liveApi.getProcesses();
    Promise.resolve(request).then((data) => {
      if (!isCurrent()) return;
      let text;
      if (local.intent === 'system' && data?.success) {
        const usedGB = ((data.totalMemMB - data.freeMemMB) / 1024).toFixed(1);
        const totalGB = (data.totalMemMB / 1024).toFixed(1);
        const load = Array.isArray(data.loadavg) ? data.loadavg[0] : null;
        text = langRef.current === 'id'
          ? `Sistem sehat. Beban CPU ${load ?? 'normal'}, RAM terpakai ${usedGB} dari ${totalGB} gigabyte.`
          : `The system is healthy. CPU load is ${load ?? 'normal'}, with ${usedGB} of ${totalGB} gigabytes of memory in use.`;
      } else if (local.intent === 'processes' && Array.isArray(data)) {
        const online = data.filter((item) => item.status === 'online').length;
        text = langRef.current === 'id'
          ? `${online} dari ${data.length} layanan sedang online.`
          : `${online} of ${data.length} services are online.`;
      } else {
        text = langRef.current === 'id'
          ? 'Data live belum bisa kubaca. Coba lagi sebentar.'
          : 'I could not read the live data just now. Try again shortly.';
      }
      sayReply(text, 'idle');
    });
    return true;
  }, [addPanel, cancelInFlight, sayReply, setOrb]);

  /* ── command handling: instant local where safe, else orchestrator ── */
  const handleCommand = useCallback((raw) => {
    const q = (raw || '').trim();
    if (!q) return;
    setYouLine(q);
    bumpActivity();
    const local = interpret(q);
    if (local?.exit) { exit(); return; }
    if (local && (local.intent === 'hide' || local.intent === 'hideAll')) {
      if (local.hideAll) clearPanels();
      (local.hide || []).forEach(removePanel);
      cancelInFlight();
      sayReply(local.reply[langRef.current] || local.reply.id, 'idle');
      return;
    }
    if (runInstantIntent(local)) return;
    streamChatToCore(q);
  }, [bumpActivity, cancelInFlight, clearPanels, exit, removePanel, runInstantIntent, sayReply, streamChatToCore]);
  const handleRef = useRef(null);
  useEffect(() => { handleRef.current = handleCommand; }, [handleCommand]);

  /* ── proactive intelligence ───────────────────────────────────── */
  useEffect(() => {
    if (!open || proactiveRef.current) return undefined;
    const t = setTimeout(() => {
      proactiveRef.current = true;
      setToast(STRINGS.toast[langRef.current]);
      setOrb('warning');
      cuesRef.current?.warn();
      setTimeout(() => {
        setOrbState((s) => {
          if (s === 'warning') { engineRef.current?.setState('idle'); return 'idle'; }
          return s;
        });
      }, 2600);
    }, 9000);
    return () => clearTimeout(t);
  }, [open, setOrb]);

  const onToastAction = useCallback(() => {
    setToast(null);
    setYouLine(lang === 'id' ? '(proaktif) restart xaut-swap-bot' : '(proactive) restart xaut-swap-bot');
    setOrb('deploying');
    addPanel('restartBot');
  }, [addPanel, lang, setOrb]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 14000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── keyboard ─────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && openRef.current) exit();
      if (e.code === 'Space' && openRef.current && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        bumpActivity();
        talk();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bumpActivity, exit, talk]);

  /* ── derived ──────────────────────────────────────────────────── */
  const S = useMemo(() => ({
    hint: STRINGS.dockHint[lang],
    placeholder: STRINGS.placeholder[lang],
    context: STRINGS.contextLine[lang],
    chips: STRINGS.chips[lang],
    stateLabel: STRINGS.stateLabels[orbState]?.[lang] || orbState,
  }), [lang, orbState]);

  const leftPanels = panels.filter((_, i) => i % 2 === 0);
  const rightPanels = panels.filter((_, i) => i % 2 === 1);

  const renderPanel = (p) => {
    const common = { lang, closing: p.closing, onClose: () => removePanel(p.id) };
    switch (p.id) {
      case 'system': return <SystemPanel key={p.id} {...common} />;
      case 'processes': return <ProcessesPanel key={p.id} {...common} />;
      case 'logs': return <LogsPanel key={p.id} {...common} />;
      case 'research': return <ResearchPanel key={p.id} query={p.query} {...common} />;
      case 'code': return <CodePanel key={p.id} {...common} />;
      case 'deploy': return <DeployPanel key={p.id} variant="backend" onDone={onDeployDone} {...common} />;
      case 'restartBot': return <DeployPanel key={p.id} variant="restartBot" onDone={onDeployDone} {...common} />;
      case 'browser': return <BrowserPanel key={p.id} {...common} />;
      default: return null;
    }
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <>
      <canvas ref={canvasRef} className="kry-orb-canvas" aria-hidden="true" />

      {/* docked hit area */}
      {!open && (
        <button
          type="button"
          className="kry-orb-hit"
          aria-label="Krypton AI Core"
          onClick={() => enter(true)}
        />
      )}
      {!open && (
        <div className={`kry-dock-hint ${hintVisible ? 'show' : ''}`} aria-hidden="true">
          {S.hint[0]}<br /><b>{S.hint[1]}</b>
        </div>
      )}

      {/* AI SPACE */}
      <div
        className={`kry-space ${open ? 'open' : ''}`}
        aria-hidden={!open}
        onPointerDown={bumpActivity}
        onKeyDownCapture={bumpActivity}
        onMouseMove={bumpActivity}
      >
        <div className="kry-dimension" />

        <header className="kry-space-head">
          <div className="kry-space-title"><span>◈</span> KRYPTON AI CORE</div>
          <div className="kry-space-ctx">{S.context}</div>
        </header>

        <div className="kry-space-ctl">
          <button
            type="button"
            className={`kry-ctl ${soundOn ? 'active' : ''}`}
            aria-label="Sound"
            onClick={() => {
              setSoundOn((v) => {
                cuesRef.current?.setMuted(v);
                return !v;
              });
            }}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button type="button" className="kry-ctl" aria-label="Exit AI Space" onClick={exit}>
            <X size={16} />
          </button>
        </div>

        {/* orbit panels */}
        <div className="kry-cols">
          <div className="kry-col">{leftPanels.map(renderPanel)}</div>
          <div className="kry-col right">{rightPanels.map(renderPanel)}</div>
        </div>

        {/* tap the core to talk */}
        <button
          type="button"
          className={`kry-core-hit ${listening ? 'listening' : ''}`}
          aria-label={listening ? 'Stop listening' : 'Talk to Krypton'}
          onClick={talk}
        />

        {/* state chip */}
        <div className="kry-state-chip">
          <span className="kry-state-dot" data-state={orbState} />
          <span>{S.stateLabel}</span>
          <span className="kry-state-time">{elapsed}</span>
        </div>

        {/* conversation */}
        <div className="kry-convo">
          <div className="kry-you">{youLine ? `“${youLine}”` : ''}</div>
          <div className="kry-reply" aria-live="polite">
            <span className={streaming || orbState === 'speaking' ? 'kry-caret' : ''}>{kryText}</span>
          </div>
        </div>

        {/* prompt dock */}
        <div className="kry-dock">
          <div className={`kry-prompt ${listening ? 'hot' : ''}`}>
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); bumpActivity(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) {
                  voiceModeRef.current = false;
                  listeningRef.current = false;
                  clearScheduledListen(true);
                  captureRef.current?.cancel?.();
                  setListening(false);
                  handleCommand(input.trim());
                  setInput('');
                }
              }}
              placeholder={S.placeholder}
              aria-label="Ask Krypton"
            />
            <button
              type="button"
              className={`kry-mic ${listening ? 'on' : ''}`}
              aria-label="Voice input"
              onClick={talk}
            >
              <Mic size={17} />
            </button>
          </div>
          <div className="kry-chips">
            {S.chips.map(([label, cmd]) => (
              <button key={cmd} type="button" className="kry-chip" onClick={() => handleCommand(cmd)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* proactive toast */}
        {toast && (
          <div className="kry-toast">
            <span className="kry-toast-i">◈</span>
            <span className="kry-toast-tx">
              {toast.text}
              <small>{toast.sub}</small>
            </span>
            <button type="button" className="kry-toast-act" onClick={onToastAction}>{toast.action}</button>
          </div>
        )}
      </div>
    </>
  );
}
