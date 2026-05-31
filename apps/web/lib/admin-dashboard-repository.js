const DASHBOARD_RANGE_OPTIONS = new Set(['last-7-days', 'last-month', 'last-3-months', 'last-year'])

const DAY_MS = 24 * 60 * 60 * 1000

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function getRepositoryConfig(overrides = {}) {
  const supabaseUrl = overrides.supabaseUrl ?? process.env.SUPABASE_URL
  const serviceRoleKey = overrides.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
  }
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

function getRangeWindow(range, nowInput) {
  const now = new Date(nowInput)
  const end = now
  const daysByRange = {
    'last-7-days': 7,
    'last-month': 30,
    'last-3-months': 90,
    'last-year': 365,
  }
  const days = daysByRange[range]
  if (!days) {
    throw createRepositoryError(`Unsupported dashboard range: ${range}`, 400)
  }

  const start = new Date(now.getTime() - days * DAY_MS)
  const previousStart = new Date(start.getTime() - days * DAY_MS)

  return { range, days, start, end, previousStart, previousEnd: start }
}

function isBetween(date, start, end) {
  if (!date) return false
  const time = date.getTime()
  return time >= start.getTime() && time < end.getTime()
}

function valueDate(row, keys) {
  for (const key of keys) {
    const date = parseDate(row?.[key])
    if (date) return date
  }
  return null
}

function countRowsInWindow(rows, keys, window, predicate = () => true) {
  return rows.filter((row) => predicate(row) && isBetween(valueDate(row, keys), window.start, window.end)).length
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0%'
  return `${Math.round((numerator / denominator) * 100)}%`
}

function createTrend(current, previous) {
  if (!previous && !current) return { change: '0%', direction: 'neutral' }
  if (!previous) return { change: current > 0 ? '+100%' : '0%', direction: current > 0 ? 'positive' : 'neutral' }
  const raw = ((current - previous) / previous) * 100
  const rounded = Math.round(Math.abs(raw))
  if (rounded === 0) return { change: '0%', direction: 'neutral' }
  return {
    change: `${raw > 0 ? '+' : '-'}${rounded}%`,
    direction: raw < 0 ? 'negative' : 'positive',
  }
}

function createSummaryMetric({ id, label, value, previousValue, footerHeadline, footerSubtext }) {
  const trend = createTrend(value, previousValue)
  return {
    id,
    label,
    value: String(value),
    change: trend.change,
    changeDirection: trend.direction,
    footerHeadline,
    footerSubtext,
  }
}

function createComplianceMetric(currentCompleted, currentAssigned, previousCompleted, previousAssigned) {
  const currentPercent = currentAssigned ? Math.round((currentCompleted / currentAssigned) * 100) : 0
  const previousPercent = previousAssigned ? Math.round((previousCompleted / previousAssigned) * 100) : 0
  const trend = createTrend(currentPercent, previousPercent)
  return {
    id: 'compliance',
    label: 'Compliance',
    value: `${currentPercent}%`,
    change: trend.change,
    changeDirection: trend.direction,
    footerHeadline: currentAssigned ? 'Real assigned session adherence' : 'No assigned sessions yet',
    footerSubtext: currentAssigned ? `${currentCompleted} of ${currentAssigned} assigned sessions completed` : 'No assigned sessions in this range',
  }
}

function createBuckets(window) {
  if (window.range === 'last-7-days') {
    return Array.from({ length: 7 }, (_, index) => {
      const start = startOfUtcDay(addDays(window.end, -6 + index))
      const end = addDays(start, 1)
      return { label: start.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), start, end }
    })
  }

  if (window.range === 'last-year') {
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(Date.UTC(window.end.getUTCFullYear(), window.end.getUTCMonth() - 11 + index, 1))
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
      return { label: start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), start, end }
    })
  }

  const bucketCount = window.range === 'last-3-months' ? 6 : 4
  const bucketDays = Math.ceil(window.days / bucketCount)
  return Array.from({ length: bucketCount }, (_, index) => {
    const start = addDays(window.start, index * bucketDays)
    const end = index === bucketCount - 1 ? window.end : addDays(start, bucketDays)
    return { label: `W${index + 1}`, start, end }
  })
}

