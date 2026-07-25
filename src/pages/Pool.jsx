import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Brain,
  Check,
  Copy,
  Database,
  DollarSign,
  Eye,
  Gauge,
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
import { useLanguage } from '../contexts/LanguageContext'
import { buildPoolDemoData } from '../data/poolData'

const API_URL = 'https://api.kryptoncode.xyz/api/pool'
const CONNECT_URL = 'https://base.kryptoncode.xyz/v1'
const BOT_URL = 'https://t.me/kryptoncode_bot?start=genapi'
const FETCH_TIMEOUT = 6500

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
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return Math.floor(diff) + 's'
  if (diff < 3600) return Math.floor(diff / 60) + 'm'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return d.toLocaleDateString()
}

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
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

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  const shown = label || text
  return (
    <button
      className="pool-btn pool-btn--mono"
      type="button"
      title={text}
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.5} />}
      <span>{copied ? 'Copied!' : shown}</span>
    </button>
  )
}

function CapacityBar({ capacity, t }) {
  if (!capacity) return null
  const used = Number(
    capacity.usedPct != null
      ? capacity.usedPct
      : Math.max(0, Math.min(100, 100 - Number(capacity.remainingPct ?? 0))),
  )
  const total = Number(capacity.accountsTotal || 0)
  const healthy = Number(capacity.accountsHealthy || 0)
  const exhausted = Number(capacity.accountsExhausted || 0)
  const tokensUsed = Number(capacity.tokensUsed || 0)
  const tone = used <= 40 ? 'good' : used <= 75 ? 'warn' : 'crit'
  return (
    <div className="pool-card pool-capacity">
      <div className="pool-capacity-head">
        <div>
          <span className="pool-eyebrow">{t('pool.capacityEyebrow')}</span>
          <h3 className="pool-capacity-title">{t('pool.capacityTitle')}</h3>
          <p className="pool-capacity-text">{t('pool.capacityText')}</p>
        </div>
        <div className={`pool-capacity-pct pool-capacity-pct--${tone}`}>
          <Gauge size={18} strokeWidth={1.5} />
          <span>{used.toFixed(used % 1 === 0 ? 0 : 1)}%</span>
        </div>
      </div>

      <div
        className="pool-capacity-bar"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`pool-capacity-fill pool-capacity-fill--${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, used))}%` }}
        />
      </div>

      <div className="pool-capacity-meta">
        <div>
          <span className="pool-capacity-meta-label">{t('pool.healthy')}</span>
          <span className="pool-capacity-meta-value pool-mono">
            {healthy}/{total}
          </span>
        </div>
        <div>
          <span className="pool-capacity-meta-label">{t('pool.exhausted')}</span>
          <span className="pool-capacity-meta-value pool-mono">
            {exhausted}/{total}
          </span>
        </div>
        <div>
          <span className="pool-capacity-meta-label">{t('pool.tokensUsed')}</span>
          <span className="pool-capacity-meta-value pool-mono">{fmt(tokensUsed)}</span>
        </div>
        <div>
          <span className="pool-capacity-meta-label">{t('pool.grokRequests')}</span>
          <span className="pool-capacity-meta-value pool-mono">{fmt(capacity.requests || 0)}</span>
        </div>
      </div>
    </div>
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

function PoolSkeleton() {
  return (
    <main className="pool-page page-content" aria-busy="true">
      <div className="skeleton pool-skeleton-intro" />
      <div className="pool-kpi-grid" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton pool-skeleton-kpi" />
        ))}
      </div>
      <div className="skeleton pool-skeleton-block" />
    </main>
  )
}

