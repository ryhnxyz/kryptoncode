import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Brain,
  Check,
  Copy,
  DollarSign,
  Eye,
  RefreshCw,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API_BASE = 'https://api.kryptoncode.xyz/api/pool'
const CONNECT_URL = 'https://base.kryptoncode.xyz/v1'

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n || 0)
}

function fmtCost(c) {
  if (c >= 1) return '$' + c.toFixed(2)
  return '$' + (c || 0).toFixed(4)
}

function fmtCtx(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n || 0)
}

function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return Math.floor(diff) + 's'
  if (diff < 3600) return Math.floor(diff / 60) + 'm'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return d.toLocaleDateString()
}

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="pool-card pool-kpi">
      <div className="pool-kpi-top">
        <span className="pool-kpi-label">{label}</span>
        <span className="pool-kpi-icon">
          <Icon size={14} strokeWidth={1.5} />
        </span>
      </div>
      <div className="pool-kpi-value">{value}</div>
      {sub && <div className="pool-kpi-sub">{sub}</div>}
    </div>
  )
}

function CapTag({ icon: Icon, label, active }) {
  return (
    <span className={`pool-cap ${active ? 'pool-cap--active' : ''}`}>
      <Icon size={11} strokeWidth={1.5} />
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  const ok = status === 'ok'
  return (
    <span className={`pool-status ${ok ? 'pool-status--ok' : 'pool-status--err'}`}>
      {ok ? 'OK' : status || 'err'}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="pool-btn pool-btn--mono"
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.5} />}
      <span>{copied ? 'Copied!' : text}</span>
    </button>
  )
}

function SectionHeading({ title, meta }) {
  return (
    <div className="pool-section-head">
      <h2 className="pool-section-title">{title}</h2>
      {meta && <span className="pool-section-meta">{meta}</span>}
    </div>
  )
}

