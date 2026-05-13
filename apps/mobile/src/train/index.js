import { completeWorkoutSet, createWorkoutSession, discardWorkoutSession, finishWorkoutSession } from '../../../../packages/core/src/index.js'
export { createTrainSessionStore } from './session-runtime.js'
import { doesSessionMatchWorkout, getComparableProgramWorkoutId } from './session-truth.js'

export const mobileTabs = [
  { key: 'train', label: 'Train' },
  { key: 'progress', label: 'Progress' },
  { key: 'team', label: 'Team' },
  { key: 'inbox', label: 'Athletes' },
]

export const trainTabs = [
  { key: 'today', label: 'Today' },
  { key: 'program', label: 'Program' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'workout', label: 'Workout' },
  { key: 'session', label: 'Session' },
]

export const demoPreviewStates = [
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'discarded', label: 'Discarded' },
]

function formatRestLabel(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

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

function formatWeekdayShortLabel(value) {
  const date = buildLocalDateFromIso(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatWeekdayUpperLabel(value) {
  return formatWeekdayShortLabel(value).toUpperCase()
}

export function createDemoProgramWorkout() {
  return {
    id: 'pw-lower-a',
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-spring-26',
    programDayId: 'program-day-21',
    workoutTemplateId: 'template-lower-a',
    nameSnapshot: 'Lower A',
    exercises: [
      {
        id: 'pwe-squat',
        exerciseId: 'exercise-squat',
        nameSnapshot: 'Barbell Back Squat',
        sortOrder: 1,
        notes: 'Brace and move fast',
        defaultRestSeconds: 180,
        sets: [
          { id: 'pws-squat-1', sortOrder: 1, setType: 'straight', targetReps: 8, targetLoad: 120, targetLoadUnit: 'lb', targetRpe: 6, targetRestSeconds: 180 },
          { id: 'pws-squat-2', sortOrder: 2, setType: 'straight', targetReps: 8, targetLoad: 120, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 180 },
          { id: 'pws-squat-3', sortOrder: 3, setType: 'straight', targetReps: 8, targetLoad: 120, targetLoadUnit: 'lb', targetRpe: 8, targetRestSeconds: 180 },
          { id: 'pws-squat-4', sortOrder: 4, setType: 'straight', targetReps: 8, targetLoad: 120, targetLoadUnit: 'lb', targetRpe: 9, targetRestSeconds: 180 },
        ],
      },
      {
        id: 'pwe-rdl',
        exerciseId: 'exercise-rdl',
        nameSnapshot: 'Barbell Romanian Deadlift',
        sortOrder: 2,
        notes: 'Own the hinge',
        defaultRestSeconds: 150,
        sets: [
          { id: 'pws-rdl-1', sortOrder: 1, setType: 'straight', targetReps: 8, targetLoad: 95, targetLoadUnit: 'lb', targetRpe: 6, targetRestSeconds: 150 },
          { id: 'pws-rdl-2', sortOrder: 2, setType: 'straight', targetReps: 8, targetLoad: 95, targetLoadUnit: 'lb', targetRpe: 7, targetRestSeconds: 150 },
          { id: 'pws-rdl-3', sortOrder: 3, setType: 'straight', targetReps: 8, targetLoad: 95, targetLoadUnit: 'lb', targetRpe: 8, targetRestSeconds: 150 },
        ],
      },
    ],
  }
}

export function createTrainDemoState({ programWorkout = createDemoProgramWorkout(), startedAt, previewState = 'planned' } = {}) {
  const session = createPreviewSession({ programWorkout, startedAt, previewState })

  return {
    programWorkout,
    today: {
      title: 'Today',
      workoutName: programWorkout.nameSnapshot,
      scheduledLabel: 'Scheduled for today',
      quickSummary: 'Start the session, log each set cleanly, and keep rest flowing.',
    },
    program: {
      name: 'Spring Hypertrophy',
      dateRangeLabel: 'Apr 5 - May 30',
      currentWeek: 3,
      totalWeeks: 8,
      weekLabel: 'Week 3 of 8',
      completedWorkouts: 6,
      totalWorkouts: 39,
      completionLabel: '6 of 39 workouts completed',
      selectedCalendarDayId: 'tue',
      calendarWeek: createDemoCalendarWeek(programWorkout),
    },
    session,
    completedSessions: createDemoCompletedSessions(programWorkout),
  }
}

export function createDemoCompletedSessions(programWorkout = createDemoProgramWorkout()) {
  return [
    buildDemoCompletedSession({ programWorkout, completedAt: '2026-04-18T20:30:00.000Z', squatLoad: 125, rdlLoad: 100 }),
    buildDemoCompletedSession({ programWorkout, completedAt: '2026-04-20T20:30:00.000Z', squatLoad: 135, rdlLoad: 105 }),
  ]
}

function hasStructuredWorkoutExercises(programWorkout) {
  return Array.isArray(programWorkout?.exercises) && programWorkout.exercises.length > 0
}

function getPreferredAssignedWorkout(dayWorkouts = []) {
  return dayWorkouts.find((workout) => String(workout?.nameSnapshot || '').trim()) || dayWorkouts[0] || null
}

function getPreferredAssignedWorkoutName(dayWorkouts = [], fallbackDayName = null) {
  const preferredWorkout = getPreferredAssignedWorkout(dayWorkouts)
  return preferredWorkout?.nameSnapshot || fallbackDayName || 'Rest Day'
}

export function createAssignedProgramTrainState({ assignedProgram, programWorkout = null, startedAt, previewState = 'planned', todayIsoDate = null } = {}) {
  if (!assignedProgram?.id) {
    return createTrainDemoState({ programWorkout: programWorkout || createDemoProgramWorkout(), startedAt, previewState })
  }

  const todayDate = todayIsoDate || new Date().toISOString().slice(0, 10)
  const weeks = Array.isArray(assignedProgram.weeks) ? assignedProgram.weeks : []
  const allDays = weeks.flatMap((week) => (Array.isArray(week.days) ? week.days.map((day) => ({ ...day, week })) : []))
  const selectedTodayDay = allDays.find((day) => day.date === todayDate) || allDays[0] || null
  const activeWeek = selectedTodayDay?.week || weeks[0] || null
  const activeWeekDays = Array.isArray(activeWeek?.days) ? activeWeek.days : []
  const todayCalendarDayId = selectedTodayDay?.id || activeWeekDays[0]?.id || 'today'

  const workoutByDayId = new Map()
  for (const week of weeks) {
    for (const day of week.days || []) {
      const dayWorkouts = Array.isArray(day.workouts) ? day.workouts : []
      const preferredWorkout = getPreferredAssignedWorkout(dayWorkouts)
      if (preferredWorkout?.id) {
        workoutByDayId.set(day.id, preferredWorkout)
      }
    }
  }

  const dayWorkoutForToday = selectedTodayDay?.id ? workoutByDayId.get(selectedTodayDay.id) || null : null
  const selectedTodayDayWorkouts = Array.isArray(selectedTodayDay?.workouts) ? selectedTodayDay.workouts : []
  const selectedTodayWorkoutName = getPreferredAssignedWorkoutName(selectedTodayDayWorkouts, selectedTodayDay?.name)
  const selectedProgramWorkout = hasStructuredWorkoutExercises(programWorkout)
    ? programWorkout
    : (dayWorkoutForToday?.id ? dayWorkoutForToday : null)

  const effectiveProgramWorkout = selectedProgramWorkout || programWorkout || createDemoProgramWorkout()
  const session = createPreviewSession({ programWorkout: effectiveProgramWorkout, startedAt, previewState })
  const completedWorkouts = Array.from(workoutByDayId.values()).filter((workout) => String(workout?.status || '').toLowerCase() == 'completed').length
  const totalWorkouts = workoutByDayId.size
  const currentWeekIndex = Number(activeWeek?.weekIndex || 1)
  const totalWeeks = weeks.length || 1

  return {
    programWorkout: effectiveProgramWorkout,
    today: {
      title: 'Today',
      workoutName: selectedProgramWorkout?.nameSnapshot || selectedTodayWorkoutName,
      scheduledLabel: selectedProgramWorkout?.id ? 'Scheduled for today' : 'No workout scheduled',
      quickSummary: selectedProgramWorkout?.id
        ? 'Start the session, log each set cleanly, and keep rest flowing.'
        : 'No workout is scheduled for the selected athlete today.',
    },
    program: {
      id: assignedProgram.id,
      name: assignedProgram.name,
      dateRangeLabel: assignedProgram.startDate && assignedProgram.endDate
        ? `${formatMonthDayLabel(assignedProgram.startDate)} - ${formatMonthDayLabel(assignedProgram.endDate)}`
        : [assignedProgram.startDate, assignedProgram.endDate].filter(Boolean).map(formatMonthDayLabel).join(' - '),
      currentWeek: currentWeekIndex,
      totalWeeks,
      weekLabel: `Week ${currentWeekIndex} of ${totalWeeks}`,
      completedWorkouts,
      totalWorkouts,
      completionLabel: `${completedWorkouts} of ${totalWorkouts} workouts completed`,
      todayCalendarDayId,
      selectedCalendarDayId: todayCalendarDayId,
      weeks,
      calendarWeek: activeWeekDays.map((day) => {
        const dayWorkouts = Array.isArray(day.workouts) ? day.workouts : []
        const dayWorkout = workoutByDayId.get(day.id) || null
        const displayWorkoutName = getPreferredAssignedWorkoutName(dayWorkouts, day.name)
        const isToday = day.id === todayCalendarDayId
        const dayStatus = dayWorkout?.id
          ? (isToday ? 'today' : buildAssignedProgramDayStatus({ date: day.date, todayIsoDate: todayDate, workoutStatus: dayWorkout.status }))
          : 'off'

        return {
          id: day.id,
          dayLabel: formatWeekdayShortLabel(day.date),
          weekdayLabel: formatWeekdayUpperLabel(day.date),
          dateLabel: formatMonthDayLabel(day.date),
          workoutName: displayWorkoutName,
          status: dayStatus,
          programDayId: day.id,
          date: day.date,
          workoutPreview: dayWorkout ? createAssignedProgramWorkoutPreview(dayWorkout, displayWorkoutName) : null,
          workouts: dayWorkouts,
        }
      }),
    },
    session,
    completedSessions: [],
  }
}

function createPreviewSession({ programWorkout, startedAt, previewState }) {
  let session = createWorkoutSession({ programWorkout, startedAt })

  if (previewState === 'planned') {
    return {
      ...session,
      status: 'planned',
      startedAt: null,
      elapsedSeconds: 0,
      completedSetsCount: 0,
      completedExercisesCount: 0,
      activeRestTimer: null,
    }
  }

  const firstExercise = session.exercises[0]
  const firstSet = firstExercise?.sets[0]

  if (!firstExercise || !firstSet) {
    return session
  }

  session = completeWorkoutSet({
    session,
    exerciseId: firstExercise.id,
    setId: firstSet.id,
  })

  if (previewState === 'active') {
    return session
  }

  if (previewState === 'discarded') {
    return discardWorkoutSession({
      session,
      discardedAt: '2026-04-21T20:20:00.000Z',
      elapsedSeconds: 600,
    })
  }

  if (previewState === 'completed') {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (set.isCompleted) continue

        session = completeWorkoutSet({
          session,
          exerciseId: exercise.id,
          setId: set.id,
        })
      }
    }

    return finishWorkoutSession({
      session,
      completedAt: '2026-04-21T21:00:00.000Z',
      elapsedSeconds: 1800,
    })
  }

  return session
}

export function getTodaySurfaceModel(trainState) {
  const sessionProgress = getSessionProgressCopy(trainState.session)
  const sessionOutcome = getSessionOutcomeCopy(trainState.session)
  const exerciseCount = trainState.session.exercises.length
  const totalSets = trainState.session.totalSetsCount

  return {
    heroTitle: trainState.today.title,
    workoutName: trainState.today.workoutName,
    scheduledLabel: trainState.today.scheduledLabel,
    quickSummary: sessionOutcome ? sessionOutcome.summary : sessionProgress ? sessionProgress.summary : trainState.today.quickSummary,
    workoutSummaryLabel: `${exerciseCount} exercises, ${totalSets} total sets`,
    workoutStatusLabel: sessionOutcome ? 'Session finished' : sessionProgress ? 'In progress' : 'Open today',
    programName: trainState.program.name,
    programDateRangeLabel: trainState.program.dateRangeLabel,
    programCurrentWeek: trainState.program.currentWeek,
    programTotalWeeks: trainState.program.totalWeeks,
    programWeekLabel: trainState.program.weekLabel,
    programCompletedWorkouts: trainState.program.completedWorkouts,
    programTotalWorkouts: trainState.program.totalWorkouts,
    completionLabel: trainState.program.completionLabel,
    primaryActionLabel: sessionOutcome ? sessionOutcome.actionLabel : sessionProgress ? 'Resume session' : 'Open workout',
  }
}

export function getWorkoutSurfaceModel(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  const selectedDay = getSelectedCalendarDay(trainState, selectedCalendarDayId)
  const workoutPreview = selectedDay.workoutPreview || createWorkoutPreviewFromSession(trainState.session)
  const isSelectedSessionWorkout = doesSessionMatchWorkout(trainState.session, selectedDay.workoutPreview)
  const sessionProgress = isSelectedSessionWorkout ? getSessionProgressCopy(trainState.session) : null
  const sessionOutcome = isSelectedSessionWorkout ? getSessionOutcomeCopy(trainState.session) : null
  const canOpenSession = Boolean(selectedDay.workoutPreview?.programWorkoutId)

  return {
    dayId: selectedDay.id,
    dayLabel: `${selectedDay.dayLabel} • ${selectedDay.dateLabel}`,
    scheduleStatusLabel: formatCalendarStatus(selectedDay.status),
    workoutName: workoutPreview.workoutName,
    exerciseCount: workoutPreview.exercises.length,
    sessionProgressSummary: sessionOutcome ? sessionOutcome.summary : sessionProgress?.summary || null,
    primaryActionLabel: 'Open workout',
    primaryTargetKey: canOpenSession ? 'workout' : 'calendar',
    actionPayload: { selectedDayId: selectedDay.id, programWorkoutId: workoutPreview.programWorkoutId || null },
    hasWorkoutData: Boolean(selectedDay.workoutPreview),
    emptyStateTitle: 'No workout scheduled',
    emptyStateBody: 'No workout is scheduled for this athlete yet.',
    previewHighlights: getWorkoutPreviewHighlights({
      workoutPreview,
      selectedDay,
      canOpenSession,
    }),
    exercises: workoutPreview.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId || null,
      name: exercise.name,
      setCount: exercise.setCount,
      defaultRestSeconds: exercise.defaultRestSeconds,
      defaultRestLabel: formatRestLabel(exercise.defaultRestSeconds),
      sets: exercise.sets || [],
    })),
  }
}

