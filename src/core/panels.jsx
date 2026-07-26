// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · orbit panels
// System / Processes / Logs pull LIVE data from /api/core (mock
// fallback on error). Research / Code / Deploy / Browser stay mock.
// ─────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Search, Code, Globe, X } from './icons';
import { RESEARCH_RESULTS, CODE_SNIPPET, STRINGS } from './mockData';
import { getSystem, getProcesses } from './liveApi';

export function Panel({ icon: Icon, title, live, onClose, children, closing }) {
  return (
    <section className={`kry-panel ${closing ? 'is-closing' : ''}`}>
      <header className="kry-panel-head">
        <span className="kry-panel-title">
          <Icon size={14} aria-hidden="true" />
          {title}
          {live && <span className="kry-live" title="Live">● LIVE</span>}
        </span>
        <button type="button" className="kry-panel-x" onClick={onClose} aria-label="Close panel">
          <X size={13} aria-hidden="true" />
        </button>
      </header>
      <div className="kry-panel-body">{children}</div>
    </section>
  );
}

/* ── System (LIVE) ──────────────────────────────────────────────── */
function Spark({ value }) {
  const [bars, setBars] = useState(() => Array.from({ length: 26 }, () => 8 + Math.random() * 18));
  useEffect(() => {
    const iv = setInterval(
      () => setBars((b) => [...b.slice(1), 6 + Math.random() * 10 + (value || 0) * 0.22]),
      700
    );
    return () => clearInterval(iv);
  }, [value]);
  return (
    <div className="kry-spark" aria-hidden="true">
      {bars.map((h, i) => <i key={i} style={{ height: `${Math.min(32, h)}px` }} />)}
    </div>
  );
}

export function SystemPanel({ lang, onClose, closing }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getSystem().then((result) => { if (alive && result?.success) setData(result); });
    load();
    const interval = setInterval(load, 8000);
    return () => { alive = false; clearInterval(interval); };
  }, []);
  const healthy = data?.health === 'healthy';
  const available = data?.capacity === 'available';
  const score = data ? (healthy ? (available ? 94 : 76) : 38) : 60;
  return (
    <Panel icon={Cpu} title={STRINGS.panelTitles.system[lang]} live={!!data} onClose={onClose} closing={closing}>
      <div className="kry-metric">
        <div className="kry-metric-top">
          <span>{lang === 'id' ? 'Kesehatan platform' : 'Platform health'}</span>
          <b>{data ? (healthy ? (lang === 'id' ? 'Sehat' : 'Healthy') : (lang === 'id' ? 'Terganggu' : 'Degraded')) : '—'}</b>
        </div>
        <div className="kry-bar"><i style={{ width: `${score}%` }} /></div>
        <Spark value={score} />
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top">
          <span>{lang === 'id' ? 'Kapasitas' : 'Capacity'}</span>
          <b>{data ? (available ? (lang === 'id' ? 'Tersedia' : 'Available') : (lang === 'id' ? 'Sibuk' : 'Busy')) : '—'}</b>
        </div>
      </div>
    </Panel>
  );
}

/* ── Processes (LIVE) ───────────────────────────────────────────── */
export function ProcessesPanel({ lang, onClose, closing }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getProcesses().then((result) => { if (alive && result?.success) setData(result); });
    load();
    const interval = setInterval(load, 8000);
    return () => { alive = false; clearInterval(interval); };
  }, []);
  const healthy = data?.health === 'healthy';
  return (
    <Panel icon={Activity} title={STRINGS.panelTitles.processes[lang]} live={!!data} onClose={onClose} closing={closing}>
      <div className="kry-proc">
        <span className="kry-proc-name"><i className={`kry-online ${healthy ? '' : 'off'}`} />{lang === 'id' ? 'Layanan inti' : 'Core services'}</span>
        <span className="kry-proc-meta">{data ? (healthy ? (lang === 'id' ? 'sehat' : 'healthy') : (lang === 'id' ? 'terganggu' : 'degraded')) : '—'}</span>
      </div>
    </Panel>
  );
}

/* ── Research (mock) ────────────────────────────────────────────── */
export function ResearchPanel({ lang, query, onClose, closing }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 1200); return () => clearTimeout(t); }, []);
  return (
    <Panel icon={Search} title={`${STRINGS.panelTitles.research[lang]} · ${query || ''}`} onClose={onClose} closing={closing}>
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

/* ── Code (mock) ────────────────────────────────────────────────── */
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

/* ── Browser (mock) ─────────────────────────────────────────────── */
export function BrowserPanel({ lang, onClose, closing }) {
  return (
    <Panel icon={Globe} title={STRINGS.panelTitles.browser[lang]} onClose={onClose} closing={closing}>
      <div className="kry-dim" style={{ lineHeight: 1.7 }}>
        {lang === 'id' ? 'Menavigasi ' : 'Navigating '}
        <span className="kry-log-ac">/workspace</span>…<br />
        {lang === 'id'
          ? 'Halaman publik siap. Aku bisa membantu menjelajahi kontennya.'
          : 'The public page is ready. I can help explore its content.'}
      </div>
    </Panel>
  );
}
