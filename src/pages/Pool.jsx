import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Cpu, Zap, DollarSign, Server, Boxes, Copy, Check } from 'lucide-react';

const API_BASE = 'https://api.kryptoncode.xyz/api/pool';

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n || 0);
}

function fmtCost(c) {
  if (c >= 100) return '$' + c.toFixed(2);
  if (c >= 1) return '$' + c.toFixed(2);
  return '$' + (c || 0).toFixed(4);
}

function fmtCtx(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n || 0);
}

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return Math.floor(diff) + 's';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return d.toLocaleDateString();
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Icon size={14} style={{ color: accent || 'var(--ink-3)' }} />
        <span style={{
          fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.03em',
          textTransform: 'uppercase', color: 'var(--ink-3)',
        }}>{label}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 500,
        letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      {sub && <div style={{
        fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem',
        fontVariantNumeric: 'tabular-nums',
      }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status, backoffLevel }) {
  const config = {
    active: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)', label: 'Active' },
    rate_limited: { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)', label: `Rate Limited L${backoffLevel || ''}` },
    unavailable: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)', label: 'Unavailable' },
    disabled: { bg: 'rgba(120,113,108,0.1)', color: '#78716c', border: 'rgba(120,113,108,0.2)', label: 'Disabled' },
  };
  const c = config[status] || config.disabled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.25rem 0.625rem', borderRadius: '9999px',
      fontSize: '0.6875rem', fontWeight: 500, whiteSpace: 'nowrap',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {c.label}
    </span>
  );
}

function CapTag({ label, active }) {
  return (
    <span style={{
      fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '9999px',
      fontWeight: 500,
      background: active ? 'rgba(168,162,158,0.08)' : 'transparent',
      border: active ? '1px solid rgba(168,162,158,0.12)' : '1px solid var(--card-border)',
      color: active ? 'var(--text-primary)' : 'var(--ink-3)',
    }}>{label}</span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
        background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)',
        padding: '0.25rem 0.625rem', borderRadius: 'var(--radius)',
        color: 'var(--text-primary)', cursor: 'pointer',
        transition: 'border-color 150ms ease-out',
      }}
    >
      {copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} style={{ color: 'var(--ink-3)' }} />}
      {copied ? 'Copied!' : text}
    </button>
  );
}

