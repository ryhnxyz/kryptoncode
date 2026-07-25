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
import { createMicAnalyser, createSpeech, createNaturalSpeech, createRecognizer, createWakeWord, voiceSupport } from './voice';
import { createCues } from './soundCues';
import * as liveApi from './liveApi';
import { interpret, REPLIES } from './intentEngine';
import { STRINGS, greeting } from './mockData';
import { SystemPanel, ProcessesPanel, LogsPanel, ResearchPanel, CodePanel, DeployPanel, BrowserPanel } from './panels';
import './aiCore.css';

const VOICE_OK_KEY = 'krypton_voice_ok';

/* typewriter line for Krypton's replies */
function TypeLine({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!text) return undefined;
    const iv = setInterval(() => {
      setN((v) => {
        if (v >= text.length) { clearInterval(iv); return v; }
        return v + 1;
      });
    }, 16);
    return () => clearInterval(iv);
  }, [text]);
  const done = n >= (text?.length || 0);
  return (
    <div className="kry-reply" aria-live="polite">
      <span className={done ? '' : 'kry-caret'}>{text?.slice(0, n)}</span>
    </div>
  );
}

export default function KryptonCore() {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'id';
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const micRef = useRef(null);
  const speechRef = useRef(null);
  const recRef = useRef(null);
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
  const finalGotRef = useRef(false);

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
    const engine = createOrbEngine(canvasRef.current);
    engineRef.current = engine;
    micRef.current = createMicAnalyser();
    speechRef.current = createNaturalSpeech(() => langRef.current, liveApi.API_BASE);
    cuesRef.current = createCues();
    wakeRef.current = createWakeWord(() => langRef.current, () => {
      if (!openRef.current) enterRef.current?.(true);
      else startListenRef.current?.();
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
      clearTimeout(t);
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
      engine.destroy();
      micRef.current?.disable();
      wakeRef.current?.setEnabled(false);
      speechRef.current?.cancel();
    };
  }, []);

  /* ── orb state plumbing ───────────────────────────────────────── */
  const setOrb = useCallback((name) => {
    setOrbState(name);
    setStateSince(Date.now());
    engineRef.current?.setState(name);
    if (name !== 'idle' && name !== 'speaking') cuesRef.current?.state();
  }, []);

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
    restRef.current = rest;
    setKryText(text);
    speechRef.current?.speak(text, {
      onstart: () => {
        engineRef.current?.setSpeaking(true);
        setOrbState('speaking');
        engineRef.current?.setState('speaking');
        bumpActivity();
      },
      onend: () => {
        engineRef.current?.setSpeaking(false);
        setOrb(restRef.current);
        bumpActivity();
        after?.();
        // hands-free turn-taking: after Krypton speaks, open the mic again
        if (openRef.current && voiceModeRef.current && voiceSupport.recognition) {
          setTimeout(() => startListenRef.current?.(), 250);
        }
      },
    });
  }, [setOrb, bumpActivity]);

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

  /* ── listening (push-to-talk) ─────────────────────────────────── */
  const stopListen = useCallback(() => { recRef.current?.stop(); }, []);
  const startListen = useCallback(() => {
    if (!voiceSupport.recognition) return;
    if (recRef.current?.active) return;
    speechRef.current?.cancel();
    engineRef.current?.setSpeaking(false);
    wakeRef.current?.setEnabled(false);
    finalGotRef.current = false;
    const begin = () => {
      recRef.current = createRecognizer(() => langRef.current, {
        onstate: (on) => {
          setListening(on);
          if (on) setOrb('listening');
          else {
            if (engineRef.current?.getState() === 'listening') setOrb('idle');
            // no speech captured → go back to wake-word standby
            if (!finalGotRef.current && window.localStorage.getItem(VOICE_OK_KEY) === '1') {
              wakeRef.current?.setEnabled(true);
            }
          }
        },
        onpartial: (t) => { setInput(t); bumpActivity(); },
        onfinal: (t) => {
          finalGotRef.current = true;
          setInput('');
          if (t) { voiceModeRef.current = true; handleRef.current?.(t); }
        },
      });
      recRef.current.start();
    };
    setTimeout(begin, 160); // let the wake recognizer release the mic first
  }, [setOrb, bumpActivity]);
  const startListenRef = useRef(null);
  useEffect(() => { startListenRef.current = startListen; }, [startListen]);

  // Unified talk toggle for taps / keys — unlocks audio + marks voice mode.
  const talk = useCallback(() => {
    try { speechRef.current?.unlock?.(); } catch { /* noop */ }
    if (listening) { stopListen(); }
    else { voiceModeRef.current = true; startListen(); }
  }, [listening, startListen, stopListen]);

  /* ── enter / exit AI Space ────────────────────────────────────── */
  const enter = useCallback((withVoice = false) => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    setHintVisible(false);
    document.body.classList.add('kry-space-open');
    engineRef.current?.setPlacement('center');
    engineRef.current?.nudge();
    cuesRef.current?.unlock();
    cuesRef.current?.enter();
    speechRef.current?.unlock?.();
    voiceModeRef.current = !!withVoice;
    micRef.current?.enable().then((ok) => {
      if (ok) {
        engineRef.current?.setAudioSource(() => micRef.current?.getData());
        window.localStorage.setItem(VOICE_OK_KEY, '1');
      }
    });
    bumpActivity();
    setTimeout(() => {
      sayReply(greeting(langRef.current), 'idle');
    }, 620);
  }, [sayReply, bumpActivity]);
  const enterRef = useRef(null);
  useEffect(() => { enterRef.current = enter; }, [enter]);

  const exit = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    clearTimeout(idleTimer.current);
    try { chatAbortRef.current?.abort(); } catch { /* noop */ }
    setStreaming(false);
    voiceModeRef.current = false;
    setOpen(false);
    document.body.classList.remove('kry-space-open');
    engineRef.current?.setPlacement('dock');
    speechRef.current?.cancel();
    engineRef.current?.setSpeaking(false);
    stopListen();
    setToast(null);
    clearPanels();
    setYouLine('');
    setKryText('');
    setOrb('idle');
    cuesRef.current?.exit();
    if (window.localStorage.getItem(VOICE_OK_KEY) === '1') wakeRef.current?.setEnabled(true);
  }, [clearPanels, setOrb, stopListen]);
  useEffect(() => { exitRef.current = exit; }, [exit]);

  /* ── orchestrator: live /api/core/chat over SSE ───────────────── */
  const streamChatToCore = useCallback((message) => {
    try { chatAbortRef.current?.abort(); } catch { /* noop */ }
    const ac = new AbortController();
    chatAbortRef.current = ac;
    setStreaming(true);
    setKryText('');
    setOrb('thinking');
    let buf = '';
    const stageToState = (stage, agent) => {
      if (stage === 'agent') {
        return ({ system: 'reading', 'hermes-engineer': 'coding', browser: 'browsing', research: 'searching', general: 'thinking' })[agent] || 'thinking';
      }
      return 'thinking';
    };
    const oops = (msg) => { setStreaming(false); sayReply(msg, 'idle'); };
    liveApi.streamChat({
      message,
      lang: langRef.current,
      history: historyRef.current,
      signal: ac.signal,
      handlers: {
        stage: (d) => { setOrb(stageToState(d.stage, d.agent)); bumpActivity(); },
        panel: (d) => {
          if (d.action === 'show') addPanel(d.id, d.id === 'research' ? { query: message.slice(0, 42) } : undefined);
          else if (d.action === 'hide') removePanel(d.id);
        },
        token: (d) => { buf += d.t || ''; setKryText(buf); bumpActivity(); },
        done: (d) => {
          setStreaming(false);
          const text = (d && d.text) || buf;
          historyRef.current = [...historyRef.current, { role: 'user', content: message }, { role: 'assistant', content: text }].slice(-6);
          sayReply(text, 'idle');
        },
        error: () => oops(langRef.current === 'id' ? 'Maaf, koneksi ke inti terganggu. Coba lagi ya.' : 'Sorry, the core connection dropped. Try again.'),
      },
    }).catch(() => oops(langRef.current === 'id' ? 'Aku belum bisa menjangkau server inti sekarang.' : 'I could not reach the core server just now.'));
  }, [addPanel, bumpActivity, removePanel, sayReply, setOrb]);

  /* ── command handling: instant local for hide/exit, else orchestrator ── */
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
      setStreaming(false);
      sayReply(local.reply[langRef.current] || local.reply.id, 'idle');
      return;
    }
    streamChatToCore(q);
  }, [bumpActivity, clearPanels, exit, removePanel, sayReply, streamChatToCore]);
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
          onClick={() => enter(false)}
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
