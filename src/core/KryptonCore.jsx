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
import { createMicAnalyser, createSpeech, createRecognizer, createWakeWord, voiceSupport } from './voice';
import { createCues } from './soundCues';
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

  /* ── boot: engine + factories ─────────────────────────────────── */
  useEffect(() => {
    const engine = createOrbEngine(canvasRef.current);
    engineRef.current = engine;
    micRef.current = createMicAnalyser();
    speechRef.current = createSpeech(() => langRef.current);
    cuesRef.current = createCues();
    wakeRef.current = createWakeWord(() => langRef.current, () => {
      if (!openRef.current) enterRef.current?.(true);
      else startListenRef.current?.();
    });
    if (window.localStorage.getItem(VOICE_OK_KEY) === '1') {
      wakeRef.current.setEnabled(true);
    }
    const t = setTimeout(() => setHintVisible(true), 1800);
    return () => {
      clearTimeout(t);
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
      },
      onend: () => {
        engineRef.current?.setSpeaking(false);
        setOrb(restRef.current);
        after?.();
      },
    });
  }, [setOrb]);

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
    speechRef.current?.cancel();
    engineRef.current?.setSpeaking(false);
    wakeRef.current?.setEnabled(false);
    recRef.current = createRecognizer(() => langRef.current, {
      onstate: (on) => {
        setListening(on);
        if (on) setOrb('listening');
        else {
          if (engineRef.current?.getState() === 'listening') setOrb('idle');
          if (window.localStorage.getItem(VOICE_OK_KEY) === '1') wakeRef.current?.setEnabled(true);
        }
      },
      onpartial: (t) => setInput(t),
      onfinal: (t) => { setInput(''); if (t) handleRef.current?.(t); },
    });
    recRef.current.start();
  }, [setOrb]);
  const startListenRef = useRef(null);
  useEffect(() => { startListenRef.current = startListen; }, [startListen]);

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
    micRef.current?.enable().then((ok) => {
      if (ok) {
        engineRef.current?.setAudioSource(() => micRef.current?.getData());
        window.localStorage.setItem(VOICE_OK_KEY, '1');
      }
    });
    setTimeout(() => {
      sayReply(greeting(langRef.current), 'idle', () => {
        if (withVoice) startListenRef.current?.();
      });
    }, 620);
  }, [sayReply]);
  const enterRef = useRef(null);
  useEffect(() => { enterRef.current = enter; }, [enter]);

  const exit = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
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

  /* ── command handling ─────────────────────────────────────────── */
  const handleCommand = useCallback((raw) => {
    const res = interpret(raw);
    if (!res) return;
    setYouLine(raw);
    if (res.exit) { exit(); return; }
    const apply = () => {
      if (res.hideAll) clearPanels();
      (res.hide || []).forEach(removePanel);
      (res.show || []).forEach((id) => addPanel(id, id === 'research' ? { query: res.arg || 'vite 8' } : undefined));
      if (res.state) setOrb(res.state);
      else if (res.acting) setOrb(res.acting);
      const text = res.reply[langRef.current] || res.reply.id;
      if (res.replyDelay) setTimeout(() => sayReply(text, res.rest || 'idle'), res.replyDelay);
      else sayReply(text, res.rest || 'idle');
    };
    if (res.think) {
      setOrb('thinking');
      setTimeout(apply, 700 + Math.random() * 500);
    } else apply();
  }, [addPanel, clearPanels, exit, removePanel, sayReply, setOrb]);
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
        if (listening) stopListen(); else startListen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit, listening, startListen, stopListen]);

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
      <div className={`kry-space ${open ? 'open' : ''}`} aria-hidden={!open}>
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
          onClick={() => (listening ? stopListen() : startListen())}
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
          <TypeLine text={kryText} />
        </div>

        {/* prompt dock */}
        <div className="kry-dock">
          <div className={`kry-prompt ${listening ? 'hot' : ''}`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) {
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
              onClick={() => (listening ? stopListen() : startListen())}
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
