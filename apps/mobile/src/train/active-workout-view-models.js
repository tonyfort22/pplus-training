import { formatClock, formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'
import { resolveMetricProfileIdFromExercise } from './exercise-metric-profile-resolution.js'

function formatSetCellValue(value, fallback = 0) {
  return String(value ?? fallback)
}

function resolveSetUnit(sets, actualUnitField, prescribedUnitField, fallbackUnit = null) {
  const sourceSet = (sets || []).find((set) => set?.[actualUnitField] || set?.[prescribedUnitField]) || null
  return sourceSet?.[actualUnitField] ?? sourceSet?.[prescribedUnitField] ?? fallbackUnit
}

function hasPositiveSetValue(set, ...fields) {
  return fields.some((field) => Number(set?.[field]) > 0)
}

function inferActiveWorkoutMetricProfileId(exercise) {
  const explicitProfileId = exercise?.metricProfileId ?? null
  if (explicitProfileId) return explicitProfileId

  const sets = Array.isArray(exercise?.sets) ? exercise.sets : []
  const hasLoad = sets.some((set) => hasPositiveSetValue(set, 'actualLoad', 'prescribedLoad'))
  const hasReps = sets.some((set) => hasPositiveSetValue(set, 'actualReps', 'prescribedReps'))
  const hasDistance = sets.some((set) => hasPositiveSetValue(set, 'actualDistance', 'prescribedDistance'))
  const hasDuration = sets.some((set) => hasPositiveSetValue(set, 'actualDurationSeconds', 'prescribedDurationSeconds'))
  const resolvedProfileId = resolveMetricProfileIdFromExercise(exercise)

  if (hasLoad && hasDistance && hasDuration) return 'distance_load'
  if (hasDistance && hasDuration) return 'speed_time'
  if (hasDuration && !hasLoad && !hasReps) return resolvedProfileId === 'speed_time' ? 'speed_time' : 'duration_hold'
  if (hasLoad && hasReps) return 'strength_1rm'
  if (hasReps) return 'bodyweight_reps'
  if (hasDuration) return 'duration_hold'
  if (resolvedProfileId) return resolvedProfileId

  return 'strength_1rm'
}

function getActiveWorkoutExerciseColumns(exercise) {
  const sets = Array.isArray(exercise?.sets) ? exercise.sets : []
  const profileId = inferActiveWorkoutMetricProfileId(exercise)
  const loadUnit = String(resolveSetUnit(sets, 'actualLoadUnit', 'prescribedLoadUnit', 'lb') || 'lb').toUpperCase()
  const distanceUnit = String(resolveSetUnit(sets, 'actualDistanceUnit', 'prescribedDistanceUnit', 'distance') || 'distance').toUpperCase()
  const effortColumn = { key: 'effort', label: 'EFFORT' }

  if (profileId === 'speed_time') return [effortColumn, { key: 'distance', label: distanceUnit }, { key: 'duration', label: 'TIME' }]
  if (profileId === 'distance_load') return [effortColumn, { key: 'load', label: loadUnit }, { key: 'distance', label: distanceUnit }, { key: 'duration', label: 'TIME' }]
  if (profileId === 'bodyweight_reps') return [effortColumn, { key: 'reps', label: 'REPS' }]
  if (profileId === 'duration_hold') return [effortColumn, { key: 'duration', label: 'TIME' }]

  return [effortColumn, { key: 'load', label: loadUnit }, { key: 'reps', label: 'REPS' }]
}

function getActiveWorkoutSetCellValue(set, columnKey) {
  if (columnKey === 'effort') return formatSetCellValue(set.actualRpe ?? set.prescribedRpe)
  if (columnKey === 'load') return formatSetCellValue(set.actualLoad ?? set.prescribedLoad)
  if (columnKey === 'reps') return formatSetCellValue(set.actualReps ?? set.prescribedReps)
  if (columnKey === 'distance') return formatSetCellValue(set.actualDistance ?? set.prescribedDistance)
  if (columnKey === 'duration') return formatSetCellValue(set.actualDurationSeconds ?? set.prescribedDurationSeconds)
  return ''
}

function getActiveWorkoutSetViewModel(set, index, columns, session, exercise) {
  return {
    id: set.id,
    setNumber: index + 1,
    cells: columns.map((column) => ({
      key: column.key,
      value: getActiveWorkoutSetCellValue(set, column.key),
    })),
    isCompleted: Boolean(set.isCompleted),
    isActiveTarget: session.activeSetTarget?.exerciseId === exercise.id && session.activeSetTarget?.setId === set.id,
  }
}

function getActiveWorkoutExerciseViewModel(exercise, session) {
  const columns = getActiveWorkoutExerciseColumns(exercise)

  return {
    id: exercise.id,
    exerciseId: exercise.exerciseId ?? exercise.id,
    title: exercise.nameSnapshot || exercise.name || 'Exercise',
    name: exercise.nameSnapshot || exercise.name || 'Exercise',
    videoUrl: exercise.videoUrl ?? null,
    thumbnailUrl: exercise.thumbnailUrl ?? null,
    defaultRestSeconds: exercise.defaultRestSeconds ?? null,
    supersetGroupId: exercise.supersetGroupId ?? null,
    supersetOrder: exercise.supersetOrder ?? null,
    isSupersetLinked: Boolean(exercise.supersetGroupId),
    restLabel: formatClock(exercise.defaultRestSeconds || 0),
    columns,
    sets: (exercise.sets || []).map((set, index) => getActiveWorkoutSetViewModel(set, index, columns, session, exercise)),
  }
}

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
    activeSetTarget: session.activeSetTarget ?? null,
    exercises: (session.exercises || []).map((exercise) => getActiveWorkoutExerciseViewModel(exercise, session)),
  }
}
