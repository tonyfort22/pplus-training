function parseIsoCalendarDateParts(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function buildLocalDateFromIso(value) {
  const parts = parseIsoCalendarDateParts(value)
  if (!parts) return null
  return new Date(parts.year, parts.month - 1, parts.day)
}

function formatMonthDayLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeekdayUpperLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

function formatWeekRangeLabel(startDate, endDate) {
  const startLabel = formatMonthDayLabel(startDate)
  const endLabel = formatMonthDayLabel(endDate)
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  return startLabel || endLabel || 'Dates not set'
}

function formatDateNumber(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return ''
  return String(date.getDate())
}

function mapWorkoutStatusToCalendarStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed') return 'done'
  if (normalized === 'missed' || normalized === 'skipped') return 'missed'
  return 'upcoming'
}

function formatDurationFromMinutes(value, { estimated = false } = {}) {
  const minutes = Number(value)
  if (!Number.isFinite(minutes) || minutes <= 0) return ''

  const roundedMinutes = Math.round(minutes)
  const hours = Math.floor(roundedMinutes / 60)
  const remainingMinutes = roundedMinutes % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (remainingMinutes > 0 || hours === 0) parts.push(hours > 0 ? `${remainingMinutes}m` : `${remainingMinutes} min`)
  return `${estimated ? 'Est. ' : ''}${parts.join(' ')}`
}

function formatDurationFromSeconds(value, { estimated = false } = {}) {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  return formatDurationFromMinutes(Math.max(1, seconds / 60), { estimated })
}

function estimateDurationFromWorkoutSets(workout = {}) {
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : []
  const totalSets = exercises.reduce((sum, exercise) => sum + (Array.isArray(exercise?.sets) ? exercise.sets.length : Number(exercise?.setCount || exercise?.set_count || 0) || 0), 0)
  if (totalSets <= 0) return ''
  return formatDurationFromMinutes(Math.max(1, totalSets * 7), { estimated: true })
}

function getWorkoutDurationLabel(workout = {}) {
  return String(
    workout.durationLabel
      || workout.estimatedDurationLabel
      || workout.estimated_duration_label
      || workout.actualDurationLabel
      || workout.actual_duration_label
      || formatDurationFromSeconds(workout.elapsedSeconds ?? workout.elapsed_seconds ?? workout.actualDurationSeconds ?? workout.actual_duration_seconds)
      || formatDurationFromMinutes(workout.actualDurationMinutes ?? workout.actual_duration_minutes)
      || formatDurationFromSeconds(workout.estimatedDurationSeconds ?? workout.estimated_duration_seconds, { estimated: true })
      || formatDurationFromMinutes(workout.estimatedDurationMinutes ?? workout.estimated_duration_minutes, { estimated: true })
      || estimateDurationFromWorkoutSets(workout)
      || ''
  ).trim()
}

function createRestDay({ id, dayLabel, dateNumber }) {
  return {
    id,
    dayLabel,
    dateNumber,
    type: 'rest',
    workoutLabel: 'Rest Day',
  }
}

function createWorkoutDay({ id, dayLabel, dateNumber, workoutLabel, status, durationLabel = '' }) {
  return {
    id,
    dayLabel,
    dateNumber,
    type: 'workout',
    workoutLabel,
    status,
    durationLabel,
  }
}