export function getCalendarSurfaceModel(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  const selectedDay = getSelectedCalendarDay(trainState, selectedCalendarDayId)
  const selectedDayTarget = getCalendarDayTarget({ trainState, day: selectedDay })

  return {
    title: 'Weekly schedule',
    body: `${trainState.program.name}, ${trainState.program.weekLabel}. ${selectedDay.dayLabel} is ${formatCalendarStatus(selectedDay.status).toLowerCase()} with ${selectedDay.workoutName}.`,
    actionLabel: getCalendarActionLabel({ day: selectedDay, targetKey: selectedDayTarget, trainState }),
    actionTargetKey: selectedDayTarget,
    selectedDayId: selectedDay.id,
    selectedDay: {
      id: selectedDay.id,
      title: `${selectedDay.dayLabel} • ${selectedDay.workoutName}`,
      body: `${selectedDay.dateLabel} · ${formatCalendarStatus(selectedDay.status)}`,
    },
    selectedDayPlan: getCalendarSelectedDayPlan({ day: selectedDay, trainState }),
    actionPayload: { selectedDayId: selectedDay.id },
    days: trainState.program.calendarWeek.map((day) => ({
      id: day.id,
      weekdayLabel: day.dayLabel.toUpperCase(),
      dateNumber: getCalendarDateNumber(day.dateLabel),
      title: `${day.dayLabel} • ${day.workoutName}`,
      body: `${day.dateLabel} · ${formatCalendarStatus(day.status)}`,
      status: day.status,
      workouts: Array.isArray(day.workouts) ? day.workouts : (day.workoutPreview ? [{ id: day.workoutPreview.programWorkoutId || day.workoutPreview.id, nameSnapshot: day.workoutPreview.workoutName, status: day.status }] : []),
      isSelected: day.id === selectedDay.id,
      indicatorTone: getCalendarIndicatorTone({ day, selectedDayId: selectedDay.id }),
      targetKey: getCalendarDayTarget({ trainState, day }),
      actionPayload: { selectedDayId: day.id },
    })),
  }
}

