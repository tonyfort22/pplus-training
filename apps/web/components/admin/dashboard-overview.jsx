'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  CalendarRange,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const overviewChartTabs = [
  { id: 'last-year', label: '12 month' },
  { id: 'last-month', label: '30 days' },
  { id: 'last-7-days', label: '7 days' },
  { id: 'last-24-hours', label: '24 hours' },
]

const overviewRangeCardData = {
  'last-7-days': [
    {
      id: 'athletes',
      label: 'Athletes',
      value: '6',
      change: '+8.4%',
      changeDirection: 'positive',
      footerHeadline: 'Trending up this month',
      footerSubtext: 'More athletes joined this week',
      icon: Users,
    },
    {
      id: 'programs',
      label: 'Programs',
      value: '3',
      change: '-6.1%',
      changeDirection: 'negative',
      footerHeadline: 'Down 20% this period',
      footerSubtext: 'Program adoption needs attention',
      icon: CalendarRange,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '42',
      change: '+11.2%',
      changeDirection: 'positive',
      footerHeadline: 'Strong athlete retention',
      footerSubtext: 'Sessions stayed consistent this week',
      icon: Activity,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: '82%',
      change: '+4.8%',
      changeDirection: 'positive',
      footerHeadline: 'Steady compliance increase',
      footerSubtext: 'Daily check-ins are trending up',
      icon: BadgeCheck,
    },
    {
      id: 'invites',
      label: 'Pending invites',
      value: '2',
      change: '+2.3%',
      changeDirection: 'positive',
      footerHeadline: 'More coaches inviting athletes',
      footerSubtext: 'Two invites still need responses',
      icon: Send,
    },
  ],
  'last-month': [
    {
      id: 'athletes',
      label: 'Athletes',
      value: '8',
      change: '+12.5%',
      changeDirection: 'positive',
      footerHeadline: 'Trending up this month',
      footerSubtext: 'Roster growth stayed ahead of plan',
      icon: Users,
    },
    {
      id: 'programs',
      label: 'Programs',
      value: '4',
      change: '-20%',
      changeDirection: 'negative',
      footerHeadline: 'Down 20% this period',
      footerSubtext: 'Assignment volume needs attention',
      icon: CalendarRange,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '148',
      change: '+12.5%',
      changeDirection: 'positive',
      footerHeadline: 'Strong athlete retention',
      footerSubtext: 'Completed sessions kept climbing',
      icon: Activity,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: '84%',
      change: '+4.5%',
      changeDirection: 'positive',
      footerHeadline: 'Steady compliance increase',
      footerSubtext: 'Daily adherence meets projections',
      icon: BadgeCheck,
    },
    {
      id: 'invites',
      label: 'Pending invites',
      value: '3',
      change: '+6.8%',
      changeDirection: 'positive',
      footerHeadline: 'More coaches inviting athletes',
      footerSubtext: 'Three invites are still pending',
      icon: Send,
    },
  ],
  'last-3-months': [
    {
      id: 'athletes',
      label: 'Athletes',
      value: '14',
      change: '+16.2%',
      changeDirection: 'positive',
      footerHeadline: 'Trending up this month',
      footerSubtext: 'Quarterly athlete growth is healthy',
      icon: Users,
    },
    {
      id: 'programs',
      label: 'Programs',
      value: '9',
      change: '-9.4%',
      changeDirection: 'negative',
      footerHeadline: 'Down 20% this period',
      footerSubtext: 'Programming cadence slipped slightly',
      icon: CalendarRange,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '276',
      change: '+18.9%',
      changeDirection: 'positive',
      footerHeadline: 'Strong athlete retention',
      footerSubtext: 'Session completion stayed strong',
      icon: Activity,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: '89%',
      change: '+7.1%',
      changeDirection: 'positive',
      footerHeadline: 'Steady compliance increase',
      footerSubtext: 'Adherence is trending in the right direction',
      icon: BadgeCheck,
    },
    {
      id: 'invites',
      label: 'Pending invites',
      value: '5',
      change: '+8.6%',
      changeDirection: 'positive',
      footerHeadline: 'More coaches inviting athletes',
      footerSubtext: 'Invite flow is still active this quarter',
      icon: Send,
    },
  ],
  'last-24-hours': [
    {
      id: 'athletes',
      label: 'Athletes',
      value: '2',
      change: '+3.2%',
      changeDirection: 'positive',
      footerHeadline: 'Trending up this month',
      footerSubtext: 'A small but healthy daily uptick',
      icon: Users,
    },
    {
      id: 'programs',
      label: 'Programs',
      value: '1',
      change: '-4.8%',
      changeDirection: 'negative',
      footerHeadline: 'Down 20% this period',
      footerSubtext: 'No new assignments landed today',
      icon: CalendarRange,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '24',
      change: '+5.7%',
      changeDirection: 'positive',
      footerHeadline: 'Strong athlete retention',
      footerSubtext: 'Today\'s session volume is solid',
      icon: Activity,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: '79%',
      change: '+2.1%',
      changeDirection: 'positive',
      footerHeadline: 'Steady compliance increase',
      footerSubtext: 'Check-ins improved through the day',
      icon: BadgeCheck,
    },
    {
      id: 'invites',
      label: 'Pending invites',
      value: '1',
      change: '+1.2%',
      changeDirection: 'positive',
      footerHeadline: 'More coaches inviting athletes',
      footerSubtext: 'One invite still needs a reply',
      icon: Send,
    },
  ],
  'last-year': [
    {
      id: 'athletes',
      label: 'Athletes',
      value: '32',
      change: '+24.6%',
      changeDirection: 'positive',
      footerHeadline: 'Trending up this month',
      footerSubtext: 'Yearly athlete growth beat projections',
      icon: Users,
    },
    {
      id: 'programs',
      label: 'Programs',
      value: '18',
      change: '-7.3%',
      changeDirection: 'negative',
      footerHeadline: 'Down 20% this period',
      footerSubtext: 'Program refresh pace softened this year',
      icon: CalendarRange,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '684',
      change: '+27.2%',
      changeDirection: 'positive',
      footerHeadline: 'Strong athlete retention',
      footerSubtext: 'Sessions kept compounding over the year',
      icon: Activity,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: '91%',
      change: '+9.3%',
      changeDirection: 'positive',
      footerHeadline: 'Steady compliance increase',
      footerSubtext: 'Adherence finished ahead of target',
      icon: BadgeCheck,
    },
    {
      id: 'invites',
      label: 'Pending invites',
      value: '7',
      change: '+10.4%',
      changeDirection: 'positive',
      footerHeadline: 'More coaches inviting athletes',
      footerSubtext: 'Invite demand stayed high this year',
      icon: Send,
    },
  ],
}