function createTrainingCalendarWeeks() {
  return [
    {
      id: 'calendar-week-1',
      dateRangeLabel: 'Apr 5 - Apr 11',
      weekLabel: 'Week 1',
      days: [
        createRestDay({ id: 'calendar-week-1-sun', dayLabel: 'SUN', dateNumber: '5' }),
        createWorkoutDay({ id: 'calendar-week-1-mon', dayLabel: 'MON', dateNumber: '6', workoutLabel: 'Lower A', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-1-tue', dayLabel: 'TUE', dateNumber: '7', workoutLabel: 'Upper B', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-1-wed', dayLabel: 'WED', dateNumber: '8', workoutLabel: 'Upper B', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-1-thu', dayLabel: 'THU', dateNumber: '9', workoutLabel: 'Lower B', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-1-fri', dayLabel: 'FRI', dateNumber: '10', workoutLabel: 'Shoulders & Arms', status: 'missed' }),
        createRestDay({ id: 'calendar-week-1-sat', dayLabel: 'SAT', dateNumber: '11' }),
      ],
    },
    {
      id: 'calendar-week-2',
      dateRangeLabel: 'Apr 12 - Apr 18',
      weekLabel: 'Week 2',
      days: [
        createWorkoutDay({ id: 'calendar-week-2-sun', dayLabel: 'SUN', dateNumber: '12', workoutLabel: 'Upper A', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-2-mon', dayLabel: 'MON', dateNumber: '13', workoutLabel: 'Lower A', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-2-tue', dayLabel: 'TUE', dateNumber: '14', workoutLabel: 'Upper A', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-2-wed', dayLabel: 'WED', dateNumber: '15', workoutLabel: 'Upper B', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-2-thu', dayLabel: 'THU', dateNumber: '16', workoutLabel: 'Lower B', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-2-fri', dayLabel: 'FRI', dateNumber: '17', workoutLabel: 'Shoulders & Arms', status: 'missed' }),
        createRestDay({ id: 'calendar-week-2-sat', dayLabel: 'SAT', dateNumber: '18' }),
      ],
    },
    {
      id: 'calendar-week-3',
      dateRangeLabel: 'Apr 19 - Apr 25',
      weekLabel: 'Week 3',
      days: [
        createRestDay({ id: 'calendar-week-3-sun', dayLabel: 'SUN', dateNumber: '19' }),
        createWorkoutDay({ id: 'calendar-week-3-mon', dayLabel: 'MON', dateNumber: '20', workoutLabel: 'Upper A', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-3-tue', dayLabel: 'TUE', dateNumber: '21', workoutLabel: 'Lower A', status: 'done' }),
        createWorkoutDay({ id: 'calendar-week-3-wed', dayLabel: 'WED', dateNumber: '22', workoutLabel: 'Recovery + mobility', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-3-thu', dayLabel: 'THU', dateNumber: '23', workoutLabel: 'Upper B', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-3-fri', dayLabel: 'FRI', dateNumber: '24', workoutLabel: 'Lower B', status: 'missed' }),
        createWorkoutDay({ id: 'calendar-week-3-sat', dayLabel: 'SAT', dateNumber: '25', workoutLabel: 'Speed + jumps', status: 'upcoming' }),
      ],
    },
    {
      id: 'calendar-week-4',
      dateRangeLabel: 'Apr 26 - May 2',
      weekLabel: 'Week 4',
      days: [
        createRestDay({ id: 'calendar-week-4-sun', dayLabel: 'SUN', dateNumber: '26' }),
        createWorkoutDay({ id: 'calendar-week-4-mon', dayLabel: 'MON', dateNumber: '27', workoutLabel: 'Upper A', status: 'upcoming' }),
        createWorkoutDay({ id: 'calendar-week-4-tue', dayLabel: 'TUE', dateNumber: '28', workoutLabel: 'Lower A', status: 'upcoming' }),
        createWorkoutDay({ id: 'calendar-week-4-wed', dayLabel: 'WED', dateNumber: '29', workoutLabel: 'Upper B', status: 'upcoming' }),
        createWorkoutDay({ id: 'calendar-week-4-thu', dayLabel: 'THU', dateNumber: '30', workoutLabel: 'Lower B', status: 'upcoming' }),
        createWorkoutDay({ id: 'calendar-week-4-fri', dayLabel: 'FRI', dateNumber: '1', workoutLabel: 'Shoulders & Arms', status: 'upcoming' }),
        createRestDay({ id: 'calendar-week-4-sat', dayLabel: 'SAT', dateNumber: '2' }),
      ],
    },
  ]
}

function buildWeeksFromAssignedProgram(trainState) {
  const weeks = Array.isArray(trainState?.program?.weeks) ? trainState.program.weeks : []
  return weeks.map((week, weekIndex) => ({
    id: week.id || `calendar-week-${weekIndex + 1}`,
    dateRangeLabel: formatWeekRangeLabel(week.startDate, week.endDate),
    weekLabel: `Week ${week.weekIndex || weekIndex + 1}`,
    days: (Array.isArray(week.days) ? week.days : []).map((day, dayIndex) => {
      const workout = Array.isArray(day.workouts) ? day.workouts[0] || null : null
      const dayLabel = formatWeekdayUpperLabel(day.date)
      const dateNumber = formatDateNumber(day.date)
      if (!workout?.id) {
        return createRestDay({
          id: day.id || `calendar-day-${weekIndex + 1}-${dayIndex + 1}`,
          dayLabel,
          dateNumber,
        })
      }

      return createWorkoutDay({
        id: day.id || `calendar-day-${weekIndex + 1}-${dayIndex + 1}`,
        dayLabel,
        dateNumber,
        workoutLabel: workout.nameSnapshot || day.name || 'Workout',
        status: mapWorkoutStatusToCalendarStatus(workout.status),
        durationLabel: getWorkoutDurationLabel(workout),
      })
    }),
  }))
}

export function getTrainingCalendarModel(trainState) {
  const weeks = buildWeeksFromAssignedProgram(trainState)

  return {
    title: 'Training Calendar',
    loadMoreLabel: 'Load more',
    weeks: weeks.length > 0 ? weeks : createTrainingCalendarWeeks(),
  }
}
