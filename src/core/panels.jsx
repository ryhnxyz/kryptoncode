// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · orbit panels
// System / Processes / Logs pull LIVE data from /api/core (mock
// fallback on error). Research / Code / Deploy / Browser stay mock.
// ─────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Activity, Terminal, Search, Code, Rocket, Globe, X } from './icons';
import { VPS, SERVICES, DEPLOY_SCRIPTS, RESEARCH_RESULTS, CODE_SNIPPET, STRINGS } from './mockData';
import { getSystem, getProcesses, getLogs } from './liveApi';

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

function fmtUptime(ms) {
  if (!ms || ms < 0) return '—';
  const s = ms / 1000;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${(s / 3600).toFixed(0)}h`;
  return `${(s / 86400).toFixed(1)}d`;
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
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getSystem().then((r) => { if (alive && r && r.success) setD(r); });
    load();
    const iv = setInterval(load, 4000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  const live = !!d;
  const cpus = d?.cpus || VPS.cpus;
  const total = d?.totalMemMB || VPS.totalMemMB;
  const free = d?.freeMemMB ?? (VPS.totalMemMB - VPS.usedMemMB);
  const load = d?.loadavg || VPS.load;
  const host = d?.host || VPS.host;
  const uptimeD = d ? (d.uptimeSeconds / 86400).toFixed(1) : VPS.uptimeDays;
  const usedMB = total - free;
  const memPct = Math.round((usedMB / total) * 100);
  const cpuPct = Math.min(100, Math.round((load[0] / cpus) * 100));
  return (
    <Panel icon={Cpu} title={STRINGS.panelTitles.system[lang]} live={live} onClose={onClose} closing={closing}>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>CPU</span><b>{cpuPct}%</b></div>
        <div className="kry-bar"><i style={{ width: `${cpuPct}%` }} /></div>
        <Spark value={cpuPct} />
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>{lang === 'id' ? 'Memori' : 'Memory'}</span><b>{(usedMB / 1024).toFixed(1)} / {(total / 1024).toFixed(0)} GB</b></div>
        <div className="kry-bar"><i style={{ width: `${memPct}%` }} /></div>
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>Load</span><b>{load.map((n) => Number(n).toFixed(2)).join(' · ')}</b></div>
        <div className="kry-bar"><i style={{ width: `${Math.min(100, Math.round((load[0] / cpus) * 100) + 4)}%` }} /></div>
      </div>
      <div className="kry-metric">
        <div className="kry-metric-top"><span>Host</span><b>{host} · {uptimeD}d</b></div>
      </div>
    </Panel>
  );
}

/* ── Processes (LIVE) ───────────────────────────────────────────── */
export function ProcessesPanel({ lang, onClose, closing }) {
  const [procs, setProcs] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getProcesses().then((list) => {
        if (!alive || !list) return;
        setProcs(
          list.map((p) => ({
            name: p.name,
            mem: p.memMB != null ? `${p.memMB}mb` : '—',
            uptime: fmtUptime(p.uptimeMs),
            online: p.status === 'online',
          }))
        );
      });
    load();
    const iv = setInterval(load, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  const list = procs || SERVICES.map((s) => ({ ...s, online: true }));
  return (
    <Panel icon={Activity} title={STRINGS.panelTitles.processes[lang]} live={!!procs} onClose={onClose} closing={closing}>
      {list.map((s) => (
        <div className="kry-proc" key={s.name}>
          <span className="kry-proc-name"><i className={`kry-online ${s.online ? '' : 'off'}`} />{s.name}</span>
          <span className="kry-proc-meta">{s.uptime} · {s.mem}</span>
        </div>
      ))}
    </Panel>
  );
}

/* ── Live logs (LIVE) ───────────────────────────────────────────── */
function colorLog(line) {
  const l = line.toLowerCase();
  if (/error|fail|✗|28p01/.test(l)) return 'kry-log-er';
  if (/warn/.test(l)) return 'kry-log-wn';
  if (/✓|ok|200|success|online|healthy/.test(l)) return 'kry-log-ok';
  return 'kry-log-n';
}
export function LogsPanel({ lang, onClose, closing }) {
  const [lines, setLines] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getLogs('api_kryptoncode').then((ls) => { if (alive && ls) setLines(ls.slice(-8)); });
    load();
    const iv = setInterval(load, 2500);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  const shown = lines || [
    '[live] menghubungkan ke aliran log…',
    'GET /api/core/system → 200',
    'settlement worker tick complete',
  ];
  return (
    <Panel icon={Terminal} title={STRINGS.panelTitles.logs[lang]} live={!!lines} onClose={onClose} closing={closing}>
      <div className="kry-logbox">
        {shown.map((ln, i) => (
          <div className="kry-logline" key={i + ln.slice(0, 12)}>
            <span className={colorLog(ln)}>{ln}</span>
          </div>
        ))}
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

/* ── Deploy (mock timeline) ─────────────────────────────────────── */
export function DeployPanel({ lang, variant = 'backend', onDone, onClose, closing }) {
  const steps = DEPLOY_SCRIPTS[variant] || DEPLOY_SCRIPTS.backend;
  const [n, setN] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    if (n >= steps.length) {
      if (!doneRef.current) { doneRef.current = true; onDone && onDone(variant); }
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

/* ── Browser (mock) ─────────────────────────────────────────────── */
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
