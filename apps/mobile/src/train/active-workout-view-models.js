import { formatClock, formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'

export function getActiveWorkoutViewModel({ session, elapsedSeconds = 0 }) {
  if (!session) return null

  const progress = getSessionProgress(session)
  const exerciseCount = (session.exercises || []).length
  const sessionSettings = session.settings || {}

  return {
    title: session.nameSnapshot || session.name || 'Workout Session',
    notesPlaceholder: 'Add notes',
    notesValue: session.notes ?? '',
    addSetLabel: 'Add Set',
    settingsButtonLabel: 'Workout Settings',
    defaultRestTimerLabel: sessionSettings.defaultRestSeconds != null
      ? formatClock(sessionSettings.defaultRestSeconds)
      : ((session.exercises || [])[0]?.defaultRestSeconds != null
        ? formatClock((session.exercises || [])[0].defaultRestSeconds)
        : '00:00'),
    workoutSettings: {
      defaultRestSeconds: sessionSettings.defaultRestSeconds ?? null,
      defaultRestClockLabel: sessionSettings.defaultRestSeconds != null ? formatClock(sessionSettings.defaultRestSeconds) : '00:00',
      autoProgressEnabled: sessionSettings.autoProgressEnabled ?? false,
      keepAwake: sessionSettings.keepAwake ?? false,
      adjustEffortAfterSet: sessionSettings.adjustEffortAfterSet ?? false,
    },
    header: {
      workoutTimerLabel: formatWorkoutTimer(elapsedSeconds),
      finishLabel: session.status === 'completed' ? 'Completed' : 'Finish',
      progressLabel: `${progress.completedSets}/${progress.totalSets} Sets`,
      exerciseCountLabel: `${exerciseCount} Exercises`,
    },
    restTimer: session.activeRestTimer
      ? {
          clockLabel: formatClock(session.activeRestTimer.remainingSeconds),
          minusLabel: '-15s',
          plusLabel: '+15s',
          dismissLabel: 'Dismiss',
        }
      : null,
    exercises: (session.exercises || []).map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId ?? exercise.id,
      title: exercise.nameSnapshot || exercise.name || 'Exercise',
      name: exercise.nameSnapshot || exercise.name || 'Exercise',
      videoUrl: exercise.videoUrl ?? null,
      thumbnailUrl: exercise.thumbnailUrl ?? null,
      defaultRestSeconds: exercise.defaultRestSeconds ?? null,
      restLabel: formatClock(exercise.defaultRestSeconds || 0),
      sets: (exercise.sets || []).map((set, index) => ({
        id: set.id,
        setNumber: index + 1,
        effort: String(set.actualRpe ?? set.prescribedRpe ?? 0),
        load: String(set.actualLoad ?? set.prescribedLoad ?? 0),
        reps: String(set.actualReps ?? set.prescribedReps ?? 0),
        isCompleted: Boolean(set.isCompleted),
      })),
    })),
  }
}