const interactiveAreaChartData = [
  { date: '2024-04-01', desktop: 222, mobile: 150 },
  { date: '2024-04-02', desktop: 97, mobile: 180 },
  { date: '2024-04-03', desktop: 167, mobile: 120 },
  { date: '2024-04-04', desktop: 242, mobile: 260 },
  { date: '2024-04-05', desktop: 373, mobile: 290 },
  { date: '2024-04-06', desktop: 301, mobile: 340 },
  { date: '2024-04-07', desktop: 245, mobile: 180 },
  { date: '2024-04-08', desktop: 409, mobile: 320 },
  { date: '2024-04-09', desktop: 59, mobile: 110 },
  { date: '2024-04-10', desktop: 261, mobile: 190 },
  { date: '2024-04-11', desktop: 327, mobile: 350 },
  { date: '2024-04-12', desktop: 292, mobile: 210 },
  { date: '2024-04-13', desktop: 342, mobile: 380 },
  { date: '2024-04-14', desktop: 137, mobile: 220 },
  { date: '2024-04-15', desktop: 120, mobile: 170 },
  { date: '2024-04-16', desktop: 138, mobile: 190 },
  { date: '2024-04-17', desktop: 446, mobile: 360 },
  { date: '2024-04-18', desktop: 364, mobile: 410 },
  { date: '2024-04-19', desktop: 243, mobile: 180 },
  { date: '2024-04-20', desktop: 89, mobile: 150 },
  { date: '2024-04-21', desktop: 137, mobile: 200 },
  { date: '2024-04-22', desktop: 224, mobile: 170 },
  { date: '2024-04-23', desktop: 138, mobile: 230 },
  { date: '2024-04-24', desktop: 387, mobile: 290 },
  { date: '2024-04-25', desktop: 215, mobile: 250 },
  { date: '2024-04-26', desktop: 75, mobile: 130 },
  { date: '2024-04-27', desktop: 383, mobile: 420 },
  { date: '2024-04-28', desktop: 122, mobile: 180 },
  { date: '2024-04-29', desktop: 315, mobile: 240 },
  { date: '2024-04-30', desktop: 454, mobile: 380 },
  { date: '2024-05-01', desktop: 165, mobile: 220 },
  { date: '2024-05-02', desktop: 293, mobile: 310 },
  { date: '2024-05-03', desktop: 247, mobile: 190 },
  { date: '2024-05-04', desktop: 385, mobile: 420 },
  { date: '2024-05-05', desktop: 481, mobile: 390 },
  { date: '2024-05-06', desktop: 498, mobile: 520 },
  { date: '2024-05-07', desktop: 388, mobile: 300 },
  { date: '2024-05-08', desktop: 149, mobile: 210 },
  { date: '2024-05-09', desktop: 227, mobile: 180 },
  { date: '2024-05-10', desktop: 293, mobile: 330 },
  { date: '2024-05-11', desktop: 335, mobile: 270 },
  { date: '2024-05-12', desktop: 197, mobile: 240 },
  { date: '2024-05-13', desktop: 197, mobile: 160 },
  { date: '2024-05-14', desktop: 448, mobile: 490 },
  { date: '2024-05-15', desktop: 473, mobile: 380 },
  { date: '2024-05-16', desktop: 338, mobile: 400 },
  { date: '2024-05-17', desktop: 499, mobile: 420 },
  { date: '2024-05-18', desktop: 315, mobile: 350 },
  { date: '2024-05-19', desktop: 235, mobile: 180 },
  { date: '2024-05-20', desktop: 177, mobile: 230 },
  { date: '2024-05-21', desktop: 82, mobile: 140 },
  { date: '2024-05-22', desktop: 81, mobile: 120 },
  { date: '2024-05-23', desktop: 252, mobile: 290 },
  { date: '2024-05-24', desktop: 294, mobile: 220 },
  { date: '2024-05-25', desktop: 201, mobile: 250 },
  { date: '2024-05-26', desktop: 213, mobile: 170 },
  { date: '2024-05-27', desktop: 420, mobile: 460 },
  { date: '2024-05-28', desktop: 233, mobile: 190 },
  { date: '2024-05-29', desktop: 78, mobile: 130 },
  { date: '2024-05-30', desktop: 340, mobile: 280 },
  { date: '2024-05-31', desktop: 178, mobile: 230 },
  { date: '2024-06-01', desktop: 178, mobile: 200 },
  { date: '2024-06-02', desktop: 470, mobile: 410 },
  { date: '2024-06-03', desktop: 103, mobile: 160 },
  { date: '2024-06-04', desktop: 439, mobile: 380 },
  { date: '2024-06-05', desktop: 88, mobile: 140 },
  { date: '2024-06-06', desktop: 294, mobile: 250 },
  { date: '2024-06-07', desktop: 323, mobile: 370 },
  { date: '2024-06-08', desktop: 385, mobile: 320 },
  { date: '2024-06-09', desktop: 438, mobile: 480 },
  { date: '2024-06-10', desktop: 155, mobile: 200 },
  { date: '2024-06-11', desktop: 92, mobile: 150 },
  { date: '2024-06-12', desktop: 492, mobile: 420 },
  { date: '2024-06-13', desktop: 81, mobile: 130 },
  { date: '2024-06-14', desktop: 426, mobile: 380 },
  { date: '2024-06-15', desktop: 307, mobile: 350 },
  { date: '2024-06-16', desktop: 371, mobile: 310 },
  { date: '2024-06-17', desktop: 475, mobile: 520 },
  { date: '2024-06-18', desktop: 107, mobile: 170 },
  { date: '2024-06-19', desktop: 341, mobile: 290 },
  { date: '2024-06-20', desktop: 408, mobile: 450 },
  { date: '2024-06-21', desktop: 169, mobile: 210 },
  { date: '2024-06-22', desktop: 317, mobile: 270 },
  { date: '2024-06-23', desktop: 480, mobile: 530 },
  { date: '2024-06-24', desktop: 132, mobile: 180 },
  { date: '2024-06-25', desktop: 141, mobile: 190 },
  { date: '2024-06-26', desktop: 434, mobile: 380 },
  { date: '2024-06-27', desktop: 448, mobile: 490 },
  { date: '2024-06-28', desktop: 149, mobile: 200 },
  { date: '2024-06-29', desktop: 103, mobile: 160 },
  { date: '2024-06-30', desktop: 446, mobile: 400 },
]

const interactiveAreaChartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: '#3BE0AF',
  },
  mobile: {
    label: 'Mobile',
    color: '#8571F4',
  },
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
  'last-24-hours': {
    total: '24',
    change: '5.7%',
    changeDirection: 'positive',
    rangeLabel: 'Last 24 hours',
    tooltipValue: '24',
    tooltipChange: '5.7%',
    tooltipDate: 'Today',
    labels: ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '11 PM'],
    completed: [2, 3, 6, 8, 12, 18, 24],
    assigned: [3, 4, 6, 7, 10, 14, 17],
    activeIndex: 5,
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
  'last-24-hours': {
    value: '79%',
    change: '2.1%',
    changeDirection: 'positive',
    footer: 'Last 24 hours',
    bars: [24, 36, 28, 44, 38, 50, 42, 58],
  },
  'last-year': {
    value: '91%',
    change: '9.3%',
    changeDirection: 'positive',
    footer: 'Last year',
    bars: [24, 36, 40, 44, 48, 52, 58, 56, 62, 68, 72, 78],
  },
}

const areaChartLegendData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const areaChartLegendConfig = {
  desktop: {
    label: 'Desktop',
    color: '#3BE0AF',
  },
  mobile: {
    label: 'Mobile',
    color: '#8571F4',
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
    yAxis: ['50', '25', '10', '5'],
    points: [12, 18, 16, 24, 32, 44, 35, 20],
  },
  'last-24-hours': {
    total: '11',
    change: '4.8%',
    changeDirection: 'positive',
    labels: ['12 AM', '8 AM', '4 PM', '11 PM'],
    yAxis: ['30', '20', '10', '0'],
    points: [4, 6, 12, 9, 17, 23, 14, 6],
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
    <TrendingDown className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
  ) : (
    <TrendingUp className="admin-shell-overview-card-change-arrow-icon" aria-hidden="true" />
  )
}

