import { doesSessionMatchWorkout, getComparableProgramWorkoutId } from './session-truth.js'

function getEffortLabel(index) {
  return String(6 + index)
}

function getExerciseThumbnailIcon(name) {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('pull')) return 'arrow-down'
  if (lowerName.includes('press')) return 'arrow-up'
  if (lowerName.includes('squat') || lowerName.includes('deadlift')) return 'dumbbell'
  if (lowerName.includes('jump') || lowerName.includes('sprint')) return 'zap'
  return 'dumbbell'
}

function getExerciseThumbnailUrl(exercise = {}) {
  return exercise.thumbnailUrl || exercise.thumbnail_url || null
}

function getWorkoutDetailThumbnailIcon(exercise = {}, name = '') {
  return getExerciseThumbnailUrl(exercise) ? getExerciseThumbnailIcon(name) : 'dumbbell'
}

function getWeightHeader(name) {
  return name.toLowerCase().includes('assisted') ? '-LB' : 'LB'
}

function getExerciseSets(exercise, dayId) {
  if (exercise.sets?.length) {
    return exercise.sets.map((set, index) => ({
      id: set.id,
      programWorkoutSetId: set.programWorkoutSetId || set.id || null,
      sortOrder: set.sortOrder ?? index + 1,
      setType: set.setType || 'straight',
      prescribedRestSeconds: set.prescribedRestSeconds ?? set.targetRestSeconds ?? exercise.defaultRestSeconds ?? null,
      targetLoadUnit: set.targetLoadUnit ?? set.prescribedLoadUnit ?? 'lb',
      setNumber: String(index + 1),
      effort: String(set.actualRpe ?? set.prescribedRpe ?? set.targetRpe ?? 6 + index),
      load: String(set.actualLoad ?? set.prescribedLoad ?? set.targetLoad ?? 0),
      reps: String(set.actualReps ?? set.prescribedReps ?? set.targetReps ?? 0),
    }))
  }

  const defaultReps = dayId === 'wed' ? 8 : 5
  const defaultLoad = (exercise.nameSnapshot || exercise.name || '').toLowerCase().includes('assisted') ? 0 : 100

  return Array.from({ length: exercise.setCount || 4 }, (_, index) => ({
    id: `${exercise.id}-set-${index + 1}`,
    programWorkoutSetId: null,
    sortOrder: index + 1,
    setType: 'straight',
    prescribedRestSeconds: exercise.defaultRestSeconds ?? null,
    targetLoadUnit: 'lb',
    setNumber: String(index + 1),
    effort: getEffortLabel(index),
    load: String(defaultLoad),
    reps: String(defaultReps),
  }))
}

function getSummaryItems(workoutModel, totalSets) {
  return [
    { id: 'summary-exercises', label: `${workoutModel.exerciseCount} Exercises` },
    { id: 'summary-sets', label: `${totalSets} sets` },
    { id: 'summary-duration', label: workoutModel.estimatedDurationLabel || estimateDurationLabel(totalSets) },
  ]
}

function estimateDurationLabel(totalSets) {
  if (totalSets >= 20) return 'Est. 1h 4m'
  if (totalSets >= 16) return 'Est. 52m'
  if (totalSets >= 12) return 'Est. 45m'
  return 'Est. 32m'
}

