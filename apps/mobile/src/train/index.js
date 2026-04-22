import { completeWorkoutSet, createWorkoutSession, finishWorkoutSession } from '../../../../packages/core/src/index.js'

export const mobileTabs = [
  { key: 'train', label: 'Train' },
  { key: 'progress', label: 'Progress' },
  { key: 'team', label: 'Team' },
  { key: 'inbox', label: 'Inbox' },
]

export const trainTabs = [
  { key: 'today', label: 'Today' },
  { key: 'program', label: 'Program' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'workout', label: 'Workout' },
  { key: 'session', label: 'Session' },
]

function formatRestLabel(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
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

export function createTrainDemoState({ programWorkout = createDemoProgramWorkout(), startedAt } = {}) {
  const session = createWorkoutSession({ programWorkout, startedAt })

  return {
    today: {
      title: 'Today',
      workoutName: programWorkout.nameSnapshot,
      scheduledLabel: 'Scheduled for today',
      quickSummary: 'Start the session, log each set cleanly, and keep rest flowing.',
    },
    program: {
      name: 'Spring Hypertrophy',
      weekLabel: 'Week 3 of 8',
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

export function getTodaySurfaceModel(trainState) {
  const sessionProgress = getSessionProgressCopy(trainState.session)

  return {
    heroTitle: trainState.today.title,
    workoutName: trainState.today.workoutName,
    scheduledLabel: trainState.today.scheduledLabel,
    quickSummary: sessionProgress ? sessionProgress.summary : trainState.today.quickSummary,
    programName: trainState.program.name,
    programWeekLabel: trainState.program.weekLabel,
    completionLabel: trainState.program.completionLabel,
    primaryActionLabel: sessionProgress ? 'Resume session' : 'Open workout',
  }
}

export function getWorkoutSurfaceModel(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  const selectedDay = getSelectedCalendarDay(trainState, selectedCalendarDayId)
  const workoutPreview = selectedDay.workoutPreview || createWorkoutPreviewFromSession(trainState.session)
  const isTodayWorkout = selectedDay.id === 'tue'
  const sessionProgress = isTodayWorkout ? getSessionProgressCopy(trainState.session) : null
  const canOpenSession = isTodayWorkout

  return {
    dayId: selectedDay.id,
    dayLabel: `${selectedDay.dayLabel} • ${selectedDay.dateLabel}`,
    scheduleStatusLabel: formatCalendarStatus(selectedDay.status),
    workoutName: workoutPreview.workoutName,
    exerciseCount: workoutPreview.exercises.length,
    sessionProgressSummary: sessionProgress?.summary || null,
    primaryActionLabel: canOpenSession ? (sessionProgress ? 'Resume session' : 'Go to session') : 'Back to calendar',
    primaryTargetKey: canOpenSession ? 'session' : 'calendar',
    actionPayload: { selectedDayId: selectedDay.id },
    exercises: workoutPreview.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      setCount: exercise.setCount,
      defaultRestSeconds: exercise.defaultRestSeconds,
      defaultRestLabel: formatRestLabel(exercise.defaultRestSeconds),
    })),
  }
}

export function getCalendarSurfaceModel(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  const selectedDay = getSelectedCalendarDay(trainState, selectedCalendarDayId)

  return {
    title: 'Weekly schedule',
    body: `${trainState.program.name}, ${trainState.program.weekLabel}. ${selectedDay.dayLabel} is ${formatCalendarStatus(selectedDay.status).toLowerCase()} with ${selectedDay.workoutName}.`,
    actionLabel: selectedDay.workoutPreview ? `Open ${selectedDay.dayLabel} workout` : 'Stay on calendar',
    selectedDayId: selectedDay.id,
    selectedDay: {
      id: selectedDay.id,
      title: `${selectedDay.dayLabel} • ${selectedDay.workoutName}`,
      body: `${selectedDay.dateLabel} · ${formatCalendarStatus(selectedDay.status)}`,
    },
    actionPayload: { selectedDayId: selectedDay.id },
    days: trainState.program.calendarWeek.map((day) => ({
      id: day.id,
      title: `${day.dayLabel} • ${day.workoutName}`,
      body: `${day.dateLabel} · ${formatCalendarStatus(day.status)}`,
      status: day.status,
      isSelected: day.id === selectedDay.id,
      targetKey: day.workoutPreview ? 'workout' : undefined,
      actionPayload: day.workoutPreview ? { selectedDayId: day.id } : null,
    })),
  }
}

export function getSelectedCalendarDay(trainState, selectedCalendarDayId = trainState.program.selectedCalendarDayId) {
  return trainState.program.calendarWeek.find((day) => day.id === selectedCalendarDayId) || trainState.program.calendarWeek[0]
}

function getSessionProgressCopy(session) {
  if (!session || session.status !== 'in_progress' || session.completedSetsCount === 0) {
    return null
  }

  return {
    summary: `${session.completedSetsCount} of ${session.totalSetsCount} sets logged. Pick up where you left off and keep the rest timer moving.`,
  }
}

function formatCalendarStatus(status) {
  if (status === 'today') return 'Today'
  if (status === 'completed') return 'Completed'
  if (status === 'optional') return 'Optional'
  if (status === 'off') return 'Off day'
  return 'Upcoming'
}

function createDemoCalendarWeek(programWorkout) {
  return [
    {
      id: 'mon',
      dayLabel: 'Mon',
      dateLabel: 'Apr 20',
      workoutName: 'Upper A',
      status: 'completed',
      workoutPreview: createWorkoutPreview({
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
        workoutName: 'Speed + jumps',
        exercises: [
          { id: 'speed-jumps', name: 'Box Jump', setCount: 5, defaultRestSeconds: 90 },
          { id: 'speed-sprint', name: '10m Sprint', setCount: 6, defaultRestSeconds: 75 },
        ],
      }),
    },
    {
      id: 'sun',
      dayLabel: 'Sun',
      dateLabel: 'Apr 26',
      workoutName: 'Off',
      status: 'off',
      workoutPreview: null,
    },
  ]
}

function createWorkoutPreviewFromProgramWorkout(programWorkout) {
  return createWorkoutPreview({
    workoutName: programWorkout.nameSnapshot,
    exercises: programWorkout.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nameSnapshot,
      setCount: exercise.sets.length,
      defaultRestSeconds: exercise.defaultRestSeconds,
    })),
  })
}

function createWorkoutPreviewFromSession(session) {
  return createWorkoutPreview({
    workoutName: session.nameSnapshot,
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nameSnapshot,
      setCount: exercise.sets.length,
      defaultRestSeconds: exercise.defaultRestSeconds,
    })),
  })
}

function createWorkoutPreview({ workoutName, exercises }) {
  return {
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