function OverviewSummaryCard({ card }) {
  return (
    <Card className="@container/card h-full">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2 space-y-0 pb-3">
        <CardDescription className="admin-shell-overview-card-label-row">
          <span className="admin-shell-overview-card-label">{card.label}</span>
        </CardDescription>
        <CardAction>
          <Badge
            tone={card.changeDirection === 'negative' ? 'danger' : 'success'}
            className={`admin-shell-overview-card-badge ${card.changeDirection === 'negative' ? 'admin-shell-overview-card-badge-negative' : 'admin-shell-overview-card-badge-positive'}`}
          >
            {card.change}
            <TrendArrowIcon direction={card.changeDirection} />
          </Badge>
        </CardAction>
        <CardTitle className="text-[2.6rem] font-semibold leading-none tabular-nums">{card.value}</CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium text-[var(--admin-dashboard-card-text)]">
          {card.footerHeadline} <TrendArrowIcon direction={card.changeDirection} />
        </div>
        <div className="text-[var(--admin-dashboard-card-muted)]">{card.footerSubtext}</div>
      </CardFooter>
    </Card>
  )
}

function getChartTicks(maxValue, segments = 3) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const ratio = 1 - index / segments
    return Math.max(0, Math.round(maxValue * ratio))
  })
}

function getSessionLabelPositions(pointCount, labelCount) {
  if (pointCount <= 1 || labelCount <= 1) {
    return [0]
  }

  return Array.from({ length: labelCount }, (_, index) => Math.round((index / (labelCount - 1)) * (pointCount - 1)))
}

function PerformanceLineDot({ cx, cy, payload }) {
  if (typeof cx !== 'number' || typeof cy !== 'number') {
    return null
  }

  const isActive = Boolean(payload?.isActive)

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isActive ? 7 : 4}
      fill="#3be0af"
      stroke={isActive ? '#f5f8ff' : 'rgba(11, 18, 30, 0.92)'}
      strokeWidth={isActive ? 3 : 2}
    />
  )
}