export function getSelectedCalendarDay(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  return trainState.program.calendarWeek.find((day) => day.id === selectedCalendarDayId) || trainState.program.calendarWeek[0]
}

function getCalendarDayTarget({ trainState, day }) {
  void trainState
  void day
  return 'calendar-day-select'
}

function getCalendarActionLabel({ day, targetKey, trainState }) {
  if (!day.workoutPreview) {
    return 'Stay on calendar'
  }

  const todayDayId = trainState.program.todayCalendarDayId || 'tue'
  if (targetKey === 'session' && day.id === todayDayId) {
    if (trainState.session.status === 'completed') {
      return `View ${day.dayLabel} summary`
    }

    if (trainState.session.status === 'discarded') {
      return `View ${day.dayLabel} summary`
    }

    return `Resume ${day.dayLabel} session`
  }

  return `Open ${day.dayLabel} workout`
}

function getCalendarDateNumber(dateLabel) {
  return dateLabel.split(' ').at(-1)
}

function getCalendarIndicatorTone({ day }) {
  return day.workoutPreview ? 'active' : 'none'
}

function getCalendarSelectedDayPlan({ day, trainState }) {
  if (!day.workoutPreview) {
    return {
      title: 'Selected day plan',
      rows: [
        {
          title: 'Recovery cue',
          body: 'No workout is scheduled here. Keep recovery simple and stay ready for the next training day.',
        },
      ],
    }
  }

  return {
    title: 'Selected day plan',
    rows: getWorkoutPreviewHighlights({
      workoutPreview: day.workoutPreview,
      selectedDay: day,
      canOpenSession: getCalendarDayTarget({ trainState, day }) === 'session',
    }),
  }
}