export default function Pool() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  if (loading) {
    return (
      <main className="pool-page">
        <div className="pool-loading">Loading AI Pool…</div>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="pool-page">
        <div className="pool-error">
          <p>Failed to load pool data</p>
          <span>{error}</span>
          <button className="pool-btn" onClick={loadData}>
            Try again
          </button>
        </div>
      </main>
    )
  }

  const stats = data?.stats || {}
  const models = Array.isArray(data?.models) ? data.models : []
  const usageDaily = data?.usageDaily || []
  const usageRecent = data?.usageRecent || []
  const lifetime = stats.lifetime || {}
  const today = stats.today || {}

  const chartData = [...usageDaily].reverse().map((d) => ({
    date: (d.dateKey || '').slice(5),
    dateKey: d.dateKey,
    requests: d.requests || 0,
    cost: Number((d.cost || 0).toFixed(4)),
  }))

  return (
    <main className="pool-page">
      {/* Header */}
      <header className="pool-header">
        <div>
          <span className="pool-eyebrow">KryptonCode / Shared Infrastructure</span>
          <h1 className="pool-title">AI Pool</h1>
          <p className="pool-subtitle">
            Live view of the models, usage, and capacity powering KryptonCode's shared AI
            infrastructure.
          </p>
        </div>
        <div className="pool-header-right">
          <span className="pool-live">
            <span className="pool-live-dot" />
            Live · {lastUpdated || '—'}
          </span>
          <button
            className="pool-btn pool-btn--icon"
            onClick={loadData}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={refreshing ? 'pool-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Connection bar */}
      <div className="pool-card pool-conn">
        <div className="pool-conn-item">
          <span className="pool-conn-label">API Base URL</span>
          <CopyButton text={CONNECT_URL} />
        </div>
        <div className="pool-conn-divider" />
        <div className="pool-conn-item">
          <span className="pool-conn-label">Status</span>
          <span className="pool-conn-status">
            <span className="pool-live-dot" />
            Operational
          </span>
        </div>
        <a className="pool-btn pool-btn--outline" href={CONNECT_URL} target="_blank" rel="noreferrer">
          Endpoint <ArrowUpRight size={13} strokeWidth={1.5} />
        </a>
      </div>

      {/* KPIs */}
      <div className="pool-kpi-grid">
        <KpiCard
          icon={Activity}
          label="Total Requests"
          value={fmt(lifetime.requests)}
          sub={`${fmt(lifetime.promptTokens)} prompt tokens`}
        />
        <KpiCard
          icon={Zap}
          label="Today"
          value={fmt(today.requests)}
          sub={`${fmtCost(today.cost)} spent today`}
        />
        <KpiCard
          icon={Boxes}
          label="Models"
          value={String(models.length)}
          sub="powered by KryptonCode"
        />
        <KpiCard
          icon={DollarSign}
          label="Lifetime Cost"
          value={fmtCost(lifetime.cost)}
          sub={`${fmt(lifetime.completionTokens)} completion tokens`}
        />
      </div>

      {/* Chart */}
      <section>
        <SectionHeading title="Daily Usage" meta={`${usageDaily.length} days`} />
        <div className="pool-card pool-chart-wrap">
          <div className="pool-chart-head">
            <span className="pool-chart-title">Requests & cost trend</span>
            <div className="pool-chart-legend">
              <span>
                <i style={{ background: 'var(--chart-1)' }} /> Requests
              </span>
              <span>
                <i style={{ background: 'var(--chart-2)' }} /> Cost
              </span>
            </div>
          </div>
          {chartData.length ? (
            <div className="pool-chart">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="poolReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--card-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    yAxisId="req"
                    tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <YAxis yAxisId="cost" orientation="right" hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius)',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.dateKey || ''}
                  />
                  <Area
                    yAxisId="req"
                    type="monotone"
                    dataKey="requests"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#poolReq)"
                  />
                  <Area
                    yAxisId="cost"
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="pool-empty">No usage data yet</div>
          )}
        </div>
      </section>

      {/* Models */}
      <section>
        <SectionHeading title="Available Models" meta={`${models.length} models`} />
        {models.length ? (
          <div className="pool-models-grid">
            {models.map((m, i) => (
              <div key={i} className="pool-card pool-model">
                <div className="pool-model-head">
                  <span className="pool-model-id">{m.id}</span>
                  <span className="pool-model-owner">{m.owned_by}</span>
                </div>
                <div className="pool-model-caps">
                  <CapTag icon={Eye} label="Vision" active={m.vision} />
                  <CapTag icon={Wrench} label="Tools" active={m.tools} />
                  <CapTag icon={Brain} label="Reasoning" active={m.reasoning} />
                </div>
                <div className="pool-model-meta">
                  <span>
                    <em>ctx</em> {fmtCtx(m.contextWindow)}
                  </span>
                  <span>
                    <em>max</em> {fmtCtx(m.maxOutput)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pool-card pool-empty">No models available</div>
        )}
      </section>

      {/* Recent requests */}
      <section>
        <SectionHeading title="Recent Requests" meta={`${usageRecent.length} recent`} />
        {usageRecent.length ? (
          <div className="pool-card pool-table-wrap">
            <div className="pool-table-scroll">
              <table className="pool-table">
                <thead>
                  <tr>
                    {['Time', 'Model', 'Provider', 'Prompt', 'Completion', 'Cached', 'Cost', 'Status'].map(
                      (h) => (
                        <th key={h}>{h}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {usageRecent.map((r, i) => (
                    <tr key={i}>
                      <td className="pool-mono">{fmtTime(r.timestamp)}</td>
                      <td className="pool-mono">{r.model || '—'}</td>
                      <td>{r.provider || '—'}</td>
                      <td className="pool-mono">{fmt(r.promptTokens)}</td>
                      <td className="pool-mono">{fmt(r.completionTokens)}</td>
                      <td className="pool-mono pool-dim">{fmt(r.cachedTokens)}</td>
                      <td className="pool-mono">{fmtCost(r.cost)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="pool-mobile-cards">
              {usageRecent.map((r, i) => (
                <div key={i} className="pool-mobile-card">
                  <div className="pool-mobile-card-top">
                    <span className="pool-mono">{r.model || '—'}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="pool-mobile-card-mid">
                    <span>{r.provider || '—'}</span>
                    <span className="pool-mono">{fmtTime(r.timestamp)}</span>
                  </div>
                  <div className="pool-mobile-card-grid">
                    <div>
                      <span>prompt</span>
                      <span className="pool-mono">{fmt(r.promptTokens)}</span>
                    </div>
                    <div>
                      <span>compl</span>
                      <span className="pool-mono">{fmt(r.completionTokens)}</span>
                    </div>
                    <div>
                      <span>cached</span>
                      <span className="pool-mono">{fmt(r.cachedTokens)}</span>
                    </div>
                    <div>
                      <span>cost</span>
                      <span className="pool-mono">{fmtCost(r.cost)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pool-card pool-empty">No recent requests</div>
        )}
      </section>
    </main>
  )
}
