'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CalendarRange,
  ChevronDown,
  Send,
  Users,
} from 'lucide-react'

const overviewRangeOptions = [
  { id: 'last-7-days', label: 'Last 7 days' },
  { id: 'last-month', label: 'Last month' },
  { id: 'last-3-months', label: 'Last 3 months' },
  { id: 'last-year', label: 'Last year' },
]

const overviewRangeCardData = {
  'last-7-days': [
    { id: 'active-athletes', label: 'Active athletes', value: '6', change: '12.4%', direction: 'positive', icon: Users },
    { id: 'programs-assigned', label: 'Programs assigned', value: '3', change: '4.8%', direction: 'negative', icon: CalendarRange },
    { id: 'sessions-this-week', label: 'Sessions this week', value: '9', change: '18%', direction: 'positive', icon: Activity },
    { id: 'compliance', label: 'Compliance', value: '82%', change: '6.2%', direction: 'positive', icon: BadgeCheck },
    { id: 'pending-invites', label: 'Pending invites', value: '2', change: '9.1%', direction: 'positive', icon: Send },
  ],
  'last-month': [
    { id: 'active-athletes', label: 'Active athletes', value: '8', change: '28.4%', direction: 'positive', icon: Users },
    { id: 'programs-assigned', label: 'Programs assigned', value: '4', change: '12.6%', direction: 'negative', icon: CalendarRange },
    { id: 'sessions-this-week', label: 'Sessions this week', value: '12', change: '31%', direction: 'positive', icon: Activity },
    { id: 'compliance', label: 'Compliance', value: '88%', change: '11.3%', direction: 'positive', icon: BadgeCheck },
    { id: 'pending-invites', label: 'Pending invites', value: '3', change: '11.3%', direction: 'positive', icon: Send },
  ],
  'last-3-months': [
    { id: 'active-athletes', label: 'Active athletes', value: '14', change: '34.1%', direction: 'positive', icon: Users },
    { id: 'programs-assigned', label: 'Programs assigned', value: '9', change: '8.2%', direction: 'positive', icon: CalendarRange },
    { id: 'sessions-this-week', label: 'Sessions this week', value: '27', change: '22.6%', direction: 'positive', icon: Activity },
    { id: 'compliance', label: 'Compliance', value: '91%', change: '7.4%', direction: 'positive', icon: BadgeCheck },
    { id: 'pending-invites', label: 'Pending invites', value: '5', change: '16.8%', direction: 'positive', icon: Send },
  ],
  'last-year': [
    { id: 'active-athletes', label: 'Active athletes', value: '32', change: '41.7%', direction: 'positive', icon: Users },
    { id: 'programs-assigned', label: 'Programs assigned', value: '18', change: '14.9%', direction: 'positive', icon: CalendarRange },
    { id: 'sessions-this-week', label: 'Sessions this week', value: '64', change: '29.3%', direction: 'positive', icon: Activity },
    { id: 'compliance', label: 'Compliance', value: '93%', change: '9.8%', direction: 'positive', icon: BadgeCheck },
    { id: 'pending-invites', label: 'Pending invites', value: '7', change: '4.1%', direction: 'negative', icon: Send },
  ],
}

const overviewPerformanceData = {
  'last-7-days': {
    total: '42',
    change: '8.1%',
    changeDirection: 'positive',
    rangeLabel: 'May 07 - May 13, 2026',
    tooltipValue: '42',
    tooltipChange: '8.1%',
    tooltipDate: 'May 13, 2026',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    completed: [4, 5, 4, 6, 7, 8, 8],
    assigned: [5, 6, 6, 7, 8, 8, 9],
    activeIndex: 5,
  },
  'last-month': {
    total: '148',
    change: '12.4%',
    changeDirection: 'positive',
    rangeLabel: 'Apr 22 - May 21, 2026',
    tooltipValue: '148',
    tooltipChange: '12.4%',
    tooltipDate: 'May 21, 2026',
    labels: ['Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 18', 'May 20', 'May 21'],
    completed: [32, 36, 40, 44, 58, 64, 72, 86, 92, 108, 124, 148],
    assigned: [44, 52, 48, 60, 68, 72, 66, 84, 90, 74, 88, 96],
    activeIndex: 5,
  },
  'last-3-months': {
    total: '276',
    change: '18.9%',
    changeDirection: 'positive',
    rangeLabel: 'Feb 2026 - Apr 2026',
    tooltipValue: '276',
    tooltipChange: '18.9%',
    tooltipDate: 'April 29, 2026',
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
    completed: [14, 18, 22, 20, 24, 27, 26, 30, 32, 34, 37, 40],
    assigned: [18, 22, 24, 23, 27, 30, 29, 34, 35, 36, 38, 42],
    activeIndex: 8,
  },
  'last-year': {
    total: '684',
    change: '27.2%',
    changeDirection: 'positive',
    rangeLabel: 'May 2025 - Apr 2026',
    tooltipValue: '684',
    tooltipChange: '27.2%',
    tooltipDate: 'April 30, 2026',
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    completed: [34, 38, 42, 46, 49, 54, 58, 62, 64, 69, 81, 87],
    assigned: [44, 48, 50, 56, 54, 60, 64, 66, 70, 73, 78, 84],
    activeIndex: 10,
  },
}