function getSessionProgressCopy(session) {
  if (!session || session.status !== 'in_progress') {
    return null
  }

  if (session.completedSetsCount === 0) {
    return {
      summary: 'Workout in progress. Jump back in where you left it.',
    }
  }

  return {
    summary: `${session.completedSetsCount} of ${session.totalSetsCount} sets logged. Pick up where you left off and keep the rest timer moving.`,
  }
}

function getSessionOutcomeCopy(session) {
  if (!session || session.status === 'in_progress') {
    return null
  }

  if (session.status === 'completed') {
    return {
      actionLabel: 'View completed session',
      summary: 'Workout completed. Review the session summary and actual logged work.',
    }
  }

  if (session.status === 'discarded') {
    return {
      actionLabel: 'View discarded session',
      summary: 'Workout discarded. Review what was logged before the session was abandoned.',
    }
  }

  return null
}

function formatCalendarStatus(status) {
  if (status === 'today') return 'Today'
  if (status === 'completed') return 'Completed'
  if (status === 'optional') return 'Optional'
  if (status === 'off' || status === 'recovery' || status === 'rest') return 'Off day'
  return 'Upcoming'
}

function buildAssignedProgramDayStatus({ date, todayIsoDate, workoutStatus }) {
  const normalizedWorkoutStatus = String(workoutStatus || '').toLowerCase()
  if (normalizedWorkoutStatus === 'completed') return 'completed'
  if (normalizedWorkoutStatus === 'off' || normalizedWorkoutStatus === 'recovery' || normalizedWorkoutStatus === 'rest') return 'off'
  if (date === todayIsoDate) return 'today'
  if (date < todayIsoDate) return 'completed'
  return 'upcoming'
}