export default function Pool() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(API_URL, { signal: timeoutSignal(FETCH_TIMEOUT) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setIsDemo(false)
    } catch {
      // Backend unreachable — fall back to the bundled demo dataset.
      setData(buildPoolDemoData())
      setIsDemo(true)
    } finally {
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  if (loading || !data) return <PoolSkeleton />

  const stats = data?.stats || {}
  const models = (Array.isArray(data?.models) ? data.models : []).filter((m) => {
    const id = String(m?.id || m?.apiName || '').toLowerCase()
    const owned = String(m?.owned_by || '').toLowerCase()
    const prov = String(m?.provider || '').toLowerCase()
    return (
      id.includes('grok') ||
      owned.includes('grok') ||
      owned === 'krypton' ||
      owned === 'xai' ||
      prov.includes('grok') ||
      prov === 'gcli' ||
      prov === 'xai'
    )
  })
  const usageDaily = data?.usageDaily || []
  const usageRecent = (data?.usageRecent || []).filter((r) => {
    const p = String(r?.provider || '').toLowerCase()
    const m = String(r?.model || '').toLowerCase()
    return p.includes('grok') || m.includes('grok')
  })
  const lifetime = stats.lifetime || {}
  const today = stats.today || {}
  const capacity = data?.capacity || null

  const chartData = [...usageDaily].reverse().map((d) => ({
    date: (d.dateKey || '').slice(5),
    dateKey: d.dateKey,
    requests: d.requests || 0,
    cost: Number((d.cost || 0).toFixed(4)),
  }))

  const tableHeaders = [
    t('pool.time'),
    'Model',
    'Provider',
    'Prompt',
    'Completion',
    'Cached',
    t('pool.cost'),
    t('pool.status'),
  ]

  return (
    <main className="pool-page page-content">
      {/* Intro — same visual language as the Products page */}
      <section className="products-intro pool-intro animate-slide-up" aria-labelledby="pool-heading">
        <div className="products-kicker">
          <span className="products-status-dot" aria-hidden="true" />
          {t('pool.kicker')}
        </div>
        <div className="products-intro-grid">
          <h1 id="pool-heading">{t('pool.headline')}</h1>
          <div className="products-intro-copy">
            <p>{t('pool.intro')}</p>
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer">
              {t('pool.getKey')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="products-separator" />
        <div className="products-meta pool-meta">
          <span>{t('pool.meta')}</span>
          <div className="pool-meta-actions">
            <span className={`pool-pill ${isDemo ? 'pool-pill--demo' : 'pool-pill--live'}`}>
              <span className="pool-pill-dot" aria-hidden="true" />
              {isDemo ? t('pool.demo') : `${t('pool.live')} · ${lastUpdated || '—'}`}
            </span>
            <button
              className="pool-icon-btn"
              type="button"
              onClick={loadData}
              disabled={refreshing}
              aria-label={t('pool.refresh')}
            >
              <RefreshCw size={14} strokeWidth={1.5} className={refreshing ? 'pool-spin' : ''} />
            </button>
          </div>
          <span>
            {models.length} {t('pool.modelsCount')}
          </span>
        </div>
      </section>

      {/* Demo-mode notice */}
      {isDemo && (
        <div className="pool-demo-note animate-slide-up" role="status">
          <Database size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>{t('pool.demoNotice')}</span>
          <button type="button" onClick={loadData} disabled={refreshing}>
            {t('pool.retryLive')}
          </button>
        </div>
      )}

      {/* Connect card — endpoint + API key via Telegram bot */}
      <section className="pool-card pool-connect animate-slide-up delay-100" aria-labelledby="pool-connect-title">
        <div className="pool-connect-copy">
          <span className="pool-eyebrow">{t('pool.accessEyebrow')}</span>
          <h2 id="pool-connect-title" className="pool-connect-title">{t('pool.accessTitle')}</h2>
          <p className="pool-connect-text">{t('pool.accessText')}</p>
          <ol className="pool-connect-steps">
            <li>{t('pool.step1')}</li>
            <li>
              {t('pool.step2')} <code>/genapi</code>
            </li>
            <li>{t('pool.step3')}</li>
          </ol>
        </div>
        <div className="pool-connect-panel">
          <div className="pool-endpoint">
            <span className="pool-endpoint-label">{t('pool.endpoint')}</span>
            <CopyButton text={CONNECT_URL} label="base.kryptoncode.xyz/v1" />
          </div>
          <div className="pool-endpoint">
            <span className="pool-endpoint-label">{t('pool.status')}</span>
            <span className={`pool-conn-status ${isDemo ? 'pool-conn-status--demo' : ''}`}>
              <span className="pool-pill-dot" aria-hidden="true" />
              {isDemo ? t('pool.demo') : t('pool.operational')}
            </span>
          </div>
          <a className="btn-white-pill pool-bot-cta" href={BOT_URL} target="_blank" rel="noopener noreferrer">
            {t('pool.openBot')} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <CopyButton text="/genapi" />
        </div>
      </section>

      {/* Capacity across all grok accounts */}
      <CapacityBar capacity={capacity} t={t} />

      {/* KPIs */}
      <div className="pool-kpi-grid">
        <KpiCard
          icon={Activity}
          label={t('pool.totalRequests')}
          value={fmt(lifetime.requests)}
          sub={`${fmt(lifetime.promptTokens)} ${t('pool.promptTokens')}`}
        />
        <KpiCard
          icon={Zap}
          label={t('pool.today')}
          value={fmt(today.requests)}
          sub={`${fmtCost(today.cost)} ${t('pool.spentToday')}`}
        />
        <KpiCard
          icon={Boxes}
          label={t('pool.models')}
          value={String(models.length)}
          sub={
            capacity
              ? `${capacity.accountsHealthy || 0}/${capacity.accountsTotal || 0} ${t('pool.accountsHealthy')}`
              : t('pool.poweredBy')
          }
        />
        <KpiCard
          icon={DollarSign}
          label={t('pool.lifetimeCost')}
          value={fmtCost(lifetime.cost)}
          sub={`${fmt(lifetime.completionTokens)} ${t('pool.completionTokens')}`}
        />
      </div>

      {/* Chart */}
      <section className="pool-section">
        <SectionHeading title={t('pool.dailyUsage')} meta={`${usageDaily.length} ${t('pool.days')}`} />
        <div className="pool-card pool-chart-wrap">
          <div className="pool-chart-head">
            <span className="pool-chart-title">{t('pool.chartTitle')}</span>
            <div className="pool-chart-legend">
              <span>
                <i style={{ background: 'var(--chart-1)' }} /> {t('pool.requests')}
              </span>
              <span>
                <i style={{ background: 'var(--chart-2)' }} /> {t('pool.cost')}
              </span>
            </div>
          </div>
          {chartData.length ? (
            <div className="pool-chart">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="poolReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
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
                    width={40}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <YAxis yAxisId="cost" orientation="right" hide />
                  <Tooltip
                    contentStyle={{
                      background: 'rgb(20, 20, 21)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
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
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="cost"
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="none"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="pool-empty">{t('pool.noUsage')}</div>
          )}
        </div>
      </section>

      {/* Models */}
      <section className="pool-section">
        <SectionHeading title={t('pool.availableModels')} meta={`${models.length} ${t('pool.modelsCount')}`} />
        {models.length ? (
          <div className="pool-models-grid">
            {models.map((m, i) => (
              <div key={m.id || i} className="pool-card pool-model">
                <div className="pool-model-head">
                  <span className="pool-model-id">{m.id}</span>
                  <span className="pool-model-owner">{m.owned_by || 'krypton'}</span>
                </div>
                <div className="pool-model-caps">
                  <CapTag icon={Eye} label={t('pool.vision')} active={m.vision} />
                  <CapTag icon={Wrench} label={t('pool.toolsCap')} active={m.tools} />
                  <CapTag icon={Brain} label={t('pool.reasoning')} active={m.reasoning} />
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
          <div className="pool-card pool-empty">{t('pool.noModels')}</div>
        )}
      </section>

      {/* Recent requests */}
      <section className="pool-section">
        <SectionHeading title={t('pool.recentRequests')} meta={`${usageRecent.length} ${t('pool.recent')}`} />
        {usageRecent.length ? (
          <div className="pool-card pool-table-wrap">
            <div className="pool-table-scroll">
              <table className="pool-table">
                <thead>
                  <tr>
                    {tableHeaders.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usageRecent.map((r, i) => (
                    <tr key={i}>
                      <td className="pool-mono">{fmtTime(r.timestamp)}</td>
                      <td className="pool-mono">{r.model || '—'}</td>
                      <td className="pool-mono">
                        {(r.provider || '').includes('grok') ? 'grok-cli' : r.provider || '—'}
                      </td>
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
                    <span className="pool-mono">
                      {(r.provider || '').includes('grok') ? 'grok-cli' : r.provider || '—'}
                    </span>
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
          <div className="pool-card pool-empty">{t('pool.noRecent')}</div>
        )}
      </section>
    </main>
  )
}
