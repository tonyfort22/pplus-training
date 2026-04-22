import { createWorkoutSession } from '../../../../packages/core/src/index.js'

export const mobileTabs = [
  { key: 'train', label: 'Train' },
  { key: 'progress', label: 'Progress' },
  { key: 'team', label: 'Team' },
  { key: 'inbox', label: 'Inbox' },
]

export const trainTabs = [
  { key: 'today', label: 'Today' },
  { key: 'program', label: 'Program' },
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
    },
    session,
  }
}

export function getTodaySurfaceModel(trainState) {
  return {
    heroTitle: trainState.today.title,
    workoutName: trainState.today.workoutName,
    scheduledLabel: trainState.today.scheduledLabel,
    quickSummary: trainState.today.quickSummary,
    programName: trainState.program.name,
    programWeekLabel: trainState.program.weekLabel,
    completionLabel: trainState.program.completionLabel,
    primaryActionLabel: 'Open workout',
  }
}

export function getWorkoutSurfaceModel(trainState) {
  const session = trainState.session

  return {
    workoutName: session.nameSnapshot,
    exerciseCount: session.exercises.length,
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nameSnapshot,
      setCount: exercise.sets.length,
      defaultRestSeconds: exercise.defaultRestSeconds,
      defaultRestLabel: formatRestLabel(exercise.defaultRestSeconds),
    })),
  }
}