const overviewComplianceData = {
  'last-7-days': {
    value: '82%',
    change: '4.4%',
    changeDirection: 'positive',
    footer: 'Last 7 days',
    bars: [26, 34, 28, 40, 44, 36, 50, 42],
  },
  'last-month': {
    value: '84%',
    change: '6.2%',
    changeDirection: 'positive',
    footer: 'Last month',
    bars: [22, 34, 28, 42, 38, 46, 54, 48, 58, 44, 62, 52],
  },
  'last-3-months': {
    value: '89%',
    change: '7.1%',
    changeDirection: 'positive',
    footer: 'Last 3 months',
    bars: [30, 42, 38, 48, 54, 50, 60, 58, 64, 68, 62, 72],
  },
  'last-year': {
    value: '91%',
    change: '9.3%',
    changeDirection: 'positive',
    footer: 'Last year',
    bars: [24, 36, 40, 44, 48, 52, 58, 56, 62, 68, 72, 78],
  },
}

const overviewSessionTimeData = {
  'last-7-days': {
    total: '18',
    change: '9.2%',
    changeDirection: 'positive',
    labels: ['12 AM', '8 AM', '4 PM', '11 PM'],
    yAxis: ['50', '0', '25', '0', '10', '0', '5', '0'],
    points: [6, 8, 7, 14, 20, 28, 22, 10],
  },
  'last-month': {
    total: '32',
    change: '16.8%',
    changeDirection: 'positive',
    labels: ['12 AM', '8 AM', '4 PM', '11 PM'],
    yAxis: ['50', '0', '25', '0', '10', '0', '5', '0'],
    points: [8, 10, 12, 9, 18, 30, 21, 12],
  },
  'last-3-months': {
    total: '76',
    change: '21.4%',
    changeDirection: 'positive',
    labels: ['12 AM', '8 AM', '4 PM', '11 PM'],
    yAxis: ['50', '0', '25', '0', '10', '0', '5', '0'],
    points: [12, 18, 16, 24, 32, 44, 35, 20],
  },
  'last-year': {
    total: '280',
    change: '24.1%',
    changeDirection: 'positive',
    labels: ['12 AM', '8 AM', '4 PM', '11 PM'],
    yAxis: ['50', '0', '25', '0', '10', '0', '5', '0'],
    points: [16, 20, 18, 28, 36, 48, 41, 24],
  },
}

function getTrendClass(direction) {
  return [
    'admin-shell-overview-card-change',
    direction === 'negative' ? 'admin-shell-overview-card-change-negative' : 'admin-shell-overview-card-change-positive',
  ].join(' ')
}

function TrendArrowIcon({ direction }) {
  return direction === 'negative' ? (
    <ArrowDown className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
  ) : (
    <ArrowUp className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
  )
}

function buildLinePath(values, width, height, maxValue) {
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / maxValue) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function buildAreaPath(values, width, height, maxValue) {
  if (!values.length) {
    return ''
  }

  const linePath = buildLinePath(values, width, height, maxValue)
  return `${linePath} L ${width} ${height} L 0 ${height} Z`
}

