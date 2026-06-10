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

function formatShortDateLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || 'Not set'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatLongDateLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || 'Not set'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMonthDayWeekLabel(value, weekCount) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || 'Not set'
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (~${weekCount} weeks)`
}

function formatFullDateLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return value || 'Not set'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatWeekdayShortLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatIsoDate(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, dayCount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + dayCount)
  return result
}

function addWeeksToIso(startDate, weekCount) {
  const date = buildLocalDateFromIso(startDate)
  if (!date) return null
  return formatIsoDate(addDays(date, weekCount * 7))
}

function resolveNowDate(now) {
  if (typeof now === 'string') {
    return buildLocalDateFromIso(now) || new Date(now)
  }

  if (now instanceof Date) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const current = new Date()
  return new Date(current.getFullYear(), current.getMonth(), current.getDate())
}

function buildStartDateSheet(startDate, now) {
  const today = resolveNowDate(now)
  const tomorrow = addDays(today, 1)
  const selectedIso = startDate || formatIsoDate(today)

  return {
    title: 'Program Start Date',
    doneLabel: 'Done',
    selectedValue: selectedIso,
    options: [
      {
        id: 'today',
        label: 'Today',
        value: formatIsoDate(today),
        valueLabel: formatFullDateLabel(formatIsoDate(today)),
        isSelected: selectedIso === formatIsoDate(today),
      },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        value: formatIsoDate(tomorrow),
        valueLabel: formatFullDateLabel(formatIsoDate(tomorrow)),
        isSelected: selectedIso === formatIsoDate(tomorrow),
      },
      {
        id: 'custom',
        label: 'Custom',
        value: selectedIso,
        valueLabel: formatFullDateLabel(selectedIso),
        isSelected: selectedIso !== formatIsoDate(today) && selectedIso !== formatIsoDate(tomorrow),
      },
    ],
  }
}

function resolveSelectedWeekCount(startDate, endDate) {
  const start = buildLocalDateFromIso(startDate)
  const end = buildLocalDateFromIso(endDate)
  if (!start || !end) return 8
  const dayDelta = Math.round((end.getTime() - start.getTime()) / 86400000)
  const weekCount = Math.round(dayDelta / 7)
  return Number.isFinite(weekCount) && weekCount > 0 ? weekCount : 8
}

function buildEndDateSheet(startDate, endDate) {
  const selectedWeekCount = resolveSelectedWeekCount(startDate, endDate)
  const firstWeekCount = Math.max(1, selectedWeekCount - 2)
  const weekCounts = Array.from({ length: 5 }, (_, index) => firstWeekCount + index)

  return {
    title: 'Program End Date',
    doneLabel: 'Save Changes',
    variant: 'wheel',
    selectedValue: endDate,
    options: weekCounts.map((weekCount) => {
      const value = addWeeksToIso(startDate, weekCount)
      return {
        id: `end-week-${weekCount}`,
        label: formatMonthDayWeekLabel(value, weekCount),
        value,
        valueLabel: formatLongDateLabel(value),
        isSelected: value === endDate,
      }
    }),
  }
}

function isDetailedProgramRecord(value) {
  return Boolean(value?.id && Array.isArray(value?.weeks))
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

function buildDaysFromDetailedProgram(program) {
  const firstWeek = Array.isArray(program?.weeks) ? program.weeks[0] : null
  const days = Array.isArray(firstWeek?.days) ? firstWeek.days : []

  return days.slice(0, 7).map((day, index) => {
    const workout = Array.isArray(day.workouts) ? day.workouts[0] || null : null
    return {
      id: day.id || `split-day-${index + 1}`,
      dayLabel: formatWeekdayShortLabel(day.date) || day.name?.slice(0, 3) || '',
      routineLabel: workout?.nameSnapshot || null,
      durationLabel: workout ? getWorkoutDurationLabel(workout) : '',
      actionLabel: workout?.nameSnapshot ? null : '+ Add',
      isAssigned: Boolean(workout?.nameSnapshot),
    }
  })
}

function buildDaysFromTrainState(trainState) {
  const calendarWeek = Array.isArray(trainState?.program?.calendarWeek) ? trainState.program.calendarWeek : []
  return calendarWeek.slice(0, 7).map((day, index) => ({
    id: day.id || `split-day-${index + 1}`,
    dayLabel: day.dayLabel || '',
    routineLabel: day.workoutPreview?.workoutName && day.workoutPreview?.programWorkoutId ? day.workoutPreview.workoutName : null,
    durationLabel: day.workoutPreview?.programWorkoutId ? getWorkoutDurationLabel(day.workoutPreview) : '',
    actionLabel: day.workoutPreview?.programWorkoutId ? null : '+ Add',
    isAssigned: Boolean(day.workoutPreview?.programWorkoutId),
  }))
}

function buildAddWorkoutSheetFromDetailedProgram(program) {
  const seen = new Set()
  const routines = []

  for (const week of Array.isArray(program?.weeks) ? program.weeks : []) {
    for (const day of Array.isArray(week?.days) ? week.days : []) {
      for (const workout of Array.isArray(day?.workouts) ? day.workouts : []) {
        const label = workout?.nameSnapshot
        if (!label || seen.has(label)) continue
        seen.add(label)
        routines.push({ id: workout.id || `routine-${seen.size}`, label })
      }
    }
  }

  return {
    title: 'Add Workout',
    createWorkoutLabel: 'Create Workout',
    programRoutinesLabel: 'Workouts in this Program',
    routines,
  }
}

function buildAddWorkoutSheetFromTrainState(trainState) {
  const seen = new Set()
  const routines = []
  const calendarWeek = Array.isArray(trainState?.program?.calendarWeek) ? trainState.program.calendarWeek : []

  for (const day of calendarWeek) {
    const label = day?.workoutPreview?.workoutName
    if (!label || seen.has(label)) continue
    seen.add(label)
    routines.push({ id: day?.workoutPreview?.programWorkoutId || `routine-${seen.size}`, label })
  }

  return {
    title: 'Add Workout',
    createWorkoutLabel: 'Create Workout',
    programRoutinesLabel: 'Workouts in this Program',
    routines,
  }
}

function buildCreateWorkoutView() {
  return {
    title: 'Routine Name',
    notesPlaceholder: 'Add notes',
    addExerciseLabel: 'Add Exercise',
    deleteLabel: 'Delete Routine',
  }
}

function buildAddExerciseSheet() {
  return {
    title: 'Exercises',
    searchPlaceholder: 'Search or Create Exercises',
    addButtonLabel: 'Add',
    exercises: [
      { id: 'exercise-back-squat', name: 'Barbell Back Squat', thumbnailUrl: null },
      { id: 'exercise-front-squat', name: 'Barbell Front Squat', thumbnailUrl: null },
      { id: 'exercise-deadlift', name: 'Barbell Deadlift', thumbnailUrl: null },
      { id: 'exercise-shoulder-press', name: 'Seated Dumbbell Shoulder Press', thumbnailUrl: null },
      { id: 'exercise-assisted-pull-up', name: 'Assisted Pull-Up', thumbnailUrl: null },
      { id: 'exercise-overhead-press', name: 'Barbell Overhead Press', thumbnailUrl: null },
      { id: 'exercise-rdl', name: 'Barbell Romanian Deadlift', thumbnailUrl: null },
      { id: 'exercise-curl', name: 'Barbell Curl', thumbnailUrl: null },
      { id: 'exercise-tricep-pushdown', name: 'Cable Tricep Pushdown (Rope)', thumbnailUrl: null },
      { id: 'exercise-rear-delt-fly', name: 'Dumbbell Bent-Over Rear-Delt Fly', thumbnailUrl: null },
      { id: 'exercise-lateral-raise', name: 'Dumbbell Lateral Raise', thumbnailUrl: null },
    ],
  }
}

export function getProgramEditViewModel(source, options = {}) {
  if (isDetailedProgramRecord(source)) {
    return {
      title: source.name || 'Program',
      cancelLabel: 'Cancel',
      saveLabel: 'Save',
      programDatesLabel: 'PROGRAM DATES',
      trainingSplitLabel: 'TRAINING SPLIT',
      startDateLabel: formatShortDateLabel(source.startDate),
      endDateLabel: formatLongDateLabel(source.endDate),
      splitDays: buildDaysFromDetailedProgram(source),
      startDateSheet: buildStartDateSheet(source.startDate, options.now),
      endDateSheet: buildEndDateSheet(source.startDate, source.endDate),
      addWorkoutSheet: buildAddWorkoutSheetFromDetailedProgram(source),
      createWorkoutView: buildCreateWorkoutView(),
      addExerciseSheet: buildAddExerciseSheet(),
      helperNote: 'The training split repeats until the end date. Use a 7-day split to keep weekdays fixed.',
      endProgramLabel: 'End Program',
    }
  }

  const trainState = source || {}
  const startDateValue = trainState?.program?.startDate || '2026-04-05'
  const endDateValue = trainState?.program?.endDate || '2026-05-31'
  return {
    title: trainState?.program?.name || "Spring '26 Hypertrophy",
    cancelLabel: 'Cancel',
    saveLabel: 'Save',
    programDatesLabel: 'PROGRAM DATES',
    trainingSplitLabel: 'TRAINING SPLIT',
    startDateLabel: formatShortDateLabel(startDateValue),
    endDateLabel: formatLongDateLabel(endDateValue),
    splitDays: buildDaysFromTrainState(trainState),
    startDateSheet: buildStartDateSheet(startDateValue, options.now),
    endDateSheet: buildEndDateSheet(startDateValue, endDateValue),
    addWorkoutSheet: buildAddWorkoutSheetFromTrainState(trainState),
    createWorkoutView: buildCreateWorkoutView(),
    addExerciseSheet: buildAddExerciseSheet(),
    helperNote: 'The training split repeats until the end date. Use a 7-day split to keep weekdays fixed.',
    endProgramLabel: 'End Program',
  }
}
