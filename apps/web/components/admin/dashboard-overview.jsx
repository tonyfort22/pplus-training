'use client'

import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Activity,
  BadgeCheck,
  CalendarCheck,
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
import { CalendarHeatmap } from '@/components/ui/calendar-heatmap'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const defaultDashboardRange = 'last-month'

const overviewRangeOptions = [
  { id: 'last-7-days', label: 'Last 7 days' },
  { id: 'last-month', label: 'Last month' },
  { id: 'last-3-months', label: 'Last 3 months' },
  { id: 'last-year', label: 'Last year' },
]

const summaryIconById = {
  athletes: Users,
  programs: CalendarCheck,
  workouts: Activity,
  exercises: BadgeCheck,
  invites: Send,
}

const summaryOrder = ['athletes', 'programs', 'workouts', 'exercises', 'invites']

function getTrendTone(direction) {
  if (direction === 'negative') return 'danger'
  if (direction === 'positive') return 'success'
  return 'neutral'
}

function getTrendBadgeClass(direction) {
  if (direction === 'negative') return 'admin-shell-overview-card-badge admin-shell-overview-card-badge-negative'
  if (direction === 'positive') return 'admin-shell-overview-card-badge admin-shell-overview-card-badge-positive'
  return 'admin-shell-overview-card-badge'
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
          <Badge tone={getTrendTone(card.changeDirection)} className={getTrendBadgeClass(card.changeDirection)}>
            {card.change}
            <TrendArrowIcon direction={card.changeDirection} />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <CardIcon className="admin-shell-overview-card-change-arrow-icon mt-0.5 text-[#3BE0AF]" aria-hidden="true" />
          <div className="flex items-center gap-2 leading-none font-medium text-[var(--admin-dashboard-card-text)]">
            {card.footerHeadline}
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
        <CardDescription>Real metrics will appear here after athletes, programs, workouts, exercises, or invites exist.</CardDescription>
      </CardHeader>
    </Card>
  )
}

