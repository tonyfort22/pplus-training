"use client"

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

const THEMES = {
  light: '[data-theme="light"]',
  dark: '[data-theme="dark"]',
}

const INITIAL_DIMENSION = {
  width: 320,
  height: 200,
}

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn('flex w-full justify-center text-xs', className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export function ChartStyle({ id, config }) {
  const colorConfig = Object.entries(config ?? {}).filter(([, itemConfig]) => itemConfig?.theme ?? itemConfig?.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme] ?? itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join('\n')}
}
`)
          .join('\n'),
      }}
    />
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip
export const ChartLegend = RechartsPrimitive.Legend

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === 'string' ? (config?.[label]?.label ?? label) : itemConfig?.label

    if (labelFormatter) {
      return <div className={cn('font-medium text-[#eef4ff]', labelClassName)}>{labelFormatter(value, payload)}</div>
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium text-[#eef4ff]', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-[18px] border border-[#30405e] bg-[#0a101d] px-3 py-2 text-xs shadow-[0_18px_36px_rgba(2,8,18,0.42)]',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color

            return (
              <div key={index} className={cn('flex w-full flex-wrap items-stretch gap-2', indicator === 'dot' && 'items-center')}>
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon className="h-3 w-3 text-[#7f91af]" />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn('shrink-0 rounded-[2px]', {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'my-0.5 w-1': indicator === 'line',
                            'my-0.5 w-0 border border-dashed border-current bg-transparent': indicator === 'dashed',
                          })}
                          style={{ backgroundColor: indicator === 'dot' || indicator === 'line' ? indicatorColor : 'transparent', color: indicatorColor }}
                        />
                      )
                    )}
                    <div className={cn('flex flex-1 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}>
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-[#7f91af]">{itemConfig?.label ?? item.name}</span>
                      </div>
                      {item.value != null ? (
                        <span className="font-mono font-medium tabular-nums text-[#eef4ff]">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div className={cn('flex items-center justify-center gap-4 text-[#9fb0cc]', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}>
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div key={index} className="flex items-center gap-1.5">
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon className="h-3 w-3 text-[#7f91af]" />
              ) : (
                <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload = 'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
    ? payload.payload
    : undefined

  let configLabelKey = key

  if (key in payload && typeof payload[key] === 'string') {
    configLabelKey = payload[key]
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === 'string') {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}