export default function Pool() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: '0.875rem' }}>Loading AI Pool...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ color: '#f87171', fontSize: '0.875rem' }}>Failed to load pool data</div>
        <div style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>{error}</div>
        <button onClick={loadData} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8125rem' }}>Retry</button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const providers = data?.providers || [];
  const models = Array.isArray(data?.models) ? data.models : [];
  const usageDaily = data?.usageDaily || [];
  const usageRecent = data?.usageRecent || [];
  const lifetime = stats.lifetime || {};
  const today = stats.today || {};

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '2rem', borderBottom: '1px solid var(--card-border)', marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '0.375rem',
            background: 'linear-gradient(135deg, oklch(0.62 0.18 200), oklch(0.55 0.2 250))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: '1rem', color: '#1A1A1A', letterSpacing: '-0.02em',
          }}>K</div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--text-primary)' }}>AI Pool</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>Free shared AI infrastructure</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{lastUpdated || '—'}</span>
        </div>
      </div>

      {/* Connection info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1rem 1.25rem', background: 'var(--card-bg)',
        border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink-3)', fontWeight: 500 }}>API Base URL</span>
        <CopyButton text="https://base.kryptoncode.xyz/v1" />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink-3)', fontWeight: 500 }}>Status</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#34d399' }}>Operational</span>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem', marginBottom: '2rem',
      }}>
        <StatCard icon={Activity} label="Total Requests" value={fmt(lifetime.requests)} sub={`${fmt(lifetime.promptTokens)} prompt tokens`} />
        <StatCard icon={Zap} label="Today" value={fmt(today.requests)} sub={fmtCost(today.cost) + ' today'} accent="#fbbf24" />
        <StatCard icon={Server} label="Active Providers" value={`${stats.activeProviders - stats.rateLimitedProviders}/${stats.activeProviders}`} sub={stats.rateLimitedProviders > 0 ? `${stats.rateLimitedProviders} rate-limited` : 'all healthy'} accent="#34d399" />
        <StatCard icon={Boxes} label="Models Available" value={String(models.length)} sub={`across ${new Set(models.map(m => m.owned_by)).size} provider(s)`} accent="#60a5fa" />
        <StatCard icon={DollarSign} label="Lifetime Cost" value={fmtCost(lifetime.cost)} sub={`${fmt(lifetime.completionTokens)} completion tokens`} accent="#f87171" />
      </div>

      {/* Providers */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>PROVIDER POOLS</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{providers.length} connections</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {providers.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center',
              gap: '1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)', padding: '0.875rem 1rem',
              transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '0.375rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
              }}>{(p.name || '?').slice(0, 2).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                  {p.name} <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: '0.75rem' }}>· {p.provider}</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  {p.id.slice(0, 8)}
                  {p.lastError && <span style={{ marginLeft: '0.5rem', color: '#f87171' }}>· {p.lastError}</span>}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>P{p.priority}</span>
              <StatusBadge status={p.status} backoffLevel={p.backoffLevel} />
            </div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>AVAILABLE MODELS</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{models.length} models</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem',
        }}>
          {models.map((m, i) => (
            <div key={i} style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)', padding: '1rem',
              transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{m.id}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.owned_by}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                <CapTag label="Vision" active={m.vision} />
                <CapTag label="Tools" active={m.tools} />
                <CapTag label="Reasoning" active={m.reasoning} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6875rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                <span><b style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>ctx</b> {fmtCtx(m.contextWindow)}</span>
                <span><b style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>max</b> {fmtCtx(m.maxOutput)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage chart */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>USAGE (DAILY REQUESTS)</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{usageDaily.length} days</span>
        </div>
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)', padding: '1.25rem', overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, minWidth: 400 }}>
            {(() => {
              const sorted = [...usageDaily].reverse();
              const maxReqs = Math.max(...sorted.map(d => d.requests || 0), 1);
              return sorted.map((d, i) => {
                const pct = ((d.requests || 0) / maxReqs * 100).toFixed(1);
                return (
                  <div key={i} title={`${d.dateKey}: ${fmt(d.requests)} requests, ${fmtCost(d.cost)}`}
                    style={{
                      flex: 1, minWidth: 12, position: 'relative',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)',
                      borderRadius: '0.375rem 0.375rem 0 0', cursor: 'default',
                      transition: 'background-color 150ms ease-out',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  >
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: '#60a5fa', borderRadius: '0.375rem 0.375rem 0 0',
                      opacity: 0.8, height: `${pct}%`, transition: 'height 300ms ease-out',
                    }} />
                  </div>
                );
              });
            })()}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem', minWidth: 400 }}>
            {[...usageDaily].reverse().map((d, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 12, textAlign: 'center',
                fontSize: '0.625rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
              }}>{d.dateKey.slice(5)}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent requests */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>RECENT REQUESTS</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{usageRecent.length} recent</span>
        </div>
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  {['Time', 'Model', 'Provider', 'Prompt', 'Completion', 'Cached', 'Cost', 'Status'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.625rem 1rem', fontWeight: 500,
                      fontSize: '0.6875rem', letterSpacing: '0.03em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', borderBottom: '1px solid var(--card-border)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usageRecent.map((r, i) => (
                  <tr key={i} style={{ transition: 'background-color 100ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fmtTime(r.timestamp)}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{r.model || '—'}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>{r.provider || '—'}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.promptTokens)}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.completionTokens)}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.cachedTokens)}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmtCost(r.cost)}</td>
                    <td style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--card-border)', color: r.status === 'ok' ? '#34d399' : '#f87171', fontWeight: 500 }}>{r.status === 'ok' ? 'OK' : r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