function createSessionsChart({ window, assignmentRows, completedSessionRows }) {
  const bucketWindows = createBuckets(window)
  const buckets = bucketWindows.map((bucket) => ({
    label: bucket.label,
    completed: countRowsInWindow(completedSessionRows, ['completed_at'], bucket),
    assigned: countRowsInWindow(assignmentRows, ['scheduled_date', 'created_at'], bucket, isAssignedWorkout),
  }))
  const total = buckets.reduce((sum, bucket) => sum + bucket.completed, 0)
  const assignedTotal = buckets.reduce((sum, bucket) => sum + bucket.assigned, 0)
  return {
    title: 'Sessions',
    total,
    value: String(total),
    trend: createTrend(total, countRowsInWindow(completedSessionRows, ['completed_at'], { start: window.previousStart, end: window.previousEnd })).change,
    rangeLabel: labelForRange(window.range),
    buckets,
    legend: ['Completed', 'Assigned'],
    footer: assignedTotal ? `${total} completed of ${assignedTotal} assigned` : 'No assigned sessions in this range',
  }
}

function createComplianceChart({ window, assignmentRows, completedSessionRows }) {
  const bucketWindows = createBuckets(window)
  const buckets = bucketWindows.map((bucket) => {
    const assigned = countRowsInWindow(assignmentRows, ['scheduled_date', 'created_at'], bucket, isAssignedWorkout)
    const completed = countRowsInWindow(completedSessionRows, ['completed_at'], bucket)
    const compliance = assigned ? Math.round((completed / assigned) * 100) : 0
    return { label: bucket.label, completed, assigned, compliance }
  })
  const currentAssigned = countRowsInWindow(assignmentRows, ['scheduled_date', 'created_at'], window, isAssignedWorkout)
  const currentCompleted = countRowsInWindow(completedSessionRows, ['completed_at'], window)
  return {
    title: 'Overall compliance',
    value: formatPercent(currentCompleted, currentAssigned),
    trend: createTrend(currentAssigned ? Math.round((currentCompleted / currentAssigned) * 100) : 0, 0).change,
    buckets,
    footer: currentAssigned ? `${currentCompleted} of ${currentAssigned} assigned sessions` : 'No assigned sessions in this range',
  }
}

function createSessionsByTime({ window, completedSessionRows }) {
  const rows = completedSessionRows.filter((row) => isBetween(valueDate(row, ['completed_at']), window.start, window.end))
  const buckets = [
    { label: 'Early', value: 0 },
    { label: 'Morning', value: 0 },
    { label: 'Afternoon', value: 0 },
    { label: 'Evening', value: 0 },
  ]

  for (const row of rows) {
    const date = valueDate(row, ['completed_at'])
    const hour = date.getUTCHours()
    if (hour < 6) buckets[0].value += 1
    else if (hour < 12) buckets[1].value += 1
    else if (hour < 18) buckets[2].value += 1
    else buckets[3].value += 1
  }

  return {
    title: 'Sessions by time of the day',
    total: rows.length,
    value: String(rows.length),
    trend: createTrend(rows.length, countRowsInWindow(completedSessionRows, ['completed_at'], { start: window.previousStart, end: window.previousEnd })).change,
    buckets,
    footer: rows.length ? 'Based on completed session timestamps' : 'No completed sessions in this range',
  }
}

function labelForRange(range) {
  return overviewRangeLabelById[range] ?? 'Selected range'
}

const overviewRangeLabelById = {
  'last-7-days': 'Last 7 days',
  'last-month': 'Last month',
  'last-3-months': 'Last 3 months',
  'last-year': 'Last year',
}

function isActiveAthlete(row) {
  return row?.status !== 'inactive' && row?.status !== 'archived'
}

function isActiveProgram(row) {
  return row?.status !== 'archived'
}

function isAssignedWorkout(row) {
  return row?.status !== 'skipped' && row?.status !== 'cancelled'
}

function isCompletedSession(row) {
  return row?.status === 'completed' && Boolean(row?.completed_at)
}

function isPendingInvite(row, now) {
  if (row?.used_at || row?.revoked_at) return false
  const expiresAt = parseDate(row?.expires_at)
  return !expiresAt || expiresAt.getTime() >= now.getTime()
}