export function getWorkoutPreviewHighlights({ workoutPreview, selectedDay, canOpenSession }) {
  const totalSets = workoutPreview.exercises.reduce((sum, exercise) => sum + exercise.setCount, 0)
  const firstExercise = workoutPreview.exercises[0]

  return [
    {
      id: `${selectedDay.id}-primary-focus`,
      title: 'Primary focus',
      body: firstExercise ? `${firstExercise.name} opens the session and sets the tone for ${selectedDay.workoutName}.` : `${selectedDay.workoutName} is the primary focus today.`,
    },
    {
      id: `${selectedDay.id}-planned-work`,
      title: 'Planned work',
      body: `${workoutPreview.exercises.length} exercises, ${totalSets} total sets, and scheduled rest blocks are queued up.`,
    },
    {
      id: `${selectedDay.id}-session-cue`,
      title: 'Session cue',
      body: canOpenSession ? 'Open today when the athlete is ready to log actual work.' : 'Preview the plan here, then head back to Calendar when you are done reviewing.',
    },
  ]
}

function createDemoCalendarWeek(programWorkout) {
  return [
    {
      id: 'sun',
      dayLabel: 'Sun',
      dateLabel: 'Apr 19',
      workoutName: 'Off',
      status: 'off',
      workoutPreview: null,
    },
    {
      id: 'mon',
      dayLabel: 'Mon',
      dateLabel: 'Apr 20',
      workoutName: 'Upper A',
      status: 'completed',
      workoutPreview: createWorkoutPreview({
        programWorkoutId: 'pw-upper-a',
        workoutName: 'Upper A',
        exercises: [
          { id: 'upper-a-bench', name: 'Bench Press', setCount: 4, defaultRestSeconds: 150 },
          { id: 'upper-a-row', name: 'Chest Supported Row', setCount: 4, defaultRestSeconds: 120 },
        ],
      }),
    },
    {
      id: 'tue',
      dayLabel: 'Tue',
      dateLabel: 'Apr 21',
      workoutName: programWorkout.nameSnapshot,
      status: 'today',
      workoutPreview: createWorkoutPreviewFromProgramWorkout(programWorkout),
    },
    {
      id: 'wed',
      dayLabel: 'Wed',
      dateLabel: 'Apr 22',
      workoutName: 'Recovery + mobility',
      status: 'upcoming',
      workoutPreview: createWorkoutPreview({
        programWorkoutId: 'pw-recovery-flow',
        workoutName: 'Recovery + mobility',
        exercises: [
          { id: 'recovery-flow', name: 'Mobility Flow', setCount: 3, defaultRestSeconds: 60 },
          { id: 'bike-zone-2', name: 'Bike Tempo', setCount: 1, defaultRestSeconds: 0 },
        ],
      }),
    },
    {
      id: 'thu',
      dayLabel: 'Thu',
      dateLabel: 'Apr 23',
      workoutName: 'Upper B',
      status: 'upcoming',
      workoutPreview: createWorkoutPreview({
        programWorkoutId: 'pw-upper-b',
        workoutName: 'Upper B',
        exercises: [
          { id: 'upper-b-bench', name: 'Bench Press', setCount: 4, defaultRestSeconds: 150 },
          { id: 'upper-b-pullup', name: 'Pull-Up', setCount: 4, defaultRestSeconds: 120 },
        ],
      }),
    },
    {
      id: 'fri',
      dayLabel: 'Fri',
      dateLabel: 'Apr 24',
      workoutName: 'Lower B',
      status: 'upcoming',
      workoutPreview: createWorkoutPreview({
        programWorkoutId: 'pw-lower-b',
        workoutName: 'Lower B',
        exercises: [
          { id: 'lower-b-trapbar', name: 'Trap Bar Deadlift', setCount: 4, defaultRestSeconds: 180 },
          { id: 'lower-b-split-squat', name: 'Rear Foot Elevated Split Squat', setCount: 3, defaultRestSeconds: 120 },
        ],
      }),
    },
    {
      id: 'sat',
      dayLabel: 'Sat',
      dateLabel: 'Apr 25',
      workoutName: 'Speed + jumps',
      status: 'optional',
      workoutPreview: createWorkoutPreview({
        programWorkoutId: 'pw-speed-jumps',
        workoutName: 'Speed + jumps',
        exercises: [
          { id: 'speed-jumps', name: 'Box Jump', setCount: 5, defaultRestSeconds: 90 },
          { id: 'speed-sprint', name: '10m Sprint', setCount: 6, defaultRestSeconds: 75 },
        ],
      }),
    },
  ]
}

