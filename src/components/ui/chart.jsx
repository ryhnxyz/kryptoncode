"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

const ChartContext = React.createContext(null)

function ChartContainer({ id, className, children, config, ...props }) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, item]) => `  --color-${key}: ${item.color};`)
          .join("\n")}\n}`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({ active, payload, label, className, labelFormatter }) {
  const context = React.useContext(ChartContext)
  if (!active || !payload?.length) return null

  return (
    <div className={cn("grid min-w-36 gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl", className)}>
      <div className="font-mono font-medium text-foreground">
        {labelFormatter ? labelFormatter(label, payload) : label}
      </div>
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = item.dataKey || item.name
          const config = context?.config?.[key] || {}
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} />
                {config.label || item.name}
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
