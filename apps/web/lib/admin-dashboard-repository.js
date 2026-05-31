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

function createSummaryMetric({ id, label, value, previousValue = 0, footerHeadline, footerSubtext }) {
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

function createPlanAdherenceMetric(currentCompletedDue, currentDue, previousCompletedDue, previousDue) {
  const currentPercent = currentDue ? Math.round((currentCompletedDue / currentDue) * 100) : 0
  const previousPercent = previousDue ? Math.round((previousCompletedDue / previousDue) * 100) : 0
  const trend = createTrend(currentPercent, previousPercent)
  return {
    id: 'planAdherence',
    label: 'Plan adherence',
    value: `${currentPercent}%`,
    change: trend.change,
    changeDirection: trend.direction,
    footerHeadline: currentDue ? 'Completed due scheduled work' : 'No due workouts yet',
    footerSubtext: currentDue ? `${currentCompletedDue} of ${currentDue} due workouts completed` : 'No due workouts in this range',
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

function isDueWorkout(row, now) {
  if (row?.status === 'skipped' || row?.status === 'cancelled') return false
  const scheduledDate = valueDate(row, ['scheduled_date', 'created_at'])
  return Boolean(scheduledDate) && scheduledDate.getTime() <= now.getTime()
}

function isMissedWorkout(row) {
  return row?.status === 'missed'
}

function isCompletedSession(row) {
  return row?.status === 'completed' && Boolean(row?.completed_at)
}

function isPendingInvite(row, now) {
  if (row?.used_at || row?.revoked_at) return false
  const expiresAt = parseDate(row?.expires_at)
  return !expiresAt || expiresAt.getTime() >= now.getTime()
}

function countCompletedDueWorkouts(dueWorkouts, completedSessionRows) {
  const dueById = new Map(dueWorkouts.map((row) => [row.id, row]))
  const completedDueIds = new Set(
    completedSessionRows
      .map((row) => row.program_workout_id)
      .filter((id) => id && dueById.has(id)),
  )

  for (const workout of dueWorkouts) {
    if (workout.status === 'completed') {
      completedDueIds.add(workout.id)
    }
  }

  return completedDueIds.size
}

function createTrainingExecution({ window, dueWorkoutRows, completedSessionRows }) {
  const bucketWindows = createBuckets(window)
  const buckets = bucketWindows.map((bucket) => {
    const dueRows = dueWorkoutRows.filter((row) => isBetween(valueDate(row, ['scheduled_date', 'created_at']), bucket.start, bucket.end))
    const completedRows = completedSessionRows.filter((row) => isBetween(valueDate(row, ['completed_at']), bucket.start, bucket.end))
    return {
      label: bucket.label,
      completed: completedRows.length,
      assigned: dueRows.length,
      missed: dueRows.filter(isMissedWorkout).length,
    }
  })
  const total = buckets.reduce((sum, bucket) => sum + bucket.completed, 0)
  const dueTotal = buckets.reduce((sum, bucket) => sum + bucket.assigned, 0)
  const missedTotal = buckets.reduce((sum, bucket) => sum + bucket.missed, 0)
  return {
    title: 'Training execution',
    total,
    dueTotal,
    missedTotal,
    value: `${total} completed`,
    trend: createTrend(total, countRowsInWindow(completedSessionRows, ['completed_at'], { start: window.previousStart, end: window.previousEnd })).change,
    rangeLabel: labelForRange(window.range),
    buckets,
    legend: ['Completed', 'Assigned', 'Missed'],
    footer: dueTotal ? `${total} completed · ${dueTotal} due · ${missedTotal} missed` : 'No due workouts in this range',
  }
}

function createPlanAdherenceChart({ window, dueWorkoutRows, completedSessionRows }) {
  const bucketWindows = createBuckets(window)
  const buckets = bucketWindows.map((bucket) => {
    const dueRows = dueWorkoutRows.filter((row) => isBetween(valueDate(row, ['scheduled_date', 'created_at']), bucket.start, bucket.end))
    const completedRows = completedSessionRows.filter((row) => isBetween(valueDate(row, ['completed_at']), bucket.start, bucket.end))
    const completedDue = countCompletedDueWorkouts(dueRows, completedRows)
    const adherence = dueRows.length ? Math.round((completedDue / dueRows.length) * 100) : 0
    return { label: bucket.label, completed: completedDue, assigned: dueRows.length, adherence }
  })
  const currentDue = dueWorkoutRows.length
  const currentCompletedDue = countCompletedDueWorkouts(dueWorkoutRows, completedSessionRows)
  return {
    title: 'Plan adherence',
    value: formatPercent(currentCompletedDue, currentDue),
    trend: createTrend(currentDue ? Math.round((currentCompletedDue / currentDue) * 100) : 0, 0).change,
    buckets,
    footer: currentDue ? `${currentCompletedDue} of ${currentDue} due workouts completed` : 'No due workouts in this range',
  }
}

function formatUtcDateKey(date) {
  return startOfUtcDay(date).toISOString().slice(0, 10)
}

function createWorkoutResults({ dueWorkoutRows, completedSessionRows, workoutTemplateRows }) {
  const templateById = new Map(
    workoutTemplateRows
      .filter((template) => template?.id)
      .map((template) => [template.id, template]),
  )
  const bucketByKey = new Map()

  function resolveWorkout(row) {
    const template = templateById.get(row?.workout_template_id)
    const workoutName = row?.name_snapshot || template?.name || 'Untitled workout'
    const category = template?.training_type || 'Uncategorized'
    return { workoutName, category }
  }

  function getBucket(row) {
    const { workoutName, category } = resolveWorkout(row)
    const key = `${workoutName}::${category}`
    const bucket = bucketByKey.get(key) ?? { workoutName, category, assigned: 0, completed: 0, missed: 0 }
    bucketByKey.set(key, bucket)
    return bucket
  }

  const dueById = new Map(dueWorkoutRows.map((row) => [row.id, row]))

  for (const workout of dueWorkoutRows) {
    const bucket = getBucket(workout)
    if (workout.status === 'missed') {
      bucket.missed += 1
    } else if (workout.status === 'completed') {
      // A completed scheduled workout is still one assigned workout on the chart.
      bucket.assigned += 0
    } else {
      bucket.assigned += 1
    }
  }

  for (const session of completedSessionRows) {
    const workout = dueById.get(session.program_workout_id)
    if (!workout) continue
    const bucket = getBucket(workout)
    bucket.completed += 1
  }

  return {
    title: 'Workout results',
    statusOptions: ['Assigned', 'Completed', 'Missed'],
    categoryOptions: ['Warmup', 'Speed Accelerator', 'Edge Work', 'Conditioning'],
    buckets: [...bucketByKey.values()].filter((bucket) => bucket.assigned || bucket.completed || bucket.missed),
  }
}

function createTrainingConsistency({ activeAthletes, window, completedSessionRows }) {
  const activeAthleteIds = new Set(activeAthletes.map((athlete) => athlete.id).filter(Boolean))
  const lastSevenDaysWindow = { start: addDays(window.end, -7), end: window.end }
  const activeThisWeek = new Set(
    completedSessionRows
      .filter((row) => activeAthleteIds.has(row.athlete_id))
      .filter((row) => isBetween(valueDate(row, ['completed_at']), lastSevenDaysWindow.start, lastSevenDaysWindow.end))
      .map((row) => row.athlete_id)
      .filter(Boolean),
  )

  const dailyActivityByDate = new Map()
  for (const session of completedSessionRows) {
    if (!activeAthleteIds.has(session.athlete_id)) continue
    const completedAt = valueDate(session, ['completed_at'])
    if (!isBetween(completedAt, window.start, window.end)) continue

    const date = formatUtcDateKey(completedAt)
    const activity = dailyActivityByDate.get(date) ?? { date, completedSessions: 0, activeAthleteIds: new Set() }
    activity.completedSessions += 1
    activity.activeAthleteIds.add(session.athlete_id)
    dailyActivityByDate.set(date, activity)
  }

  const dailyActivity = [...dailyActivityByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((activity) => ({
      date: activity.date,
      completedSessions: activity.completedSessions,
      activeAthletes: activity.activeAthleteIds.size,
    }))

  return {
    title: 'Training consistency',
    value: `${activeThisWeek.size} / ${activeAthletes.length}`,
    footer: 'Based on completed workout sessions',
    heatmapReady: dailyActivity.length > 0,
    activeThisWeek: activeThisWeek.size,
    activeAthleteCount: activeAthletes.length,
    dailyActivity,
  }
}

function countNeedsAttention({ activeAthletes, dueWorkoutRows, completedSessionRows, now }) {
  const missedByAthlete = new Map()
  for (const workout of dueWorkoutRows.filter(isMissedWorkout)) {
    if (!workout.athlete_id) continue
    missedByAthlete.set(workout.athlete_id, (missedByAthlete.get(workout.athlete_id) ?? 0) + 1)
  }

  const lastSevenDaysWindow = { start: addDays(now, -7), end: now }
  const recentlyActiveAthletes = new Set(
    completedSessionRows
      .filter((row) => isBetween(valueDate(row, ['completed_at']), lastSevenDaysWindow.start, lastSevenDaysWindow.end))
      .map((row) => row.athlete_id)
      .filter(Boolean),
  )

  return activeAthletes.filter((athlete) => {
    const missedCount = missedByAthlete.get(athlete.id) ?? 0
    return missedCount >= 2 || !recentlyActiveAthletes.has(athlete.id)
  }).length
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
      const [athleteRows, programRows, workoutTemplateRows, exerciseRows, assignmentRows, sessionRows, inviteRows] = await Promise.all([
        requestTable('athlete_profiles', '?select=id,status,created_at'),
        requestTable('programs', '?select=id,status,created_at'),
        requestTable('workout_templates', '?select=id,name,training_type,status,created_at'),
        requestTable('exercises', '?select=id,created_at'),
        requestTable('program_workouts', '?select=id,athlete_id,workout_template_id,name_snapshot,status,scheduled_date,created_at'),
        requestTable('workout_sessions', '?select=id,athlete_id,program_workout_id,status,completed_at,started_at,created_at'),
        requestTable('athlete_invitations', '?select=id,used_at,revoked_at,expires_at,created_at'),
      ])

      const athletes = Array.isArray(athleteRows) ? athleteRows : []
      const activeAthletes = athletes.filter(isActiveAthlete)
      const activePrograms = (Array.isArray(programRows) ? programRows : []).filter((row) => row?.status !== 'archived')
      const activeWorkoutTemplates = (Array.isArray(workoutTemplateRows) ? workoutTemplateRows : []).filter((row) => row?.status !== 'archived')
      const exercises = Array.isArray(exerciseRows) ? exerciseRows : []
      const assignments = Array.isArray(assignmentRows) ? assignmentRows : []
      const completedSessions = (Array.isArray(sessionRows) ? sessionRows : []).filter(isCompletedSession)
      const invites = Array.isArray(inviteRows) ? inviteRows : []
      const dueWorkouts = assignments.filter((row) => isDueWorkout(row, new Date(now)) && isBetween(valueDate(row, ['scheduled_date', 'created_at']), window.start, window.end))
      const currentCompletedSessions = completedSessions.filter((row) => isBetween(valueDate(row, ['completed_at']), window.start, window.end))
      const pendingInviteCount = invites.filter((row) => isPendingInvite(row, new Date(now))).length

      const summary = {
        athletes: createSummaryMetric({
          id: 'athletes',
          label: 'Athletes',
          value: activeAthletes.length,
          previousValue: activeAthletes.length,
          footerHeadline: activeAthletes.length ? 'Current coach-visible roster' : 'No athletes yet',
          footerSubtext: `${activeAthletes.length} active athletes`,
        }),
        programs: createSummaryMetric({
          id: 'programs',
          label: 'Programs',
          value: activePrograms.length,
          previousValue: activePrograms.length,
          footerHeadline: activePrograms.length ? 'Current program library' : 'No programs yet',
          footerSubtext: `${activePrograms.length} non-archived programs`,
        }),
        workouts: createSummaryMetric({
          id: 'workouts',
          label: 'Workouts',
          value: activeWorkoutTemplates.length,
          previousValue: activeWorkoutTemplates.length,
          footerHeadline: activeWorkoutTemplates.length ? 'Workout template library' : 'No workouts yet',
          footerSubtext: `${activeWorkoutTemplates.length} non-archived workouts`,
        }),
        exercises: createSummaryMetric({
          id: 'exercises',
          label: 'Exercises',
          value: exercises.length,
          previousValue: exercises.length,
          footerHeadline: exercises.length ? 'Exercise library' : 'No exercises yet',
          footerSubtext: `${exercises.length} exercises available`,
        }),
        invites: createSummaryMetric({
          id: 'invites',
          label: 'Invites',
          value: pendingInviteCount,
          previousValue: pendingInviteCount,
          footerHeadline: pendingInviteCount ? 'Pending athlete invites' : 'No pending invites',
          footerSubtext: `${pendingInviteCount} pending invites`,
        }),
      }

      return {
        range,
        rangeLabel: labelForRange(range),
        generatedAt: new Date(now).toISOString(),
        summary,
        trainingExecution: createTrainingExecution({ window, dueWorkoutRows: dueWorkouts, completedSessionRows: currentCompletedSessions }),
        workoutResults: createWorkoutResults({ dueWorkoutRows: dueWorkouts, completedSessionRows: currentCompletedSessions, workoutTemplateRows: activeWorkoutTemplates }),
        trainingConsistency: createTrainingConsistency({ activeAthletes, window, completedSessionRows: completedSessions }),
      }
    },
  }
}