function AreaChartInteractiveCard() {
  const [timeRange, setTimeRange] = useState('90d')

  const filteredData = useMemo(() => {
    const referenceDate = new Date('2024-06-30')
    const daysToSubtract = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 90
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return interactiveAreaChartData.filter((item) => new Date(item.date) >= startDate)
  }, [timeRange])

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-[var(--admin-dashboard-chart-header-divider)] py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>Showing total visitors for the last 3 months</CardDescription>
        </div>
        <CardAction>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={interactiveAreaChartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart accessibilityLayer data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tickMargin={8}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="mobile" type="natural" fill="url(#fillMobile)" stroke="var(--color-mobile)" stackId="a" />
            <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" stroke="var(--color-desktop)" stackId="a" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function BarChartMultipleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaChartLegendConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={areaChartLegendData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium text-[var(--admin-dashboard-card-text)]">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-[var(--admin-dashboard-card-muted)]">Showing total visitors for the last 6 months</div>
      </CardFooter>
    </Card>
  )
}

function SessionTimeChart({ data }) {
  const chartConfig = {
    sessions: {
      label: 'Sessions',
      color: '#AEB9E1',
    },
  }

  const labelPositions = getSessionLabelPositions(data.points.length, data.labels.length)
  const labelMap = Object.fromEntries(labelPositions.map((position, index) => [position, data.labels[index] ?? '']))
  const chartData = data.points.map((value, index) => ({
    index,
    label: labelMap[index] ?? '',
    sessions: value,
  }))
  const tickValues = [...new Set(data.yAxis.map((tick) => Number(tick)).filter((tick) => Number.isFinite(tick)))].sort((a, b) => b - a)
  const maxValue = Math.max(...data.points, ...tickValues) * 1.15

  return (
    <div className="admin-shell-overview-session-chart">
      <ChartContainer config={chartConfig} className="h-[132px] w-full">
        <LineChart data={chartData} accessibilityLayer margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
          <XAxis
            axisLine={false}
            dataKey="index"
            domain={[0, data.points.length - 1]}
            tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
            tickFormatter={(value) => labelMap[value] ?? ''}
            tickLine={false}
            tickMargin={10}
            ticks={labelPositions}
            type="number"
          />
          <YAxis
            axisLine={false}
            domain={[0, maxValue]}
            tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            tickMargin={8}
            ticks={tickValues}
            width={28}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ stroke: 'var(--admin-dashboard-chart-grid)', strokeWidth: 1 }} />
          <Line dataKey="sessions" dot={false} stroke="#AEB9E1" strokeWidth={3} type="monotone" />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

function AreaChartLegendCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Legend</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaChartLegendConfig} className="h-[220px] w-full">
          <AreaChart
            accessibilityLayer
            data={areaChartLegendData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--admin-dashboard-chart-grid)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'var(--admin-dashboard-chart-tick)', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="mobile"
              type="natural"
              fill="var(--color-mobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium text-[var(--admin-dashboard-card-text)]">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-[var(--admin-dashboard-card-muted)]">January - June 2024</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function DashboardOverview() {
  const activeRange = 'last-month'

  const cards = overviewRangeCardData[activeRange] ?? overviewRangeCardData['last-month']
  const summaryCardRows = [cards.slice(0, 3), cards.slice(3)]
  const performance = overviewPerformanceData[activeRange] ?? overviewPerformanceData['last-month']
  const compliance = overviewComplianceData[activeRange] ?? overviewComplianceData['last-month']
  const sessionTiming = overviewSessionTimeData[activeRange] ?? overviewSessionTimeData['last-month']

  return (
    <section className="admin-shell-overview" aria-label="Dashboard overview">
      <div className="admin-shell-overview-toolbar">
        <div className="admin-shell-workspace-header">
          <h1 className="admin-shell-workspace-title">Dashboard</h1>
        </div>
      </div>

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

      <section className="admin-shell-overview-analytics-layout" aria-label="Dashboard analytics panels">
        <AreaChartInteractiveCard />

        <div className="admin-shell-overview-bottom-row">
          <BarChartMultipleCard />
          <AreaChartLegendCard />
        </div>
      </section>
    </section>
  )
}