function PerformanceChart({ data }) {
  const width = 720
  const height = 260
  const maxValue = Math.max(...data.completed, ...data.assigned) * 1.1
  const completedPath = buildLinePath(data.completed, width, height, maxValue)
  const assignedPath = buildLinePath(data.assigned, width, height, maxValue)
  const completedAreaPath = buildAreaPath(data.completed, width, height, maxValue)

  return (
    <div className="admin-shell-overview-performance-chart">
      <svg viewBox={`0 0 ${width} ${height + 26}`} className="admin-shell-overview-performance-chart-svg" aria-hidden="true">
        <defs>
          <linearGradient id="overviewCompletedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59, 224, 175, 0.28)" />
            <stop offset="100%" stopColor="rgba(59, 224, 175, 0.02)" />
          </linearGradient>
        </defs>
        <path d={completedAreaPath} fill="url(#overviewCompletedGradient)" />
        <path d={assignedPath} fill="none" stroke="#58c6ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.96" />
        <path d={completedPath} fill="none" stroke="#3be0af" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.completed.map((value, index) => {
          const x = data.completed.length === 1 ? width / 2 : (index / (data.completed.length - 1)) * width
          const y = height - (value / maxValue) * height
          const isActive = index === data.activeIndex

          return (
            <circle
              key={`completed-point-${data.labels[index]}`}
              cx={x}
              cy={y}
              r={isActive ? 7 : 4}
              fill="#3be0af"
              className={isActive ? 'admin-shell-overview-chart-point-active' : 'admin-shell-overview-chart-point'}
            />
          )
        })}
      </svg>

      <div className="admin-shell-overview-performance-months" aria-hidden="true">
        {data.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="admin-shell-overview-performance-tooltip">
        <div className="admin-shell-overview-performance-tooltip-header">
          <strong>{data.tooltipValue}</strong>
          <span className={getTrendClass(data.changeDirection)}>
            <TrendArrowIcon direction={data.changeDirection} />
            {data.tooltipChange}
          </span>
        </div>
        <span className="admin-shell-overview-performance-tooltip-date">{data.tooltipDate}</span>
      </div>
    </div>
  )
}