export function createAdminDashboardRepository(options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const now = options.now ?? new Date()

  async function requestTable(table, query = '') {
    const { baseRestUrl, serviceRoleKey } = getRepositoryConfig(options)
    const response = await fetchImpl(`${baseRestUrl}/${table}${query}`, {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      throw createRepositoryError(`${table} request failed: ${response.status} ${text}`, response.status)
    }

    return response.json()
  }

  return {
    async getOverview({ range = 'last-month' } = {}) {
      if (!DASHBOARD_RANGE_OPTIONS.has(range)) {
        throw createRepositoryError(`Unsupported dashboard range: ${range}`, 400)
      }

      const window = getRangeWindow(range, now)
      const [athleteRows, programRows, assignmentRows, sessionRows, inviteRows] = await Promise.all([
        requestTable('athlete_profiles', '?select=id,status,created_at'),
        requestTable('programs', '?select=id,status,created_at'),
        requestTable('program_workouts', '?select=id,status,scheduled_date,created_at'),
        requestTable('workout_sessions', '?select=id,status,completed_at,started_at,created_at'),
        requestTable('athlete_invitations', '?select=id,used_at,revoked_at,expires_at,created_at'),
      ])

      const athletes = Array.isArray(athleteRows) ? athleteRows : []
      const programs = Array.isArray(programRows) ? programRows : []
      const assignments = Array.isArray(assignmentRows) ? assignmentRows : []
      const completedSessions = (Array.isArray(sessionRows) ? sessionRows : []).filter(isCompletedSession)
      const invites = Array.isArray(inviteRows) ? inviteRows : []

      const previousWindow = { start: window.previousStart, end: window.previousEnd }
      const currentAthletes = countRowsInWindow(athletes, ['created_at'], window, isActiveAthlete)
      const previousAthletes = countRowsInWindow(athletes, ['created_at'], previousWindow, isActiveAthlete)
      const currentPrograms = countRowsInWindow(programs, ['created_at'], window, isActiveProgram)
      const previousPrograms = countRowsInWindow(programs, ['created_at'], previousWindow, isActiveProgram)
      const currentSessions = countRowsInWindow(completedSessions, ['completed_at'], window)
      const previousSessions = countRowsInWindow(completedSessions, ['completed_at'], previousWindow)
      const currentAssigned = countRowsInWindow(assignments, ['scheduled_date', 'created_at'], window, isAssignedWorkout)
      const previousAssigned = countRowsInWindow(assignments, ['scheduled_date', 'created_at'], previousWindow, isAssignedWorkout)
      const currentPendingInvites = invites.filter((row) => isPendingInvite(row, new Date(now)) && isBetween(valueDate(row, ['created_at']), window.start, window.end)).length
      const previousPendingInvites = invites.filter((row) => isPendingInvite(row, new Date(now)) && isBetween(valueDate(row, ['created_at']), window.previousStart, window.previousEnd)).length

      const summary = {
        athletes: createSummaryMetric({
          id: 'athletes',
          label: 'Athletes',
          value: currentAthletes,
          previousValue: previousAthletes,
          footerHeadline: currentAthletes ? 'Real athlete roster growth' : 'No athletes added',
          footerSubtext: currentAthletes ? `${currentAthletes} active athletes added in ${labelForRange(range)}` : 'No active athletes added in this range',
        }),
        programs: createSummaryMetric({
          id: 'programs',
          label: 'Programs',
          value: currentPrograms,
          previousValue: previousPrograms,
          footerHeadline: currentPrograms ? 'Real program activity' : 'No programs added',
          footerSubtext: currentPrograms ? `${currentPrograms} non-archived programs added` : 'No programs added in this range',
        }),
        sessions: createSummaryMetric({
          id: 'sessions',
          label: 'Sessions',
          value: currentSessions,
          previousValue: previousSessions,
          footerHeadline: currentSessions ? 'Completed sessions from logs' : 'No completed sessions',
          footerSubtext: currentSessions ? `${currentSessions} completed workout sessions` : 'No completed sessions in this range',
        }),
        compliance: createComplianceMetric(currentSessions, currentAssigned, previousSessions, previousAssigned),
        pendingInvites: createSummaryMetric({
          id: 'invites',
          label: 'Pending invites',
          value: currentPendingInvites,
          previousValue: previousPendingInvites,
          footerHeadline: currentPendingInvites ? 'Pending athlete invitations' : 'No pending invites',
          footerSubtext: currentPendingInvites ? `${currentPendingInvites} invites still pending` : 'No pending invites created in this range',
        }),
      }

      return {
        range,
        rangeLabel: labelForRange(range),
        generatedAt: new Date(now).toISOString(),
        summary,
        sessionsChart: createSessionsChart({ window, assignmentRows: assignments, completedSessionRows: completedSessions }),
        complianceChart: createComplianceChart({ window, assignmentRows: assignments, completedSessionRows: completedSessions }),
        sessionsByTime: createSessionsByTime({ window, completedSessionRows: completedSessions }),
      }
    },
  }
}
