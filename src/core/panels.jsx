// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · orbit panels
// Interface elements the AI conjures around itself. All mock data,
// styled with the krypton design system.
// ─────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Activity, Terminal, Search, Code, Rocket, Globe, X } from './icons';
import { VPS, SERVICES, LOG_LINES, DEPLOY_SCRIPTS, RESEARCH_RESULTS, CODE_SNIPPET, STRINGS } from './mockData';

export function Panel({ icon: Icon, title, onClose, children, closing }) {
  return (
    <section className={`kry-panel ${closing ? 'is-closing' : ''}`}>
      <header className="kry-panel-head">
        <span className="kry-panel-title">
          <Icon size={14} aria-hidden="true" />
          {title}
        </span>
        <button type="button" className="kry-panel-x" onClick={onClose} aria-label="Close panel">
          <X size={13} aria-hidden="true" />
        </button>
      </header>
      <div className="kry-panel-body">{children}</div>
    </section>
  );
}

/* ── System metrics ─────────────────────────────────────────────── */
function Spark() {
  const [bars, setBars] = useState(() => Array.from({ length: 26 }, () => 8 + Math.random() * 22));
  useEffect(() => {
    const iv = setInterval(() => setBars((b) => [...b.slice(1), 8 + Math.random() * 22]), 700);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="kry-spark" aria-hidden="true">
      {bars.map((h, i) => <i key={i} style={{ height: `${h}px` }} />)}
    </div>
  );
}

export function SystemPanel({ lang, onClose, closing }) {
  const [cpu, setCpu] = useState(11);
  useEffect(() => {
    const iv = setInterval(() => setCpu((c) => Math.max(3, Math.min(60, c + Math.round((Math.random() - 0.5) * 10)))), 1500);
    return () => clearInterval(iv);
  }, []);
  const memPct = Math.round((VPS.usedMemMB / VPS.totalMemMB) * 100);
  return (
    <Panel icon={Cpu} title={STRINGS.panelTitles.system[lang]} onClose={onClose} closing={closing}>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>CPU</span><b>{cpu}%</b></div>
        <div className="kry-bar"><i style={{ width: `${cpu}%` }} /></div>
        <Spark />
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>{lang === 'id' ? 'Memori' : 'Memory'}</span><b>{(VPS.usedMemMB / 1024).toFixed(1)} / 12 GB</b></div>
        <div className="kry-bar"><i style={{ width: `${memPct}%` }} /></div>
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>Load</span><b>{VPS.load.join(' · ')}</b></div>
        <div className="kry-bar"><i style={{ width: `${Math.round((VPS.load[0] / VPS.cpus) * 100) + 6}%` }} /></div>
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>Host</span><b>{VPS.host} · {VPS.uptimeDays}d up</b></div>
      </div>
    </Panel>
  );
}

/* ── Processes ──────────────────────────────────────────────────── */
export function ProcessesPanel({ lang, onClose, closing }) {
  return (
    <Panel icon={Activity} title={STRINGS.panelTitles.processes[lang]} onClose={onClose} closing={closing}>
      {SERVICES.map((s) => (
        <div className="kry-proc" key={s.name}>
          <span className="kry-proc-name"><i className="kry-online" />{s.name}</span>
          <span className="kry-proc-meta">{s.uptime} · {s.mem}</span>
        </div>
      ))}
    </Panel>
  );
}

/* ── Live logs ──────────────────────────────────────────────────── */
export function LogsPanel({ lang, onClose, closing }) {
  const [lines, setLines] = useState([]);
  const idx = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setLines((l) => {
        const next = [...l, { key: idx.current, parts: LOG_LINES[idx.current % LOG_LINES.length] }];
        idx.current += 1;
        return next.slice(-7);
      });
    }, 900);
    return () => clearInterval(iv);
  }, []);
  return (
    <Panel icon={Terminal} title={STRINGS.panelTitles.logs[lang]} onClose={onClose} closing={closing}>
      <div className="kry-logbox">
        {lines.map((ln) => (
          <div className="kry-logline" key={ln.key}>
            {ln.parts.map(([cls, txt], i) => <span key={i} className={`kry-log-${cls}`}>{txt}</span>)}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Research ───────────────────────────────────────────────────── */
export function ResearchPanel({ lang, query, onClose, closing }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1300);
    return () => clearTimeout(t);
  }, []);
  return (
    <Panel icon={Search} title={`${STRINGS.panelTitles.research[lang]} · ${query}`} onClose={onClose} closing={closing}>
      {!ready ? (
        <div className="kry-dim">{lang === 'id' ? 'Menelusuri web & dokumentasi…' : 'Searching the web & docs…'}</div>
      ) : (
        RESEARCH_RESULTS.map((r) => (
          <div className="kry-res" key={r.title}>
            <div className="kry-res-title">{r.title}</div>
            <div className="kry-res-src">{r.source}</div>
            <div className="kry-res-sum">{r.summary[lang]}</div>
          </div>
        ))
      )}
    </Panel>
  );
}

/* ── Code draft ─────────────────────────────────────────────────── */
export function CodePanel({ lang, onClose, closing }) {
  return (
    <Panel icon={Code} title={STRINGS.panelTitles.code[lang]} onClose={onClose} closing={closing}>
      <pre className="kry-code">
        {CODE_SNIPPET.map((line, i) => (
          <div key={i}>{line.map(([cls, txt], j) => <span key={j} className={`kry-tok-${cls}`}>{txt}</span>)}</div>
        ))}
      </pre>
    </Panel>
  );
}

/* ── Deploy (drives its own timeline) ───────────────────────────── */
export function DeployPanel({ lang, variant = 'backend', onDone, onClose, closing }) {
  const steps = DEPLOY_SCRIPTS[variant] || DEPLOY_SCRIPTS.backend;
  const [n, setN] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    if (n >= steps.length) {
      if (!doneRef.current) { doneRef.current = true; onDone?.(variant); }
      return undefined;
    }
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 500 : 620);
    return () => clearTimeout(t);
  }, [n, steps.length, onDone, variant]);
  const title = variant === 'restartBot' ? STRINGS.panelTitles.restartBot[lang] : STRINGS.panelTitles.deploy[lang];
  return (
    <Panel icon={Rocket} title={title} onClose={onClose} closing={closing}>
      <div className="kry-logbox">
        {steps.slice(0, n).map((s, i) => (
          <div className="kry-logline" key={i}><span className={`kry-log-${s.kind}`}>{s.text}</span></div>
        ))}
        {n < steps.length && <div className="kry-logline kry-dim">…</div>}
      </div>
    </Panel>
  );
}

/* ── Browser ────────────────────────────────────────────────────── */
export function BrowserPanel({ lang, onClose, closing }) {
  return (
    <Panel icon={Globe} title={STRINGS.panelTitles.browser[lang]} onClose={onClose} closing={closing}>
      <div className="kry-dim" style={{ lineHeight: 1.7 }}>
        {lang === 'id' ? 'Menavigasi ' : 'Navigating '}
        <span className="kry-log-ac">/console/deploy</span>…<br />
        {lang === 'id'
          ? 'Halaman dirender. Aku bisa mengisi formulir atau memicu aksi dari sini.'
          : 'Rendered. I can fill forms or trigger actions from here.'}
      </div>
    </Panel>
  );
}