function SessionTimeChart({ data }) {
  const width = 280
  const height = 132
  const maxValue = Math.max(...data.points) * 1.15
  const linePath = buildLinePath(data.points, width, height, maxValue)

  return (
    <div className="admin-shell-overview-session-chart">
      <div className="admin-shell-overview-session-chart-axis" aria-hidden="true">
        {data.yAxis.map((tick, index) => (
          <span key={`tick-${index}-${tick}`}>{tick}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-shell-overview-session-chart-svg" aria-hidden="true">
        <path d={linePath} fill="none" stroke="#58d9b3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function DashboardOverview() {
  const [activeRange, setActiveRange] = useState('last-month')
  const [menuOpen, setMenuOpen] = useState(false)

  const activeOption = useMemo(
    () => overviewRangeOptions.find((option) => option.id === activeRange) ?? overviewRangeOptions[1],
    [activeRange],
  )

  const cards = overviewRangeCardData[activeRange] ?? overviewRangeCardData['last-month']
  const performance = overviewPerformanceData[activeRange] ?? overviewPerformanceData['last-month']
  const compliance = overviewComplianceData[activeRange] ?? overviewComplianceData['last-month']
  const sessionTiming = overviewSessionTimeData[activeRange] ?? overviewSessionTimeData['last-month']

  return (
    <section className="admin-shell-overview" aria-label="Overview dashboard">
      <div className="admin-shell-overview-toolbar">
        <div className="admin-shell-workspace-header">
          <h1 className="admin-shell-workspace-title">Overview</h1>
          <p className="admin-shell-workspace-description">Here is an overview of your platform.</p>
        </div>

        <div className="admin-shell-overview-range-shell">
          <button
            type="button"
            className="admin-shell-overview-range-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen ? 'true' : 'false'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{activeOption.label}</span>
            <ChevronDown className={['admin-shell-overview-range-chevron', menuOpen ? 'admin-shell-overview-range-chevron-open' : ''].join(' ')} />
          </button>

          {menuOpen ? (
            <div className="admin-shell-overview-range-menu" role="menu" aria-label="Overview range options">
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

      <section className="admin-shell-overview-grid" aria-label="Overview summary cards">
        {cards.map((card) => {
          const CardIcon = card.icon

          return (
            <article key={card.id} className="admin-shell-overview-card">
              <div className="admin-shell-overview-card-header">
                <CardIcon className="admin-shell-overview-card-icon" />
                <span className="admin-shell-overview-card-label">{card.label}</span>
              </div>
              <div className="admin-shell-overview-card-value-row">
                <strong className="admin-shell-overview-card-value">{card.value}</strong>
                <span className={getTrendClass(card.direction)}>
                  <TrendArrowIcon direction={card.direction} />
                  {card.change}
                </span>
              </div>
            </article>
          )
        })}
      </section>

      <section className="admin-shell-overview-analytics-layout" aria-label="Overview analytics panels">
        <article className="admin-shell-overview-performance-panel">
          <div className="admin-shell-overview-performance-topline">
            <div className="admin-shell-overview-performance-title-block">
              <div className="admin-shell-overview-performance-kicker-row">
                <Activity className="admin-shell-overview-performance-kicker-icon" aria-hidden="true" />
                <span className="admin-shell-overview-performance-kicker">Sessions</span>
              </div>
              <div className="admin-shell-overview-performance-value-row">
                <strong className="admin-shell-overview-performance-value">{performance.total}</strong>
                <span className={getTrendClass(performance.changeDirection)}>
                  <TrendArrowIcon direction={performance.changeDirection} />
                  {performance.change}
                </span>
              </div>
            </div>

            <div className="admin-shell-overview-performance-meta">
              <div className="admin-shell-overview-performance-legend" aria-label="Sessions chart legend">
                <span className="admin-shell-overview-performance-legend-item">
                  <span className="admin-shell-overview-performance-legend-dot admin-shell-overview-performance-legend-dot-completed" />
                  Completed
                </span>
                <span className="admin-shell-overview-performance-legend-item">
                  <span className="admin-shell-overview-performance-legend-dot admin-shell-overview-performance-legend-dot-assigned" />
                  Assigned
                </span>
              </div>

              <button type="button" className="admin-shell-overview-performance-range-button">
                <CalendarRange className="admin-shell-overview-performance-range-icon" />
                <span>{performance.rangeLabel}</span>
                <ChevronDown className="admin-shell-overview-performance-range-chevron" />
              </button>
            </div>
          </div>

          <PerformanceChart data={performance} />
        </article>

        <div className="admin-shell-overview-side-column">
          <article className="admin-shell-overview-insight-card">
            <div className="admin-shell-overview-insight-copy">
              <div className="admin-shell-overview-insight-label-row">
                <BadgeCheck className="admin-shell-overview-insight-label-icon" aria-hidden="true" />
                <span className="admin-shell-overview-insight-label">Overall compliance</span>
              </div>
              <div className="admin-shell-overview-insight-value-row">
                <strong className="admin-shell-overview-insight-value">{compliance.value}</strong>
                <span className={getTrendClass(compliance.changeDirection)}>
                  <TrendArrowIcon direction={compliance.changeDirection} />
                  {compliance.change}
                </span>
              </div>
            </div>

            <div className="admin-shell-overview-mini-bars" aria-hidden="true">
              {compliance.bars.map((value, index) => (
                <span
                  key={`compliance-bar-${index}`}
                  className={[
                    'admin-shell-overview-mini-bar',
                    index % 2 === 0 ? 'admin-shell-overview-mini-bar-completed' : 'admin-shell-overview-mini-bar-assigned',
                  ].join(' ')}
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>

            <div className="admin-shell-overview-insight-footer">
              <span>{compliance.footer}</span>
              <button type="button" className="admin-shell-overview-link">View report</button>
            </div>
          </article>

          <article className="admin-shell-overview-insight-card">
            <div className="admin-shell-overview-insight-copy">
              <div className="admin-shell-overview-insight-label-row">
                <Activity className="admin-shell-overview-insight-label-icon" aria-hidden="true" />
                <span className="admin-shell-overview-insight-label">Sessions by time of the day</span>
              </div>
              <div className="admin-shell-overview-insight-value-row">
                <strong className="admin-shell-overview-insight-value">{sessionTiming.total}</strong>
                <span className={getTrendClass(sessionTiming.changeDirection)}>
                  <TrendArrowIcon direction={sessionTiming.changeDirection} />
                  {sessionTiming.change}
                </span>
              </div>
            </div>

            <SessionTimeChart data={sessionTiming} />

            <div className="admin-shell-overview-session-chart-labels" aria-hidden="true">
              {sessionTiming.labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="admin-shell-overview-insight-footer">
              <span>Peak hours tracked</span>
              <button type="button" className="admin-shell-overview-link">View report</button>
            </div>
          </article>
        </div>
      </section>
    </section>
  )
}