function createWorkoutPreviewFromProgramWorkout(programWorkout) {
  return createWorkoutPreview({
    programWorkoutId: programWorkout.id,
    workoutName: programWorkout.nameSnapshot,
    exercises: programWorkout.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.id,
      name: exercise.nameSnapshot,
      setCount: exercise.sets.length,
      defaultRestSeconds: exercise.defaultRestSeconds,
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        programWorkoutSetId: set.id,
        sortOrder: set.sortOrder ?? index + 1,
        setType: set.setType || 'straight',
        targetReps: set.targetReps ?? null,
        targetLoad: set.targetLoad ?? null,
        targetLoadUnit: set.targetLoadUnit ?? 'lb',
        targetRpe: set.targetRpe ?? null,
        prescribedRestSeconds: set.targetRestSeconds ?? exercise.defaultRestSeconds ?? null,
      })),
    })),
  })
}

function createAssignedProgramWorkoutPreview(programWorkout, fallbackWorkoutName = null) {
  if (Array.isArray(programWorkout?.exercises) && programWorkout.exercises.length > 0) {
    return createWorkoutPreviewFromProgramWorkout(programWorkout)
  }

  return createWorkoutPreview({
    programWorkoutId: programWorkout?.id || null,
    workoutName: programWorkout?.nameSnapshot || fallbackWorkoutName || 'Workout',
    exercises: [],
  })
}

function createWorkoutPreviewFromSession(session) {
  return createWorkoutPreview({
    programWorkoutId: getComparableProgramWorkoutId(session),
    workoutName: session.nameSnapshot,
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      name: exercise.nameSnapshot,
      setCount: exercise.sets.length,
      defaultRestSeconds: exercise.defaultRestSeconds,
    })),
  })
}

function createWorkoutPreview({ programWorkoutId = null, workoutName, exercises }) {
  return {
    programWorkoutId,
    workoutName,
    exercises,
  }
}

function buildDemoCompletedSession({ programWorkout, completedAt, squatLoad, rdlLoad }) {
  let session = createWorkoutSession({
    programWorkout,
    startedAt: '2026-04-21T20:00:00.000Z',
  })

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      const actualLoad = exercise.id === 'pwe-squat' ? squatLoad : rdlLoad
      session = completeWorkoutSet({
        session,
        exerciseId: exercise.id,
        setId: set.id,
        actuals: {
          actualLoad,
          actualReps: set.prescribedReps,
          actualRpe: set.prescribedRpe,
          actualRestSeconds: set.prescribedRestSeconds,
        },
      })
    }
  }

  return finishWorkoutSession({
    session,
    completedAt,
    elapsedSeconds: 1800,
  })
}
