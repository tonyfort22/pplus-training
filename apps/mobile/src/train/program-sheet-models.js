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

function formatLongDateLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatWeekdayShortLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatIsoDate(value) {
  const date = value instanceof Date ? value : buildLocalDateFromIso(value)
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getIsoDatesInRange(startValue, endValue) {
  const startDate = buildLocalDateFromIso(startValue)
  const endDate = buildLocalDateFromIso(endValue)
  if (!startDate || !endDate || startDate > endDate) return []

  const dates = []
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    dates.push(formatIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates.filter(Boolean)
}

function isDetailedProgramRecord(value) {
  return Boolean(value?.id && Array.isArray(value?.weeks))
}

function isProgramPreviewRecord(value) {
  return Boolean(value?.id && !Array.isArray(value?.weeks) && !value?.program)
}

function isTrainStateWithProgram(value) {
  return Boolean(value?.program && typeof value.program === 'object')
}

function mapWorkoutStatusToSheetStatus(status) {
  const normalizedStatus = String(status || '').toLowerCase()
  if (normalizedStatus === 'completed') return 'done'
  if (normalizedStatus === 'missed' || normalizedStatus === 'skipped') return 'missed'
  return 'upcoming'
}

function createRestDayEntry({ id, date, label = 'Rest Day' }) {
  return {
    id,
    programWorkoutId: null,
    programDayId: null,
    dayLabel: formatWeekdayShortLabel(date),
    workoutLabel: label,
    durationLabel: 'Rest Day',
    status: 'rest',
    isRestDay: true,
  }
}

function buildWeekEntriesFromDays(week) {
  const dayRecords = Array.isArray(week?.days) ? week.days : []
  const dayByDate = new Map(dayRecords.map((day) => [day.date, day]))
  const rangeDates = getIsoDatesInRange(week?.startDate, week?.endDate)

  if (rangeDates.length === 0) {
    return dayRecords.flatMap((day, dayIndex) => {
      const workouts = Array.isArray(day.workouts) ? day.workouts : []
      if (workouts.length === 0) {
        return [createRestDayEntry({ id: day.id || `week-day-${dayIndex + 1}`, date: day.date, label: day.name || 'Rest Day' })]
      }

      return workouts.map((workout, workoutIndex) => ({
        id: workout.id || `${day.id || 'day'}-${workoutIndex + 1}`,
        programWorkoutId: workout.id || null,
        programDayId: day.id || null,
        dayLabel: formatWeekdayShortLabel(day.date),
        workoutLabel: workout.nameSnapshot || day.name || 'Workout',
        durationLabel: day.status === 'off' ? 'Off day' : 'Scheduled',
        status: mapWorkoutStatusToSheetStatus(workout.status),
        isRestDay: false,
      }))
    })
  }

  return rangeDates.map((date, index) => {
    const day = dayByDate.get(date)
    const workouts = Array.isArray(day?.workouts) ? day.workouts : []
    const workout = workouts[0] || null

    if (!workout) {
      return createRestDayEntry({ id: day?.id || `${week?.id || 'week'}-rest-${index + 1}`, date, label: day?.name === 'Deload' ? 'Deload' : 'Rest Day' })
    }

    return {
      id: workout.id || `${day?.id || 'day'}-1`,
      programWorkoutId: workout.id || null,
      programDayId: day?.id || null,
      dayLabel: formatWeekdayShortLabel(date),
      workoutLabel: workout.nameSnapshot || day?.name || 'Workout',
      durationLabel: day?.status === 'off' ? 'Off day' : 'Scheduled',
      status: mapWorkoutStatusToSheetStatus(workout.status),
      isRestDay: false,
    }
  })
}

function buildSheetModelFromDetailedProgram(program) {
  const weeks = Array.isArray(program.weeks) ? program.weeks : []
  const allWorkouts = []
  for (const week of weeks) {
    for (const day of week.days || []) {
      for (const workout of day.workouts || []) {
        allWorkouts.push(workout)
      }
    }
  }

  const currentWeek = Number(weeks[0]?.weekIndex || 1)
  const totalWeeks = Number(program.weeksCount || weeks.length || 1)
  const completedWorkouts = allWorkouts.filter((workout) => String(workout?.status || '').toLowerCase() === 'completed').length
  const totalWorkouts = Number(program.workoutsCount || allWorkouts.length || 0)
  const routineLabels = Array.from(new Set(allWorkouts.map((workout) => workout?.nameSnapshot).filter(Boolean)))

  return {
    title: program.name || 'Program',
    dateRangeLabel: [program.startDate, program.endDate].filter(Boolean).map(formatLongDateLabel).join(' - ') || 'Dates not set',
    editLabel: 'Edit',
    progressSegments: Array.from({ length: totalWeeks }, (_, index) => ({
      id: `program-sheet-week-${index + 1}`,
      isComplete: index + 1 < currentWeek,
      isCurrent: index + 1 === currentWeek,
    })),
    stats: [
      {
        id: 'program-week-stat',
        icon: 'calendar',
        label: `Week ${currentWeek} of ${totalWeeks}`,
      },
      {
        id: 'program-workout-stat',
        icon: 'barbell',
        label: `${completedWorkouts} of ${totalWorkouts} Workouts`,
      },
    ],
    routines: routineLabels.map((label, index) => ({ id: `routine-${index + 1}`, label })),
    weeks: weeks.map((week, index) => ({
      id: week.id || `week-${index + 1}`,
      title: week.name || `Week ${week.weekIndex || index + 1}`,
      dateRangeLabel: [week.startDate, week.endDate].filter(Boolean).map(formatMonthDayLabel).join(' - '),
      entries: buildWeekEntriesFromDays(week),
    })),
  }
}

function buildSheetModelFromProgramPreview(program) {
  return buildSheetModelFromDetailedProgram({
    ...program,
    weeksCount: Number(program?.weeksCount || 1),
    workoutsCount: Number(program?.workoutsCount || 0),
    weeks: Array.isArray(program?.weeks) ? program.weeks : [],
  })
}

export function getProgramSheetModel(source) {
  if (isDetailedProgramRecord(source)) {
    return buildSheetModelFromDetailedProgram(source)
  }

  if (isProgramPreviewRecord(source)) {
    return buildSheetModelFromProgramPreview(source)
  }

  if (!isTrainStateWithProgram(source)) {
    return buildSheetModelFromProgramPreview({})
  }

  const trainState = source
  const totalWeeks = trainState.program.totalWeeks
  const currentWeek = trainState.program.currentWeek

  return {
    title: "Spring '26 Hypertrophy",
    dateRangeLabel: 'Apr 5, 2026 - May 30, 2026',
    editLabel: 'Edit',
    progressSegments: Array.from({ length: totalWeeks }, (_, index) => ({
      id: `program-sheet-week-${index + 1}`,
      isComplete: index + 1 < currentWeek,
      isCurrent: index + 1 === currentWeek,
    })),
    stats: [
      {
        id: 'program-week-stat',
        icon: 'calendar',
        label: `Week ${currentWeek} of ${totalWeeks}`,
      },
      {
        id: 'program-workout-stat',
        icon: 'barbell',
        label: `${trainState.program.completedWorkouts} of ${trainState.program.totalWorkouts} Workouts`,
      },
    ],
    routines: [
      { id: 'routine-upper-a', label: 'Upper A' },
      { id: 'routine-lower-a', label: 'Lower A' },
      { id: 'routine-upper-b', label: 'Upper B' },
      { id: 'routine-lower-b', label: 'Lower B' },
      { id: 'routine-shoulders-arms', label: 'Shoulders & Arms' },
    ],
    weeks: createProgramScheduleWeeks(),
  }
}

function createProgramScheduleWeeks() {
  return [
    {
      id: 'week-1',
      title: 'Week 1',
      dateRangeLabel: 'Apr 5 - Apr 11',
      entries: [
        { id: 'week-1-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-1-mon', dayLabel: 'Mon', workoutLabel: 'Lower A', durationLabel: '1 min', status: 'done', isRestDay: false },
        { id: 'week-1-tue', dayLabel: 'Tue', workoutLabel: 'Upper B', durationLabel: '0 min', status: 'done', isRestDay: false },
        { id: 'week-1-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 1h 4m', status: 'missed', isRestDay: false },
        { id: 'week-1-thu', dayLabel: 'Thu', workoutLabel: 'Shoulders & Arms', durationLabel: '1h', status: 'done', isRestDay: false },
        { id: 'week-1-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 57 min', status: 'missed', isRestDay: false },
        { id: 'week-1-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-2',
      title: 'Week 2',
      dateRangeLabel: 'Apr 12 - Apr 18',
      entries: [
        { id: 'week-2-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-2-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: '58 min', status: 'done', isRestDay: false },
        { id: 'week-2-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: '1h 2m', status: 'done', isRestDay: false },
        { id: 'week-2-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 1h 1m', status: 'missed', isRestDay: false },
        { id: 'week-2-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: '55 min', status: 'done', isRestDay: false },
        { id: 'week-2-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 52 min', status: 'missed', isRestDay: false },
        { id: 'week-2-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-3',
      title: 'Week 3',
      dateRangeLabel: 'Apr 19 - Apr 25',
      entries: [
        { id: 'week-3-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-3-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: '47 min', status: 'done', isRestDay: false },
        { id: 'week-3-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Scheduled today', status: 'done', isRestDay: false },
        { id: 'week-3-wed', dayLabel: 'Wed', workoutLabel: 'Recovery + mobility', durationLabel: 'Est. 32 min', status: 'missed', isRestDay: false },
        { id: 'week-3-thu', dayLabel: 'Thu', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed', isRestDay: false },
        { id: 'week-3-fri', dayLabel: 'Fri', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 3m', status: 'missed', isRestDay: false },
        { id: 'week-3-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-4',
      title: 'Week 4',
      dateRangeLabel: 'Apr 26 - May 2',
      entries: [
        { id: 'week-4-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-4-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 56 min', status: 'missed', isRestDay: false },
        { id: 'week-4-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h 1m', status: 'missed', isRestDay: false },
        { id: 'week-4-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed', isRestDay: false },
        { id: 'week-4-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 59 min', status: 'missed', isRestDay: false },
        { id: 'week-4-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 52 min', status: 'missed', isRestDay: false },
        { id: 'week-4-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-5',
      title: 'Week 5',
      dateRangeLabel: 'May 3 - May 9',
      entries: [
        { id: 'week-5-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-5-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 57 min', status: 'missed', isRestDay: false },
        { id: 'week-5-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h', status: 'missed', isRestDay: false },
        { id: 'week-5-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 59 min', status: 'missed', isRestDay: false },
        { id: 'week-5-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 2m', status: 'missed', isRestDay: false },
        { id: 'week-5-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 53 min', status: 'missed', isRestDay: false },
        { id: 'week-5-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-6',
      title: 'Week 6',
      dateRangeLabel: 'May 10 - May 16',
      entries: [
        { id: 'week-6-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-6-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 55 min', status: 'missed', isRestDay: false },
        { id: 'week-6-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 1h 3m', status: 'missed', isRestDay: false },
        { id: 'week-6-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 58 min', status: 'missed', isRestDay: false },
        { id: 'week-6-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h 1m', status: 'missed', isRestDay: false },
        { id: 'week-6-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 54 min', status: 'missed', isRestDay: false },
        { id: 'week-6-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-7',
      title: 'Week 7',
      dateRangeLabel: 'May 17 - May 23',
      entries: [
        { id: 'week-7-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-7-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 54 min', status: 'missed', isRestDay: false },
        { id: 'week-7-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 59 min', status: 'missed', isRestDay: false },
        { id: 'week-7-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 57 min', status: 'missed', isRestDay: false },
        { id: 'week-7-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 1h', status: 'missed', isRestDay: false },
        { id: 'week-7-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 51 min', status: 'missed', isRestDay: false },
        { id: 'week-7-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
    {
      id: 'week-8',
      title: 'Week 8',
      dateRangeLabel: 'May 24 - May 30',
      entries: [
        { id: 'week-8-sun', dayLabel: 'Sun', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
        { id: 'week-8-mon', dayLabel: 'Mon', workoutLabel: 'Upper A', durationLabel: 'Est. 52 min', status: 'missed', isRestDay: false },
        { id: 'week-8-tue', dayLabel: 'Tue', workoutLabel: 'Lower A', durationLabel: 'Est. 58 min', status: 'missed', isRestDay: false },
        { id: 'week-8-wed', dayLabel: 'Wed', workoutLabel: 'Upper B', durationLabel: 'Est. 56 min', status: 'missed', isRestDay: false },
        { id: 'week-8-thu', dayLabel: 'Thu', workoutLabel: 'Lower B', durationLabel: 'Est. 59 min', status: 'missed', isRestDay: false },
        { id: 'week-8-fri', dayLabel: 'Fri', workoutLabel: 'Shoulders & Arms', durationLabel: 'Est. 50 min', status: 'missed', isRestDay: false },
        { id: 'week-8-sat', dayLabel: 'Sat', workoutLabel: 'Rest Day', durationLabel: 'Rest Day', status: 'rest', isRestDay: true },
      ],
    },
  ]
}
