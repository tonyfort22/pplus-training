'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis } from 'recharts'
import {
  Activity,
  BadgeCheck,
  CalendarRange,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

import Badge from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const overviewRangeOptions = [
  { id: 'last-7-days', label: 'Last 7 days' },
  { id: 'last-month', label: 'Last month' },
  { id: 'last-3-months', label: 'Last 3 months' },
  { id: 'last-year', label: 'Last year' },
]

const summaryIconById = {
  athletes: Users,
  programs: CalendarRange,
  sessions: Activity,
  compliance: BadgeCheck,
  pendingInvites: Send,
}

const summaryOrder = ['athletes', 'programs', 'sessions', 'compliance', 'pendingInvites']

function getTrendTone(direction) {
  if (direction === 'negative') return 'danger'
  if (direction === 'positive') return 'success'
  return 'neutral'
}

function TrendArrowIcon({ direction }) {
  if (direction === 'negative') {
    return <TrendingDown className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
  }

  return <TrendingUp className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
}

function normalizeSummaryCard(card, fallbackId) {
  const id = card?.id ?? fallbackId
  return {
    id,
    label: card?.label ?? 'Metric',
    value: card?.value ?? '0',
    change: card?.change ?? '0%',
    changeDirection: card?.changeDirection ?? 'neutral',
    footerHeadline: card?.footerHeadline ?? 'No real data yet',
    footerSubtext: card?.footerSubtext ?? 'This metric will update when real dashboard data exists.',
    icon: summaryIconById[id] ?? Activity,
  }
}

function buildSummaryCards(summary) {
  return summaryOrder.map((key) => normalizeSummaryCard(summary?.[key], key))
}

function OverviewSummaryCard({ card }) {
  const CardIcon = card.icon

  return (
    <Card className="@container/card h-full">
      <CardHeader className="admin-shell-overview-card-header">
        <CardDescription className="admin-shell-overview-card-label-row">
          <span className="admin-shell-overview-card-label">{card.label}</span>
        </CardDescription>
        <CardTitle className="admin-shell-overview-card-value text-[2.6rem] font-black leading-none tabular-nums">
          {card.value}
        </CardTitle>
        <CardAction>
          <Badge tone={getTrendTone(card.changeDirection)}>
            {card.change}
            <TrendArrowIcon direction={card.changeDirection} />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <CardIcon className="admin-shell-overview-card-change-arrow-icon mt-0.5 text-[#3BE0AF]" aria-hidden="true" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium text-[var(--admin-dashboard-card-text)]">
              {card.footerHeadline} <TrendArrowIcon direction={card.changeDirection} />
            </div>
            <div className="leading-none text-[var(--admin-dashboard-card-muted)]">{card.footerSubtext}</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function EmptyOverviewState() {
  return (
    <Card className="admin-shell-overview-empty" role="status" aria-label="No dashboard data yet">
      <CardHeader>
        <CardTitle>No dashboard data yet</CardTitle>
        <CardDescription>Real metrics will appear here after athletes, assignments, sessions, or invites exist.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function LoadingOverviewState() {
  return (
    <Card className="admin-shell-overview-loading" role="status" aria-label="Dashboard overview loading">
      <CardHeader>
        <CardTitle>Loading dashboard…</CardTitle>
        <CardDescription>Pulling real account metrics.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function ErrorOverviewState({ message }) {
  return (
    <Card className="admin-shell-overview-error" role="alert" aria-label="Dashboard overview error">
      <CardHeader>
        <CardTitle>Dashboard data unavailable</CardTitle>
        <CardDescription>{message || 'Could not load dashboard overview.'}</CardDescription>
      </CardHeader>
    </Card>
  )
}

const sessionsChartConfig = {
  completed: {
    label: 'Completed',
    color: '#3be0af',
  },
  assigned: {
    label: 'Assigned',
    color: '#58c6ff',
  },
}

const complianceChartConfig = {
  completed: {
    label: 'Completed',
    color: '#3be0af',
  },
  assigned: {
    label: 'Assigned',
    color: '#58c6ff',
  },
}

const sessionTimeChartConfig = {
  sessions: {
    label: 'Sessions',
    color: '#3be0af',
  },
}

function SessionsPanel({ sessionsChart, activeRange, onRangeChange }) {
  const buckets = Array.isArray(sessionsChart?.buckets) ? sessionsChart.buckets : []
  const chartData = buckets.map((bucket) => ({
    date: bucket.label,
    completed: bucket.completed ?? 0,
    assigned: bucket.assigned ?? 0,
  }))

  return (
    <Card className="admin-shell-overview-performance-panel pt-0">
      <CardHeader className="admin-shell-overview-performance-header border-b border-[var(--admin-dashboard-card-border)] py-5 sm:flex-row sm:items-center">
        <div className="admin-shell-overview-performance-title-block flex-1">
          <div className="admin-shell-overview-performance-kicker-row">
            <Activity className="admin-shell-overview-performance-kicker-icon" aria-hidden="true" />
            <span className="admin-shell-overview-performance-kicker">Sessions</span>
          </div>
          <div className="admin-shell-overview-performance-value-row">
            <CardTitle className="admin-shell-overview-performance-value">{sessionsChart?.value ?? '0'}</CardTitle>
            <Badge tone="success">{sessionsChart?.trend ?? '0%'}</Badge>
          </div>
          <CardDescription>{sessionsChart?.footer ?? 'No sessions in this range'}</CardDescription>
        </div>
        <CardAction>
          <Select value={activeRange} onValueChange={onRangeChange}>
            <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select a value">
              <SelectValue placeholder="Last month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {overviewRangeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={sessionsChartConfig} className="admin-shell-overview-performance-chart aspect-auto h-[250px] w-full">
          <AreaChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillAssigned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-assigned)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-assigned)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="assigned"
              type="natural"
              fill="url(#fillAssigned)"
              stroke="var(--color-assigned)"
              stackId="a"
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--color-completed)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function CompliancePanel({ complianceChart }) {
  const buckets = Array.isArray(complianceChart?.buckets) ? complianceChart.buckets : []
  const chartData = buckets.map((bucket) => ({
    date: bucket.label,
    completed: bucket.completed ?? 0,
    assigned: bucket.assigned ?? 0,
  }))

  return (
    <Card className="admin-shell-overview-insight-card">
      <CardHeader>
        <CardDescription>Overall compliance</CardDescription>
        <div className="admin-shell-overview-performance-value-row">
          <CardTitle className="admin-shell-overview-insight-value">{complianceChart?.value ?? '0%'}</CardTitle>
          <Badge tone="success">{complianceChart?.trend ?? '0%'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={complianceChartConfig} className="admin-shell-overview-compliance-chart aspect-auto h-[180px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
            <Bar dataKey="assigned" fill="var(--color-assigned)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">{complianceChart?.footer ?? 'No assigned sessions in this range'}</span>
      </CardFooter>
    </Card>
  )
}

function SessionsByTimePanel({ sessionsByTime }) {
  const buckets = Array.isArray(sessionsByTime?.buckets) ? sessionsByTime.buckets : []
  const chartData = buckets.map((bucket) => ({
    time: bucket.label,
    sessions: bucket.value ?? 0,
  }))

  return (
    <Card className="admin-shell-overview-insight-card">
      <CardHeader>
        <CardDescription>Sessions by time of the day</CardDescription>
        <div className="admin-shell-overview-performance-value-row">
          <CardTitle className="admin-shell-overview-insight-value">{sessionsByTime?.value ?? '0'}</CardTitle>
          <Badge tone="success">{sessionsByTime?.trend ?? '0%'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={sessionTimeChartConfig} className="admin-shell-overview-session-chart aspect-auto h-[220px] w-full">
          <RadarChart accessibilityLayer data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <PolarAngleAxis dataKey="time" tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }} />
            <PolarGrid radialLines={false} stroke="var(--admin-dashboard-chart-grid)" />
            <Radar dataKey="sessions" fill="var(--color-sessions)" fillOpacity={0.6} stroke="var(--color-sessions)" />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">{sessionsByTime?.footer ?? 'No completed sessions in this range'}</span>
      </CardFooter>
    </Card>
  )
}

function DashboardAnalyticsPanels({ sessionsChart, complianceChart, sessionsByTime, activeRange, onRangeChange }) {
  return (
    <section className="admin-shell-overview-analytics-layout" aria-label="Dashboard analytics panels">
      <SessionsPanel sessionsChart={sessionsChart} activeRange={activeRange} onRangeChange={onRangeChange} />
      <div className="admin-shell-overview-bottom-row admin-shell-overview-side-column">
        <CompliancePanel complianceChart={complianceChart} />
        <SessionsByTimePanel sessionsByTime={sessionsByTime} />
      </div>
    </section>
  )
}

export default function DashboardOverview() {
  const [activeRange, setActiveRange] = useState('last-month')
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/admin/dashboard/overview?range=${activeRange}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load dashboard overview.')
        }
        if (!cancelled) {
          setOverview(payload.overview ?? null)
        }
      } catch (nextError) {
        if (!cancelled) {
          setOverview(null)
          setError(nextError?.message || 'Could not load dashboard overview.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      cancelled = true
    }
  }, [activeRange])

  const cards = buildSummaryCards(overview?.summary)
  const summaryCardRows = [cards.slice(0, 3), cards.slice(3)]
  const hasSummaryData = cards.some((card) => card.value !== '0' && card.value !== '0%')

  return (
    <section className="admin-shell-overview" aria-label="Dashboard overview">
      <div className="admin-shell-overview-toolbar">
        <div className="admin-shell-workspace-header">
          <h1 className="admin-shell-workspace-title">Dashboard</h1>
        </div>

      </div>

      {loading ? <LoadingOverviewState /> : null}
      {!loading && error ? <ErrorOverviewState message={error} /> : null}
      {!loading && !error && !hasSummaryData ? <EmptyOverviewState /> : null}

      {!loading && !error ? (
        <>
          <section className="flex flex-col gap-4 px-4 lg:px-0" aria-label="Dashboard summary cards">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {summaryCardRows[0].map((card) => (
                <OverviewSummaryCard key={card.id} card={card} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {summaryCardRows[1].map((card) => (
                <OverviewSummaryCard key={card.id} card={card} />
              ))}
            </div>
          </section>

          <DashboardAnalyticsPanels
            sessionsChart={overview?.sessionsChart}
            complianceChart={overview?.complianceChart}
            sessionsByTime={overview?.sessionsByTime}
            activeRange={activeRange}
            onRangeChange={setActiveRange}
          />
        </>
      ) : null}
    </section>
  )
}
