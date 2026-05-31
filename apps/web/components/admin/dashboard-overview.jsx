'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  CalendarRange,
  ChevronDown,
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
  invites: Send,
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
            <div className="flex items-center gap-2 leading-none font-medium text-[#EEF4FF]">
              {card.footerHeadline} <TrendArrowIcon direction={card.changeDirection} />
            </div>
            <div className="leading-none text-[#8EA0BC]">{card.footerSubtext}</div>
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

function SessionsPanel({ sessionsChart }) {
  const buckets = Array.isArray(sessionsChart?.buckets) ? sessionsChart.buckets : []
  const maxValue = Math.max(1, ...buckets.flatMap((bucket) => [bucket.completed ?? 0, bucket.assigned ?? 0]))

  return (
    <Card className="admin-shell-overview-performance-panel">
      <CardHeader className="admin-shell-overview-performance-header">
        <div className="admin-shell-overview-performance-title-block">
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
        <span className="admin-shell-overview-performance-tab admin-shell-overview-performance-tab-first">
          {sessionsChart?.rangeLabel ?? 'Selected range'}
        </span>
      </CardHeader>
      <CardContent>
        <div className="admin-shell-overview-performance-legend">
          <span className="admin-shell-overview-performance-legend-item">
            <span className="admin-shell-overview-performance-legend-dot admin-shell-overview-performance-legend-dot-completed" />
            Completed
          </span>
          <span className="admin-shell-overview-performance-legend-item">
            <span className="admin-shell-overview-performance-legend-dot admin-shell-overview-performance-legend-dot-assigned" />
            Assigned
          </span>
        </div>
        <div className="admin-shell-overview-performance-chart" aria-label="Completed and assigned sessions by range bucket">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="admin-shell-overview-mini-bar-group">
              <div className="admin-shell-overview-mini-bars">
                <span
                  className="admin-shell-overview-mini-bar-completed"
                  style={{ height: `${Math.max(4, ((bucket.completed ?? 0) / maxValue) * 100)}%` }}
                  title={`${bucket.label} completed ${bucket.completed ?? 0}`}
                />
                <span
                  className="admin-shell-overview-mini-bar-assigned"
                  style={{ height: `${Math.max(4, ((bucket.assigned ?? 0) / maxValue) * 100)}%` }}
                  title={`${bucket.label} assigned ${bucket.assigned ?? 0}`}
                />
              </div>
              <span>{bucket.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CompliancePanel({ complianceChart }) {
  const buckets = Array.isArray(complianceChart?.buckets) ? complianceChart.buckets : []
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
        <div className="admin-shell-overview-mini-bars" aria-label="Compliance by range bucket">
          {buckets.map((bucket) => (
            <span
              key={bucket.label}
              className="admin-shell-overview-mini-bar-completed"
              style={{ height: `${Math.max(4, bucket.compliance ?? 0)}%` }}
              title={`${bucket.label} ${bucket.compliance ?? 0}%`}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">{complianceChart?.footer ?? 'No assigned sessions in this range'}</span>
      </CardFooter>
    </Card>
  )
}

function SessionsByTimePanel({ sessionsByTime }) {
  const buckets = Array.isArray(sessionsByTime?.buckets) ? sessionsByTime.buckets : []
  const maxValue = Math.max(1, ...buckets.map((bucket) => bucket.value ?? 0))

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
        <div className="admin-shell-overview-session-chart" aria-label="Completed sessions by time of day">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="admin-shell-overview-mini-bar-group">
              <span
                className="admin-shell-overview-mini-bar-assigned"
                style={{ height: `${Math.max(4, ((bucket.value ?? 0) / maxValue) * 100)}%` }}
                title={`${bucket.label} ${bucket.value ?? 0}`}
              />
              <span>{bucket.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <span className="admin-shell-overview-link">{sessionsByTime?.footer ?? 'No completed sessions in this range'}</span>
      </CardFooter>
    </Card>
  )
}

function DashboardAnalyticsPanels({ sessionsChart, complianceChart, sessionsByTime }) {
  return (
    <section className="admin-shell-overview-analytics-layout" aria-label="Dashboard analytics panels">
      <SessionsPanel sessionsChart={sessionsChart} />
      <div className="admin-shell-overview-bottom-row admin-shell-overview-side-column">
        <CompliancePanel complianceChart={complianceChart} />
        <SessionsByTimePanel sessionsByTime={sessionsByTime} />
      </div>
    </section>
  )
}

export default function DashboardOverview() {
  const [activeRange, setActiveRange] = useState('last-month')
  const [menuOpen, setMenuOpen] = useState(false)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const activeOption = useMemo(
    () => overviewRangeOptions.find((option) => option.id === activeRange) ?? overviewRangeOptions[1],
    [activeRange],
  )

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

        <div className="admin-shell-overview-range-shell">
          <button
            type="button"
            className="admin-shell-overview-range-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen ? 'true' : 'false'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="admin-shell-overview-range-button-label">{activeOption.label}</span>
            <ChevronDown className={['admin-shell-overview-range-chevron', menuOpen ? 'admin-shell-overview-range-chevron-open' : ''].join(' ')} />
          </button>

          {menuOpen ? (
            <div className="admin-shell-overview-range-menu" role="menu" aria-label="Dashboard range options">
              {overviewRangeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.id === activeRange ? 'true' : 'false'}
                  className={[
                    'admin-shell-overview-range-option',
                    option.id === activeRange ? 'admin-shell-overview-range-option-active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    setActiveRange(option.id)
                    setMenuOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
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
          />
        </>
      ) : null}
    </section>
  )
}
