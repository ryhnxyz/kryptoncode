import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  Zap,
  DollarSign,
  Boxes,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Wrench,
  Brain,
  ArrowUpRight,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

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

const chartConfig = {
  requests: { label: 'Requests', color: 'var(--chart-1)' },
  cost: { label: 'Cost (USD)', color: 'var(--chart-2)' },
}

function KpiCard({ icon: Icon, label, value, sub, tone = 'chart-1' }) {
  return (
    <Card
      size="sm"
      className="pool-kpi-card gap-0 rounded-xl ring-0 border border-border/60 py-0"
    >
      <CardContent className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `color-mix(in oklch, var(--${tone}) 16%, transparent)` }}
          >
            <Icon className="size-3.5" style={{ color: `var(--${tone})` }} />
          </span>
        </div>
        <div className="font-mono text-2xl font-medium leading-none tabular-nums text-foreground">
          {value}
        </div>
        {sub ? (
          <div className="text-xs tabular-nums text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CapTag({ icon: Icon, label, active }) {
  return (
    <Badge
      variant={active ? 'secondary' : 'outline'}
      className={cn(
        'gap-1 font-normal',
        active ? 'text-foreground' : 'text-muted-foreground/60',
      )}
    >
      <Icon className={cn('size-3', active ? 'opacity-100' : 'opacity-50')} />
      {label}
    </Badge>
  )
}

function StatusBadge({ status }) {
  const ok = status === 'ok'
  return (
    <Badge
      variant={ok ? 'secondary' : 'destructive'}
      className={cn('font-mono text-[0.7rem]', ok && 'text-foreground')}
    >
      {ok ? 'OK' : status || 'err'}
    </Badge>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      className="font-mono"
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      aria-label={copied ? 'Copied API base URL' : 'Copy API base URL'}
    >
      {copied ? (
        <Check data-icon="inline-start" className="text-[color:var(--chart-3)]" />
      ) : (
        <Copy data-icon="inline-start" />
      )}
      <span className="max-[420px]:hidden">{copied ? 'Copied!' : text}</span>
      <span className="hidden max-[420px]:inline">{copied ? 'Copied!' : 'Copy URL'}</span>
    </Button>
  )
}

function SectionHeading({ title, meta }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {meta ? (
        <span className="font-mono text-xs text-muted-foreground/70">{meta}</span>
      ) : null}
    </div>
  )
}