function LoadingOverviewState() {
  return (
    <div className="admin-shell-overview-loading" role="status" aria-label="Dashboard overview loading">
      <section className="admin-shell-overview-loading-summary flex flex-col gap-4 px-4 lg:px-0" aria-label="Dashboard summary loading skeleton">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={`summary-skeleton-top-${index}`} className="@container/card h-full">
              <CardHeader className="admin-shell-overview-card-header">
                <CardDescription className="admin-shell-overview-card-label-row">
                  <Skeleton className="h-4 w-28" />
                </CardDescription>
                <CardTitle className="admin-shell-overview-card-value">
                  <Skeleton className="h-12 w-24" />
                </CardTitle>
                <CardAction>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={`summary-skeleton-bottom-${index}`} className="@container/card h-full">
              <CardHeader className="admin-shell-overview-card-header">
                <CardDescription className="admin-shell-overview-card-label-row">
                  <Skeleton className="h-4 w-32" />
                </CardDescription>
                <CardTitle className="admin-shell-overview-card-value">
                  <Skeleton className="h-12 w-20" />
                </CardTitle>
                <CardAction>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="admin-shell-overview-loading-analytics admin-shell-overview-analytics-layout" aria-label="Dashboard analytics loading skeleton">
        <Card className="admin-shell-overview-performance-panel pt-0">
          <CardHeader className="admin-shell-overview-performance-header border-b border-[var(--admin-dashboard-card-border)] py-5 sm:flex-row sm:items-center">
            <div className="admin-shell-overview-performance-title-block flex-1 space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <CardAction>
              <Skeleton className="hidden h-9 w-[160px] rounded-lg sm:flex" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="admin-shell-overview-loading-chart admin-shell-overview-performance-chart flex h-[250px] w-full items-end gap-3 rounded-xl border border-[var(--admin-dashboard-card-border)] p-4">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={`training-chart-skeleton-${index}`} className="flex-1 rounded-t-lg" style={{ height: `${32 + ((index % 4) * 14)}%` }} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="admin-shell-overview-bottom-row admin-shell-overview-side-column">
          <Card className="admin-shell-overview-insight-card">
            <CardHeader className="space-y-3">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="admin-shell-overview-workout-results-content overflow-x-auto">
              <div className="admin-shell-overview-loading-chart flex h-[320px] min-w-[720px] items-end gap-4 rounded-xl border border-[var(--admin-dashboard-card-border)] p-4">
                {Array.from({ length: 9 }, (_, index) => (
                  <Skeleton key={`workout-chart-skeleton-${index}`} className="w-10 rounded-t-lg" style={{ height: `${28 + ((index % 5) * 12)}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="admin-shell-overview-insight-card">
            <CardHeader className="space-y-3">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent>
              <div className="admin-shell-overview-loading-heatmap admin-shell-overview-session-chart grid min-h-[220px] grid-cols-7 gap-2 rounded-xl border border-[var(--admin-dashboard-card-border)] p-4">
                {Array.from({ length: 35 }, (_, index) => (
                  <Skeleton key={`heatmap-skeleton-${index}`} className="aspect-square rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
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

const trainingExecutionChartConfig = {
  completed: {
    label: 'Completed',
    color: '#3be0af',
  },
  assigned: {
    label: 'Assigned',
    color: '#58c6ff',
  },
  missed: {
    label: 'Missed',
    color: '#f97373',
  },
}

const workoutResultsChartConfig = {
  assigned: {
    label: 'Assigned',
    color: '#58c6ff',
  },
  completed: {
    label: 'Completed',
    color: '#3be0af',
  },
  missed: {
    label: 'Missed',
    color: '#f97373',
  },
}

const workoutResultCategoryOptions = ['Warmup', 'Speed Accelerator', 'Edge Work', 'Conditioning']

const workoutResultCategoryLabelByType = {
  Warmup: 'Warmup',
  'Speed Accelerator': 'Speed',
  'Edge Work': 'Edge',
  Conditioning: 'Cond',
}

function createWorkoutResultShortLabel(workoutName, category) {
  const name = String(workoutName || 'Workout').trim()
  const categoryLabel = workoutResultCategoryLabelByType[category] ?? category ?? ''
  const phaseMatch = name.match(/^Phase\s+(\d+)\s+(.+?)\s+([A-Z])$/i)

  if (phaseMatch) {
    const [, phaseNumber, middleLabel, suffix] = phaseMatch
    const normalizedMiddleLabel = middleLabel.toLowerCase()
    const compactCategory = workoutResultCategoryLabelByType[category] ?? middleLabel

    if (!category || normalizedMiddleLabel === String(category).toLowerCase()) {
      return `P${phaseNumber} ${compactCategory} ${suffix.toUpperCase()}`
    }
  }

  if (categoryLabel && name.toLowerCase().includes(String(category).toLowerCase())) {
    return name.replace(new RegExp(String(category).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), categoryLabel)
  }

  return name.length > 14 ? `${name.slice(0, 12).trim()}…` : name
}

const trainingConsistencyHeatmapVariants = [
  'bg-[#DDFBF1] text-[#0B1120] hover:bg-[#DDFBF1] [&>button]:text-[#0B1120]',
  'bg-[#9AF0D6] text-[#0B1120] hover:bg-[#9AF0D6] [&>button]:text-[#0B1120]',
  'bg-[#3BE0AF] text-[#0B1120] hover:bg-[#3BE0AF] [&>button]:text-[#0B1120]',
  'bg-[#189B79] text-white hover:bg-[#189B79] [&>button]:text-white',
]

function parseHeatmapDate(dateValue) {
  if (!dateValue) return null
  const [year, month, day] = String(dateValue).split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildTrainingConsistencyWeightedDates(dailyActivity) {
  if (!Array.isArray(dailyActivity)) return []

  return dailyActivity
    .map((day) => {
      const date = parseHeatmapDate(day?.date)
      if (!date) return null
      return {
        date,
        weight: Number(day?.activeAthletes ?? 0),
      }
    })
    .filter(Boolean)
}

function TrainingExecutionPanel({ trainingExecution, trainingExecutionRange, onTrainingExecutionRangeChange }) {
  const buckets = Array.isArray(trainingExecution?.buckets) ? trainingExecution.buckets : []
  const chartData = buckets.map((bucket) => ({
    date: bucket.label,
    completed: bucket.completed ?? 0,
    assigned: bucket.assigned ?? 0,
    missed: bucket.missed ?? 0,
  }))

  return (
    <Card className="admin-shell-overview-performance-panel pt-0">
      <CardHeader className="admin-shell-overview-performance-header border-b border-[var(--admin-dashboard-card-border)] py-5 sm:flex-row sm:items-center">
        <div className="admin-shell-overview-performance-title-block flex-1">
          <div className="admin-shell-overview-performance-kicker-row">
            <span className="admin-shell-overview-performance-kicker">Training execution</span>
            <Badge tone={getTrendTone(trainingExecution?.trendDirection)} className={getTrendBadgeClass(trainingExecution?.trendDirection)}>{trainingExecution?.trend ?? '0%'}</Badge>
          </div>
          <CardDescription>{trainingExecution?.footer ?? 'No due workouts in this range'}</CardDescription>
        </div>
        <CardAction>
          <Select value={trainingExecutionRange} onValueChange={onTrainingExecutionRangeChange}>
            <SelectTrigger className="admin-shell-overview-select-trigger hidden w-[160px] sm:ml-auto sm:flex" aria-label="Select training execution range">
              <SelectValue placeholder="Last month" />
            </SelectTrigger>
            <SelectContent className="admin-shell-overview-select-content rounded-xl">
              {overviewRangeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id} className="admin-shell-overview-select-item">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={trainingExecutionChartConfig} className="admin-shell-overview-performance-chart aspect-auto h-[250px] w-full">
          <AreaChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillAssigned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-assigned)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--color-assigned)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillMissed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-missed)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-missed)" stopOpacity={0.04} />
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
            <Area dataKey="assigned" type="natural" fill="url(#fillAssigned)" stroke="var(--color-assigned)" stackId="a" />
            <Area dataKey="missed" type="natural" fill="url(#fillMissed)" stroke="var(--color-missed)" stackId="a" />
            <Area dataKey="completed" type="natural" fill="url(#fillCompleted)" stroke="var(--color-completed)" stackId="a" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function WorkoutResultsPanel({ workoutResults }) {
  const categoryOptions = Array.isArray(workoutResults?.categoryOptions) && workoutResults.categoryOptions.length ? workoutResults.categoryOptions : workoutResultCategoryOptions
  const [categoryFilter, setCategoryFilter] = useState('')
  const buckets = Array.isArray(workoutResults?.buckets) ? workoutResults.buckets : []
  const defaultCategory = buckets.find((bucket) => categoryOptions.includes(bucket.category))?.category ?? categoryOptions[0]
  const selectedCategory = categoryFilter || defaultCategory
  const chartData = buckets
    .filter((bucket) => bucket.category === selectedCategory)
    .map((bucket) => ({
      workoutName: bucket.workoutName,
      workoutLabel: createWorkoutResultShortLabel(bucket.workoutName, bucket.category),
      assigned: bucket.assigned ?? 0,
      completed: bucket.completed ?? 0,
      missed: bucket.missed ?? 0,
    }))
  const workoutResultsChartHeight = 320
  const workoutResultsChartWidth = Math.max(720, chartData.length * 96)

  return (
    <Card className="admin-shell-overview-insight-card admin-shell-overview-workout-results-card">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="admin-shell-overview-performance-title-block">
            <div className="admin-shell-overview-performance-kicker-row">
              <span className="admin-shell-overview-performance-kicker">Workout results</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedCategory} onValueChange={setCategoryFilter}>
              <SelectTrigger className="admin-shell-overview-select-trigger w-[190px]" aria-label="Select workout results category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="admin-shell-overview-select-content rounded-xl">
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option} className="admin-shell-overview-select-item">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="admin-shell-overview-workout-results-content overflow-x-auto">
        <ChartContainer
          config={workoutResultsChartConfig}
          className="admin-shell-overview-workout-results-chart aspect-auto w-full"
          style={{ height: workoutResultsChartHeight, minHeight: workoutResultsChartHeight, width: workoutResultsChartWidth, minWidth: workoutResultsChartWidth }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 12, right: 12, left: -24, bottom: 32 }}
          >
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="workoutLabel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={72}
              interval={0}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" labelFormatter={(_, payload) => payload?.[0]?.payload?.workoutName ?? ''} />}
            />
            <Bar dataKey="assigned" fill="var(--color-assigned)" radius={4} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
            <Bar dataKey="missed" fill="var(--color-missed)" radius={4} />
            <ChartLegend content={<ChartLegendContent className="admin-shell-overview-workout-results-legend" />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">Showing all {selectedCategory} workout results</span>
      </CardFooter>
    </Card>
  )
}

function TrainingConsistencyPanel({ trainingConsistency }) {
  const heatmapDates = buildTrainingConsistencyWeightedDates(trainingConsistency?.dailyActivity)
  const hasHeatmapData = trainingConsistency?.heatmapReady && heatmapDates.length > 0

  return (
    <Card className="admin-shell-overview-insight-card">
      <CardHeader>
        <div className="admin-shell-overview-performance-title-block">
          <span className="admin-shell-overview-performance-kicker">Training consistency</span>
          <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Monthly activity heatmap. Use the arrows to review previous months.</p>
        </div>
      </CardHeader>
      <CardContent>
        {hasHeatmapData ? (
          <div className="admin-shell-overview-session-chart overflow-x-auto">
            <CalendarHeatmap
              mode="single"
              numberOfMonths={1}
              weightedDates={heatmapDates}
              variantClassnames={trainingConsistencyHeatmapVariants}
              disabled={false}
              className="w-full"
            />
          </div>
        ) : (
          <div className="admin-shell-overview-session-chart flex min-h-[220px] flex-col justify-center gap-3 rounded-xl border border-dashed border-[var(--admin-dashboard-card-border)] px-5 text-sm text-[var(--admin-dashboard-card-muted)]">
            <div className="flex items-center gap-2 font-medium text-[var(--admin-dashboard-card-text)]">
              <CalendarCheck className="h-4 w-4 text-[#3BE0AF]" aria-hidden="true" />
              No completed sessions in this range
            </div>
            <p>Unique active athletes per day will appear here once completed workout sessions exist.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">{trainingConsistency?.footer ?? 'Based on completed workout sessions'}</span>
      </CardFooter>
    </Card>
  )
}

function DashboardAnalyticsPanels({ trainingExecution, workoutResults, trainingConsistency, trainingExecutionRange, onTrainingExecutionRangeChange }) {
  return (
    <section className="admin-shell-overview-analytics-layout" aria-label="Dashboard analytics panels">
      <TrainingExecutionPanel trainingExecution={trainingExecution} trainingExecutionRange={trainingExecutionRange} onTrainingExecutionRangeChange={onTrainingExecutionRangeChange} />
      <div className="admin-shell-overview-bottom-row admin-shell-overview-side-column">
        <WorkoutResultsPanel workoutResults={workoutResults} />
        <TrainingConsistencyPanel trainingConsistency={trainingConsistency} />
      </div>
    </section>
  )
}

export default function DashboardOverview() {
  const [trainingExecutionRange, setTrainingExecutionRange] = useState(defaultDashboardRange)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const hasLoadedInitialOverview = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/admin/dashboard/overview?range=${defaultDashboardRange}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load dashboard overview.')
        }
        if (!cancelled) {
          setOverview(payload.overview ?? null)
          hasLoadedInitialOverview.current = true
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
  }, [])

  useEffect(() => {
    if (!hasLoadedInitialOverview.current) return undefined

    let cancelled = false

    async function loadTrainingExecution() {
      try {
        const response = await fetch(`/api/admin/dashboard/overview?range=${trainingExecutionRange}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load dashboard overview.')
        }
        if (!cancelled) {
          setOverview((previousOverview) => {
            if (!previousOverview) return payload.overview ?? null
            return {
              ...previousOverview,
              trainingExecution: payload.overview?.trainingExecution ?? previousOverview.trainingExecution,
            }
          })
        }
      } catch (nextError) {
        if (!cancelled) {
          console.error(nextError)
        }
      }
    }

    loadTrainingExecution()

    return () => {
      cancelled = true
    }
  }, [trainingExecutionRange])

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
            trainingExecution={overview?.trainingExecution}
            workoutResults={overview?.workoutResults}
            trainingConsistency={overview?.trainingConsistency}
            trainingExecutionRange={trainingExecutionRange}
            onTrainingExecutionRangeChange={setTrainingExecutionRange}
          />
        </>
      ) : null}
    </section>
  )
}