function formatRestLabel(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getSessionWorkoutModel(session, workoutModel, selectedDayId) {
  const sessionExercises = Array.isArray(session?.exercises) ? session.exercises : []
  const totalSets = session.totalSetsCount || sessionExercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0)
  const isInProgressSession = session?.status === 'in_progress'

  return {
    title: session.nameSnapshot || session.name || workoutModel.workoutName,
    workoutNotes: session.notes || '',
    programWorkoutId: getComparableProgramWorkoutId(session) || getComparableProgramWorkoutId(workoutModel) || null,
    summaryItems: getSummaryItems({
      exerciseCount: session.totalExercisesCount || sessionExercises.length,
      estimatedDurationLabel: workoutModel.estimatedDurationLabel,
    }, totalSets),
    editLabel: 'Edit',
    ctaLabel: isInProgressSession ? 'Resume Workout' : 'Start Workout',
    resumeNotice: isInProgressSession ? 'Workout in progress' : null,
    exercises: sessionExercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId || null,
      programWorkoutId: getComparableProgramWorkoutId(session),
      sortOrder: exercise.sortOrder ?? 0,
      name: exercise.nameSnapshot || exercise.name,
      thumbnailUrl: getExerciseThumbnailUrl(exercise),
      thumbnailIcon: getWorkoutDetailThumbnailIcon(exercise, exercise.nameSnapshot || exercise.name || ''),
      weightHeader: getWeightHeader(exercise.nameSnapshot || exercise.name || ''),
      restLabel: formatRestLabel(exercise.defaultRestSeconds),
      utilityIcon: 'arrow-up-down',
      sets: getExerciseSets(exercise, selectedDayId),
    })),
  }
}

function getProgramWorkoutModel(programWorkout, workoutModel, selectedDayId) {
  const exercises = Array.isArray(programWorkout?.exercises) ? programWorkout.exercises : []
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0)
  const explicitTitle = programWorkout?.nameSnapshot ?? ''

  return {
    title: explicitTitle,
    workoutNotes: programWorkout?.notes || '',
    programWorkoutId: programWorkout?.id || workoutModel?.actionPayload?.programWorkoutId || null,
    summaryItems: getSummaryItems({
      exerciseCount: exercises.length,
      estimatedDurationLabel: workoutModel.estimatedDurationLabel,
    }, totalSets),
    editLabel: 'Edit',
    ctaLabel: 'Start Workout',
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.id,
      programWorkoutId: programWorkout?.id || null,
      sortOrder: exercise.sortOrder ?? 0,
      name: exercise.nameSnapshot,
      thumbnailUrl: getExerciseThumbnailUrl(exercise),
      thumbnailIcon: getWorkoutDetailThumbnailIcon(exercise, exercise.nameSnapshot || ''),
      weightHeader: getWeightHeader(exercise.nameSnapshot || ''),
      restLabel: formatRestLabel(exercise.defaultRestSeconds),
      utilityIcon: 'arrow-up-down',
      sets: getExerciseSets(exercise, selectedDayId),
    })),
  }
}

export function getWorkoutSheetModel({ workoutModel, session, programWorkout = null, selectedDayId }) {
  if (doesSessionMatchWorkout(session, workoutModel) && Array.isArray(session?.exercises) && session.exercises.length > 0) {
    return getSessionWorkoutModel(session, workoutModel, selectedDayId)
  }

  if (doesSessionMatchWorkout(programWorkout, workoutModel) && programWorkout?.id) {
    return getProgramWorkoutModel(programWorkout, workoutModel, selectedDayId)
  }

  const totalSets = workoutModel.exercises.reduce((sum, exercise) => sum + (exercise.setCount || exercise.sets?.length || 0), 0)
  const ctaLabel = 'Start Workout'

  return {
    title: workoutModel.workoutName,
    workoutNotes: '',
    programWorkoutId: getComparableProgramWorkoutId(workoutModel),
    summaryItems: getSummaryItems(workoutModel, totalSets),
    editLabel: 'Edit',
    ctaLabel,
    exercises: workoutModel.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId || null,
      programWorkoutId: getComparableProgramWorkoutId(workoutModel),
      sortOrder: exercise.sortOrder ?? 0,
      name: exercise.name,
      thumbnailUrl: getExerciseThumbnailUrl(exercise),
      thumbnailIcon: getWorkoutDetailThumbnailIcon(exercise, exercise.name),
      weightHeader: getWeightHeader(exercise.name),
      restLabel: exercise.defaultRestLabel,
      utilityIcon: 'arrow-up-down',
      sets: getExerciseSets(exercise, selectedDayId),
    })),
  }
}