function PoolSkeleton() {
  return (
    <div
      className="pool-page relative min-h-screen"
      aria-busy="true"
      aria-label="Loading pool statistics"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-5 w-32 sm:w-40" />
              <Skeleton className="h-3 w-44 max-w-full sm:w-56" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-md sm:w-24" />
        </header>

        <Card className="pool-panel gap-0 rounded-xl border-border/60 py-0 ring-0">
          <CardContent className="flex items-center justify-between gap-4 p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-36 max-w-full sm:w-48" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 shrink-0 rounded-md sm:w-32" />
          </CardContent>
        </Card>

        <section aria-label="Loading overview statistics">
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="pool-kpi-card gap-0 rounded-xl border-border/60 py-0 ring-0">
                <CardContent className="flex h-28 flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-16 sm:w-20" />
                    <Skeleton className="size-7 shrink-0 rounded-md" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-20 sm:w-24" />
                    <Skeleton className="h-3 w-14 sm:w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-label="Loading usage chart">
          <Skeleton className="mb-3 h-3 w-24" />
          <Card className="pool-panel gap-0 rounded-xl border-border/60 py-0 ring-0">
            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border/50 p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex h-52 items-end gap-2 sm:h-60 sm:gap-3">
                {[34, 52, 42, 68, 48, 78, 58, 88, 64, 74, 54, 82].map((height, i) => (
                  <Skeleton
                    key={i}
                    className="min-w-0 flex-1 rounded-t-sm rounded-b-none"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-2.5 w-8" />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Loading available models">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="pool-model-card gap-0 rounded-xl border-border/60 py-0 ring-0">
                <CardContent className="flex h-32 flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-14 rounded-md" />
                      <Skeleton className="h-5 w-14 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <span className="sr-only">Loading pool data</span>
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

  if (loading) return <PoolSkeleton />

  if (error && !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <Activity className="size-5 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Failed to load pool data</p>
          <p className="font-mono text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw data-icon="inline-start" />
          Retry
        </Button>
      </div>
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
    <div className="pool-page relative mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-base font-semibold tracking-tight text-primary-foreground">
            K
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              AI Pool
            </h1>
            <p className="text-[0.8125rem] leading-tight text-muted-foreground">
              Free shared AI infrastructure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
            <span className="pool-live-dot size-1.5 rounded-full bg-[color:var(--chart-3)]" />
            <span className="font-mono text-xs text-muted-foreground">
              {lastUpdated || '—'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadData}
            disabled={refreshing}
            aria-label="Refresh pool data"
          >
            <RefreshCw className={cn(refreshing && 'animate-spin')} />
          </Button>
        </div>
      </header>

      {/* Connection bar */}
      <Card className="pool-panel mb-6 rounded-xl ring-0 border border-border/60 py-0">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
              API Base URL
            </span>
            <CopyButton text={CONNECT_URL} />
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="flex flex-col gap-1">
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-[color:var(--chart-3)]">
              <span className="pool-live-dot size-1.5 rounded-full bg-[color:var(--chart-3)]" />
              Operational
            </span>
          </div>
          <div className="ms-auto">
            <Button
              size="sm"
              variant="outline"
              render={<a href={CONNECT_URL} target="_blank" rel="noreferrer" />}
            >
              Endpoint
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Activity}
          label="Total Requests"
          value={fmt(lifetime.requests)}
          sub={`${fmt(lifetime.promptTokens)} prompt tokens`}
          tone="chart-1"
        />
        <KpiCard
          icon={Zap}
          label="Today"
          value={fmt(today.requests)}
          sub={`${fmtCost(today.cost)} spent today`}
          tone="chart-2"
        />
        <KpiCard
          icon={Boxes}
          label="Models"
          value={String(models.length)}
          sub="powered by KryptonCode"
          tone="chart-3"
        />
        <KpiCard
          icon={DollarSign}
          label="Lifetime Cost"
          value={fmtCost(lifetime.cost)}
          sub={`${fmt(lifetime.completionTokens)} completion tokens`}
          tone="chart-4"
        />
      </div>

      {/* Usage chart */}
      <section className="mb-8">
        <SectionHeading
          title="Daily Usage"
          meta={`${usageDaily.length} days`}
        />
        <Card className="pool-panel rounded-xl ring-0 border border-border/60">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm">Requests &amp; cost trend</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[color:var(--chart-1)]" />
                  Requests
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[color:var(--chart-2)]" />
                  Cost
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-56 w-full sm:h-64"
              >
                <AreaChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
                  <defs>
                    <linearGradient id="poolReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-requests)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-requests)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="poolCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-cost)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-cost)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <YAxis
                    yAxisId="requests"
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <YAxis yAxisId="cost" orientation="right" hide />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--border)' }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.dateKey || ''
                        }
                      />
                    }
                  />
                  <Area
                    yAxisId="requests"
                    dataKey="requests"
                    type="monotone"
                    stroke="var(--color-requests)"
                    strokeWidth={2}
                    fill="url(#poolReq)"
                  />
                  <Area
                    yAxisId="cost"
                    dataKey="cost"
                    type="monotone"
                    stroke="var(--color-cost)"
                    strokeWidth={2}
                    fill="url(#poolCost)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No usage data yet
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Models */}
      <section className="mb-8">
        <SectionHeading title="Available Models" meta={`${models.length} models`} />
        {models.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m, i) => (
              <Card
                key={i}
                size="sm"
                className="pool-model-card gap-0 rounded-xl ring-0 border border-border/60 py-0"
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate font-mono text-sm font-medium text-foreground">
                      {m.id}
                    </span>
                    <span className="shrink-0 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                      {m.owned_by}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <CapTag icon={Eye} label="Vision" active={m.vision} />
                    <CapTag icon={Wrench} label="Tools" active={m.tools} />
                    <CapTag icon={Brain} label="Reasoning" active={m.reasoning} />
                  </div>
                  <div className="flex gap-4 font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                    <span>
                      <span className="text-foreground/80">ctx</span> {fmtCtx(m.contextWindow)}
                    </span>
                    <span>
                      <span className="text-foreground/80">max</span> {fmtCtx(m.maxOutput)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="pool-panel rounded-xl ring-0 border border-border/60 py-0">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No models available
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent requests */}
      <section>
        <SectionHeading title="Recent Requests" meta={`${usageRecent.length} recent`} />
        {usageRecent.length ? (
          <Card className="pool-panel overflow-hidden rounded-xl ring-0 border border-border/60 py-0">
            {/* Desktop table */}
            <div className="pool-desktop-table overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {['Time', 'Model', 'Provider', 'Prompt', 'Completion', 'Cached', 'Cost', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-2.5 text-left text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usageRecent.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {fmtTime(r.timestamp)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                        {r.model || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.provider || '—'}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">
                        {fmt(r.promptTokens)}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">
                        {fmt(r.completionTokens)}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground/70">
                        {fmt(r.cachedTokens)}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-muted-foreground">
                        {fmtCost(r.cost)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="pool-mobile-requests gap-0">
              {usageRecent.map((r, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border-b border-border/40 p-4 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-mono text-xs font-medium text-foreground">
                      {r.model || '—'}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.provider || '—'}</span>
                    <span className="font-mono">{fmtTime(r.timestamp)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t border-border/40 pt-2 font-mono text-[0.6875rem] tabular-nums">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground/60">prompt</span>
                      <span className="text-foreground/90">{fmt(r.promptTokens)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground/60">compl</span>
                      <span className="text-foreground/90">{fmt(r.completionTokens)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground/60">cached</span>
                      <span className="text-foreground/90">{fmt(r.cachedTokens)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground/60">cost</span>
                      <span className="text-foreground/90">{fmtCost(r.cost)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="pool-panel rounded-xl ring-0 border border-border/60 py-0">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No recent requests
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
