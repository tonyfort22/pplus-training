import {
  resolveMetricProfileIdFromExercise,
} from '../train/exercise-metric-profile-resolution.js'

const DEFAULT_ANALYTICS_VIEW_MODEL = {
  title: 'ANALYTICS',
  progressLabel: 'Progress',
  progressOptions: [
    { id: 'strength', label: 'Strength' },
    { id: 'speed', label: 'Speed' },
    { id: 'consistency', label: 'Consistency' },
    { id: 'loaded-carry', label: 'Loaded Carry' },
    { id: 'bodyweight', label: 'Bodyweight' },
    { id: 'holds', label: 'Holds' },
  ],
  activeProgressOptionId: 'strength',
  progressMetricCardsByOptionId: {
    strength: [],
    speed: [],
    'loaded-carry': [],
    bodyweight: [],
    holds: [],
  },
  defaultMetricExerciseIdsByOptionId: {
    strength: [],
    speed: [],
    'loaded-carry': [],
    bodyweight: [],
    holds: [],
  },
  oneRepMaxLabel: '1RM',
  consistencyLabel: 'Consistency',
  consistencyChart: {
    title: 'Workouts per week',
    yAxisLabels: ['6', '4', '2'],
    xAxisLabels: [],
    bars: [
      { id: 'consistency-week-1', label: '', value: 0, frontColor: '#34D399' },
      { id: 'consistency-week-2', label: '', value: 0, frontColor: '#34D399' },
      { id: 'consistency-week-3', label: '', value: 0, frontColor: '#34D399' },
      { id: 'consistency-week-4', label: '', value: 0, frontColor: '#34D399' },
      { id: 'consistency-week-5', label: '', value: 0, frontColor: '#34D399' },
    ],
  },
  strengthCards: [
    {
      id: 'back-squat',
      exerciseId: 'exercise-back-squat',
      metricLabel: '1RM',
      exerciseName: 'Barbell Back Squat',
      estimatedOneRepMax: 149,
      strongestLoad: 120,
      strongestReps: 8,
      loadUnit: 'lb',
      oneRepMaxValueLabel: '149 lb',
      sourcePerformanceTagLabel: '120 lb x 8',
    },
    {
      id: 'bench-press',
      exerciseId: 'exercise-bench-press',
      metricLabel: '1RM',
      exerciseName: 'Barbell Bench Press',
      estimatedOneRepMax: 0,
      strongestLoad: 0,
      strongestReps: 8,
      loadUnit: 'lb',
      oneRepMaxValueLabel: '0 lb',
      sourcePerformanceTagLabel: '0 lb x 8',
    },
  ],
  defaultStrengthExerciseIds: ['exercise-back-squat', 'exercise-bench-press'],
  trainingLoadLabel: 'Training Load',
  trainingLoadOptions: [
    { id: 'recovery', label: 'Recovery' },
    { id: 'seven-day-activity', label: '7 Days Activity' },
  ],
  activeTrainingLoadOptionId: 'recovery',
  recoveryMuscleGroups: [
    {
      id: 'arms',
      label: 'Arms',
      percentageLabel: '100%',
      barWidth: '100%',
      subMuscles: [
        { id: 'biceps', label: 'Biceps', percentageLabel: '100%', barWidth: '100%' },
        { id: 'triceps', label: 'Triceps', percentageLabel: '100%', barWidth: '100%' },
        { id: 'forearms', label: 'Forearms', percentageLabel: '100%', barWidth: '100%' },
      ],
    },
    {
      id: 'shoulders',
      label: 'Shoulders',
      percentageLabel: '100%',
      barWidth: '100%',
      subMuscles: [
        { id: 'front-delts', label: 'Front Delts', percentageLabel: '100%', barWidth: '100%' },
        { id: 'side-delts', label: 'Side Delts', percentageLabel: '100%', barWidth: '100%' },
        { id: 'rear-delts', label: 'Rear Delts', percentageLabel: '100%', barWidth: '100%' },
      ],
    },
    {
      id: 'chest',
      label: 'Chest',
      percentageLabel: '100%',
      barWidth: '100%',
      subMuscles: [
        { id: 'upper-chest', label: 'Upper Chest', percentageLabel: '100%', barWidth: '100%' },
        { id: 'mid-chest', label: 'Mid Chest', percentageLabel: '100%', barWidth: '100%' },
        { id: 'lower-chest', label: 'Lower Chest', percentageLabel: '100%', barWidth: '100%' },
      ],
    },
    {
      id: 'back',
      label: 'Back',
      percentageLabel: '100%',
      barWidth: '100%',
      subMuscles: [
        { id: 'lats', label: 'Lats', percentageLabel: '100%', barWidth: '100%' },
        { id: 'traps', label: 'Traps', percentageLabel: '100%', barWidth: '100%' },
        { id: 'lower-back', label: 'Lower Back', percentageLabel: '100%', barWidth: '100%' },
      ],
    },
    {
      id: 'abs',
      label: 'Abs',
      percentageLabel: '100%',
      barWidth: '100%',
      subMuscles: [
        { id: 'upper-abs', label: 'Upper Abs', percentageLabel: '100%', barWidth: '100%' },
        { id: 'lower-abs', label: 'Lower Abs', percentageLabel: '100%', barWidth: '100%' },
        { id: 'obliques', label: 'Obliques', percentageLabel: '100%', barWidth: '100%' },
      ],
    },
    {
      id: 'legs',
      label: 'Legs',
      percentageLabel: '97%',
      barWidth: '97%',
      subMuscles: [
        { id: 'quads', label: 'Quads', percentageLabel: '97%', barWidth: '97%' },
        { id: 'hamstrings', label: 'Hamstrings', percentageLabel: '97%', barWidth: '97%' },
        { id: 'calves', label: 'Calves', percentageLabel: '97%', barWidth: '97%' },
      ],
    },
  ],
  recoveryRows: [
    { id: 'arms', label: 'Arms', percentageLabel: '100%', barWidth: '100%' },
    { id: 'shoulders', label: 'Shoulders', percentageLabel: '100%', barWidth: '100%' },
    { id: 'chest', label: 'Chest', percentageLabel: '100%', barWidth: '100%' },
    { id: 'back', label: 'Back', percentageLabel: '100%', barWidth: '100%' },
    { id: 'abs', label: 'Abs', percentageLabel: '100%', barWidth: '100%' },
    { id: 'legs', label: 'Legs', percentageLabel: '97%', barWidth: '97%' },
  ],
  activityMuscleGroups: [
    {
      id: 'arms',
      label: 'Arms',
      setCountLabel: '0 sets',
      subMuscles: [
        { id: 'biceps', label: 'Biceps', setCountLabel: '0 sets' },
        { id: 'triceps', label: 'Triceps', setCountLabel: '0 sets' },
        { id: 'forearms', label: 'Forearms', setCountLabel: '0 sets' },
      ],
    },
    {
      id: 'shoulders',
      label: 'Shoulders',
      setCountLabel: '0 sets',
      subMuscles: [
        { id: 'front-delts', label: 'Front Delts', setCountLabel: '0 sets' },
        { id: 'side-delts', label: 'Side Delts', setCountLabel: '0 sets' },
        { id: 'rear-delts', label: 'Rear Delts', setCountLabel: '0 sets' },
      ],
    },
    {
      id: 'chest',
      label: 'Chest',
      setCountLabel: '0 sets',
      subMuscles: [
        { id: 'upper-chest', label: 'Upper Chest', setCountLabel: '0 sets' },
        { id: 'mid-chest', label: 'Mid Chest', setCountLabel: '0 sets' },
        { id: 'lower-chest', label: 'Lower Chest', setCountLabel: '0 sets' },
      ],
    },
    {
      id: 'back',
      label: 'Back',
      setCountLabel: '0 sets',
      subMuscles: [
        { id: 'lats', label: 'Lats', setCountLabel: '0 sets' },
        { id: 'traps', label: 'Traps', setCountLabel: '0 sets' },
        { id: 'lower-back', label: 'Lower Back', setCountLabel: '0 sets' },
      ],
    },
    {
      id: 'abs',
      label: 'Abs',
      setCountLabel: '0 sets',
      subMuscles: [
        { id: 'upper-abs', label: 'Upper Abs', setCountLabel: '0 sets' },
        { id: 'lower-abs', label: 'Lower Abs', setCountLabel: '0 sets' },
        { id: 'obliques', label: 'Obliques', setCountLabel: '0 sets' },
      ],
    },
    {
      id: 'legs',
      label: 'Legs',
      setCountLabel: '6 sets',
      subMuscles: [
        { id: 'quads', label: 'Quads', setCountLabel: '4 sets' },
        { id: 'hamstrings', label: 'Hamstrings', setCountLabel: '2 sets' },
        { id: 'calves', label: 'Calves', setCountLabel: '0 sets' },
      ],
    },
  ],
  healthMetricsTitle: 'Health Metrics',
  healthMetrics: [
    { id: 'sleep', label: 'Sleep', icon: 'sleep' },
    { id: 'resting-hr', label: 'Resting HR', icon: 'heart' },
    { id: 'hrv', label: 'HRV', icon: 'waves' },
  ],
  primaryActionLabel: 'Start Workout',
}

export function getProgressSurfaceModel({ sessions = [] } = {}) {
  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const squatPerformance = getBestExercisePerformance(completedSessions, 'Back Squat')
  const squatEstimate = squatPerformance ? estimateOneRepMax(squatPerformance.actualLoad, squatPerformance.actualReps) : null
  const totalLoadScore = Math.round(
    completedSessions.reduce((sum, session) => sum + getSessionLoadVolume(session), 0) / 100
  )
  const readiness = getReadinessLabel(totalLoadScore)
  const fatigueRows = buildFatigueRows(completedSessions)
  const adherence = completedSessions.length > 0 ? '100% adherence' : 'No completed sessions yet'
  const readinessInterpretation = getReadinessInterpretation({
    completedSessions,
    totalLoadScore,
    readiness,
    fatigueRows,
  })

  return {
    header: {
      eyebrow: 'Progress',
      title: 'Performance & recovery',
      body: 'This is where the athlete should see results from completed training, not just the workouts themselves.',
    },
    metrics: [
      {
        label: 'Back Squat est. 1RM',
        value: squatEstimate ? `${squatEstimate} lb` : '--',
        detail: squatEstimate
          ? `Best completed set came from ${squatPerformance.actualLoad} lb x ${squatPerformance.actualReps} reps`
          : 'Complete squat sessions to unlock a trend line',
      },
      {
        label: 'Weekly load',
        value: String(totalLoadScore),
        detail: `${completedSessions.length} completed sessions contributing to the current load score`,
      },
      {
        label: 'Readiness',
        value: readiness,
        detail: readiness === 'Low'
          ? 'Recovery is clear and ready for more completed work'
          : 'Solid work logged, but fatigue is starting to accumulate',
      },
    ],
    readinessInterpretation,
    trainingLoad: {
      title: 'Training load',
      body: `${completedSessions.length} completed sessions are currently feeding this load view. The score comes from actual load x reps across logged sets.`,
    },
    muscleFatigue: {
      title: 'Muscle fatigue',
      body: 'This surface now reflects which lower-body groups are carrying the most completed work from logged sessions.',
      rows: fatigueRows,
    },
    performanceSnapshots: {
      title: 'Performance snapshots',
      body: completedSessions.length > 0
        ? `${adherence} across the current sample, with progress driven only by completed actual work.`
        : 'No completed sessions yet. Finish a workout to start building adherence and performance snapshots.',
    },
    recentMomentum: {
      title: 'Recent momentum',
      rows: buildRecentMomentumRows(completedSessions),
    },
    exerciseBreakdown: {
      title: 'Exercise breakdown',
      rows: buildExerciseBreakdownRows(completedSessions),
    },
  }
}

export function getPlaceholderSurfaceModel(title, body) {
  return { title, body }
}

export function getAnalyticsViewModel({ sessions = [], progressModel = null, strengthSelectionContextId = null } = {}) {
  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const progressMetricCardsByOptionId = buildAnalyticsMetricCardsByOptionId(completedSessions)
  const defaultMetricExerciseIdsByOptionId = buildDefaultMetricExerciseIdsByOptionId(completedSessions)

  return {
    ...DEFAULT_ANALYTICS_VIEW_MODEL,
    strengthSelectionPersistenceKey: buildStrengthSelectionPersistenceKey({
      sessions: completedSessions,
      strengthSelectionContextId,
    }),
    progressMetricCardsByOptionId,
    defaultMetricExerciseIdsByOptionId,
    strengthCards: progressMetricCardsByOptionId.strength,
    defaultStrengthExerciseIds: defaultMetricExerciseIdsByOptionId.strength,
    consistencyChart: buildConsistencyChart(completedSessions),
    recoveryMuscleGroups: buildAnalyticsRecoveryMuscleGroups(completedSessions),
    recoveryRows: buildAnalyticsRecoveryRows(completedSessions),
    activityMuscleGroups: buildAnalyticsActivityMuscleGroups(completedSessions),
  }
}

function buildStrengthSelectionPersistenceKey(input = {}) {
  const sessions = Array.isArray(input)
    ? input
    : Array.isArray(input?.sessions)
      ? input.sessions
      : []
  const strengthSelectionContextId = Array.isArray(input) ? null : input?.strengthSelectionContextId ?? null
  const normalizedContextId = String(
    strengthSelectionContextId
    || sessions.find((session) => session?.athleteId)?.athleteId
    || 'default'
  ).trim()

  return `analytics-strength:${normalizedContextId || 'default'}`
}

function buildAnalyticsStrengthCards(sessions) {
  return buildAnalyticsMetricCardsByOptionId(sessions).strength
}

function getProgressMetricOptionId(metricProfileId) {
  if (metricProfileId === 'speed_time') return 'speed'
  if (metricProfileId === 'distance_load') return 'loaded-carry'
  if (metricProfileId === 'bodyweight_reps') return 'bodyweight'
  if (metricProfileId === 'duration_hold') return 'holds'
  return 'strength'
}

function getProgressMetricLabel(metricProfileId) {
  if (metricProfileId === 'speed_time') return 'TIME'
  if (metricProfileId === 'distance_load') return 'TIME'
  if (metricProfileId === 'bodyweight_reps') return 'REPS'
  if (metricProfileId === 'duration_hold') return 'DURATION'
  return DEFAULT_ANALYTICS_VIEW_MODEL.oneRepMaxLabel
}

function resolveMetricProfileIdForAnalyticsSet(exercise, set) {
  const resolvedMetricProfileId = resolveMetricProfileIdFromExercise(exercise)
  if (resolvedMetricProfileId) return resolvedMetricProfileId

  const load = set.actualLoad ?? set.prescribedLoad
  const reps = set.actualReps ?? set.prescribedReps
  const durationSeconds = set.actualDurationSeconds ?? set.prescribedDurationSeconds
  const distance = set.actualDistance ?? set.prescribedDistance

  if (load != null && Number(load) > 0 && reps != null && Number(reps) > 0) return 'strength_1rm'
  if (load != null && Number(load) > 0 && distance != null && Number(distance) > 0 && durationSeconds != null && Number(durationSeconds) > 0) return 'distance_load'
  if (distance != null && Number(distance) > 0 && durationSeconds != null && Number(durationSeconds) > 0) return 'speed_time'
  if (reps != null && Number(reps) > 0 && !(load != null && Number(load) > 0)) return 'bodyweight_reps'
  if (durationSeconds != null && Number(durationSeconds) > 0) return 'duration_hold'

  return null
}

function buildAnalyticsMetricCardsByOptionId(sessions) {
  const bestCardByOptionAndExerciseId = new Map()

  const bestSetByExercise = new Map()

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const exerciseName = exercise.nameSnapshot || exercise.name || ''
      const exerciseId = exercise.exerciseId || exercise.id || exerciseName
      if (!exerciseName || !exerciseId) continue

      for (const set of exercise.sets || []) {
        if (!set.isCompleted) continue
        const metricProfileId = resolveMetricProfileIdForAnalyticsSet(exercise, set)
        if (!metricProfileId) continue

        const optionId = getProgressMetricOptionId(metricProfileId)
        const load = set.actualLoad ?? set.prescribedLoad
        const reps = set.actualReps ?? set.prescribedReps
        const durationSeconds = set.actualDurationSeconds ?? set.prescribedDurationSeconds
        const distance = set.actualDistance ?? set.prescribedDistance
        const loadUnit = set.actualLoadUnit ?? set.prescribedLoadUnit ?? null
        const distanceUnit = set.actualDistanceUnit ?? set.prescribedDistanceUnit ?? null
        const mapKey = `${optionId}:${exerciseId}`

        let nextCard = null
        let nextSortValue = null

        if (metricProfileId === 'strength_1rm') {
          if (load == null || reps == null) continue
          const estimatedOneRepMax = estimateOneRepMax(load, reps)
          nextSortValue = estimatedOneRepMax
          nextCard = {
            id: mapKey,
            exerciseId,
            exerciseName,
            metricProfileId,
            metricLabel: getProgressMetricLabel(metricProfileId),
            estimatedOneRepMax,
            strongestLoad: load,
            strongestReps: reps,
            loadUnit,
            stimulusType: exercise?.stimulusType || null,
            movementPattern: exercise?.movementPattern || null,
            videoUrl: exercise?.videoUrl || null,
            thumbnailUrl: exercise?.thumbnailUrl || null,
            oneRepMaxValueLabel: formatStrengthValue(estimatedOneRepMax, loadUnit),
            sourcePerformanceTagLabel: `${formatStrengthValue(load, loadUnit)} x ${reps}`,
          }
        } else if (metricProfileId === 'speed_time') {
          if (distance == null || durationSeconds == null) continue
          nextSortValue = getPaceSortValue(durationSeconds, distance, distanceUnit)
          if (nextSortValue == null) continue
          nextCard = {
            id: mapKey,
            exerciseId,
            exerciseName,
            metricProfileId,
            metricLabel: getProgressMetricLabel(metricProfileId),
            stimulusType: exercise?.stimulusType || null,
            movementPattern: exercise?.movementPattern || null,
            videoUrl: exercise?.videoUrl || null,
            thumbnailUrl: exercise?.thumbnailUrl || null,
            oneRepMaxValueLabel: formatDurationLabel(durationSeconds),
            sourcePerformanceTagLabel: formatDistanceLabel(distance, distanceUnit),
            sortValue: nextSortValue,
          }
        } else if (metricProfileId === 'distance_load') {
          if (distance == null || durationSeconds == null) continue
          nextSortValue = getPaceSortValue(durationSeconds, distance, distanceUnit)
          if (nextSortValue == null) continue
          nextCard = {
            id: mapKey,
            exerciseId,
            exerciseName,
            metricProfileId,
            metricLabel: getProgressMetricLabel(metricProfileId),
            stimulusType: exercise?.stimulusType || null,
            movementPattern: exercise?.movementPattern || null,
            videoUrl: exercise?.videoUrl || null,
            thumbnailUrl: exercise?.thumbnailUrl || null,
            oneRepMaxValueLabel: formatDurationLabel(durationSeconds),
            sourcePerformanceTagLabel: [load != null && Number(load) > 0 ? formatStrengthValue(load, loadUnit) : null, formatDistanceLabel(distance, distanceUnit)].filter(Boolean).join(' • '),
            sortValue: nextSortValue,
          }
        } else if (metricProfileId === 'bodyweight_reps') {
          if (reps == null) continue
          nextSortValue = Number(reps)
          nextCard = {
            id: mapKey,
            exerciseId,
            exerciseName,
            metricProfileId,
            metricLabel: getProgressMetricLabel(metricProfileId),
            stimulusType: exercise?.stimulusType || null,
            movementPattern: exercise?.movementPattern || null,
            videoUrl: exercise?.videoUrl || null,
            thumbnailUrl: exercise?.thumbnailUrl || null,
            oneRepMaxValueLabel: `${Math.round(Number(reps))}`,
            sourcePerformanceTagLabel: durationSeconds != null && Number(durationSeconds) > 0 ? formatDurationLabel(durationSeconds) : `${Math.round(Number(reps))} reps`,
            sortValue: nextSortValue,
          }
        } else if (metricProfileId === 'duration_hold') {
          if (durationSeconds == null) continue
          nextSortValue = Number(durationSeconds)
          nextCard = {
            id: mapKey,
            exerciseId,
            exerciseName,
            metricProfileId,
            metricLabel: getProgressMetricLabel(metricProfileId),
            stimulusType: exercise?.stimulusType || null,
            movementPattern: exercise?.movementPattern || null,
            videoUrl: exercise?.videoUrl || null,
            thumbnailUrl: exercise?.thumbnailUrl || null,
            oneRepMaxValueLabel: formatDurationLabel(durationSeconds),
            sourcePerformanceTagLabel: 'Best hold',
            sortValue: nextSortValue,
          }
        }

        if (!nextCard) continue
        const existing = bestCardByOptionAndExerciseId.get(mapKey)
        if (!existing || nextSortValue > existing.sortValue) {
          bestCardByOptionAndExerciseId.set(mapKey, { ...nextCard, sortValue: nextSortValue })
        }
      }
    }
  }

  const byOption = {
    strength: [],
    speed: [],
    'loaded-carry': [],
    bodyweight: [],
    holds: [],
  }

  for (const card of bestCardByOptionAndExerciseId.values()) {
    const optionId = getProgressMetricOptionId(card.metricProfileId)
    byOption[optionId].push(card)
  }

  for (const optionId of Object.keys(byOption)) {
    byOption[optionId] = byOption[optionId]
      .sort((left, right) => right.sortValue - left.sortValue || left.exerciseName.localeCompare(right.exerciseName))
      .map(({ sortValue, ...card }) => card)
  }

  if (!byOption.strength.length) {
    byOption.strength = DEFAULT_ANALYTICS_VIEW_MODEL.strengthCards
  }

  return byOption
}

function buildDefaultStrengthExerciseIds(sessions) {
  return buildDefaultMetricExerciseIdsByOptionId(sessions).strength
}

function buildDefaultMetricExerciseIdsByOptionId(sessions) {
  const countsByOptionAndExerciseId = new Map()

  const exerciseCountById = new Map()

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const exerciseName = exercise.nameSnapshot || exercise.name || ''
      const exerciseId = exercise.exerciseId || exercise.id || exerciseName
      if (!exerciseName || !exerciseId) continue

      let hasMetricCompletedSet = false
      let resolvedOptionId = null
      for (const set of exercise.sets || []) {
        if (!set.isCompleted) continue
        const metricProfileId = resolveMetricProfileIdForAnalyticsSet(exercise, set)
        if (!metricProfileId) continue
        resolvedOptionId = getProgressMetricOptionId(metricProfileId)
        hasMetricCompletedSet = true
        break
      }

      if (!hasMetricCompletedSet) continue

      const mapKey = `${resolvedOptionId}:${exerciseId}`
      const existing = countsByOptionAndExerciseId.get(mapKey)
      if (existing) existing.count += 1
      else countsByOptionAndExerciseId.set(mapKey, { optionId: resolvedOptionId, exerciseId, exerciseName, count: 1 })
    }
  }

  const byOption = {
    strength: [],
    speed: [],
    'loaded-carry': [],
    bodyweight: [],
    holds: [],
  }
  for (const entry of countsByOptionAndExerciseId.values()) {
    byOption[entry.optionId].push(entry)
  }
  for (const optionId of Object.keys(byOption)) {
    byOption[optionId] = byOption[optionId]
      .sort((left, right) => right.count - left.count || left.exerciseName.localeCompare(right.exerciseName))
      .slice(0, 2)
      .map((entry) => entry.exerciseId)
  }
  if (!byOption.strength.length) byOption.strength = DEFAULT_ANALYTICS_VIEW_MODEL.defaultStrengthExerciseIds
  return byOption
}

function formatStrengthValue(value, unit) {
  const roundedValue = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0
  return unit ? `${roundedValue} ${unit}` : String(roundedValue)
}

function formatDurationLabel(durationSeconds) {
  if (!Number.isFinite(Number(durationSeconds)) || Number(durationSeconds) <= 0) return '--'
  return `${Number(durationSeconds).toFixed(1).replace(/\.0$/, '')} s`
}

function formatDistanceLabel(distance, unit = null) {
  if (!Number.isFinite(Number(distance)) || Number(distance) <= 0) return '--'
  const value = Number.isInteger(Number(distance)) ? String(Number(distance)) : Number(distance).toFixed(1).replace(/\.0$/, '')
  return unit ? `${value} ${unit}` : value
}

function normalizeDistanceToMeters(distance, distanceUnit = null) {
  if (!Number.isFinite(Number(distance)) || Number(distance) <= 0) return null
  const normalizedUnit = String(distanceUnit || '').trim().toLowerCase()
  const numericDistance = Number(distance)

  if (!normalizedUnit || normalizedUnit === 'm' || normalizedUnit === 'meter' || normalizedUnit === 'meters') return numericDistance
  if (normalizedUnit === 'km' || normalizedUnit === 'kilometer' || normalizedUnit === 'kilometers') return numericDistance * 1000
  if (normalizedUnit === 'yd' || normalizedUnit === 'yard' || normalizedUnit === 'yards') return numericDistance * 0.9144
  if (normalizedUnit === 'mi' || normalizedUnit === 'mile' || normalizedUnit === 'miles') return numericDistance * 1609.344
  if (normalizedUnit === 'ft' || normalizedUnit === 'foot' || normalizedUnit === 'feet') return numericDistance * 0.3048
  return numericDistance
}

function getPaceSortValue(durationSeconds, distance, distanceUnit = null) {
  if (!Number.isFinite(Number(durationSeconds)) || Number(durationSeconds) <= 0) return null
  const normalizedDistance = normalizeDistanceToMeters(distance, distanceUnit)
  if (!Number.isFinite(normalizedDistance) || normalizedDistance <= 0) return null
  return -(Number(durationSeconds) / normalizedDistance)
}

function buildConsistencyChart(sessions) {
  const defaultChart = DEFAULT_ANALYTICS_VIEW_MODEL.consistencyChart
  const weekSlots = buildConsistencyWeekSlots(sessions, defaultChart.bars.length)
  const weekCounts = buildWeeklyCompletedSessionCounts(sessions, defaultChart.bars.length)

  return {
    ...defaultChart,
    xAxisLabels: weekSlots.map((slot) => slot.label),
    bars: defaultChart.bars.map((bar, index) => {
      const value = weekCounts[index] ?? 0
      const slot = weekSlots[index]
      return {
        ...bar,
        id: slot?.id || bar.id,
        value,
        frontColor: value > 0 ? bar.frontColor || '#34D399' : 'transparent',
      }
    }),
  }
}

function buildConsistencyWeekSlots(sessions, count = 5) {
  const orderedSessions = getOrderedCompletedSessionTimestamps(sessions)
  if (!orderedSessions.length) {
    return Array.from({ length: count }, (_, index) => ({
      id: `consistency-week-${index + 1}`,
      label: '',
    }))
  }

  const latestTimestamp = orderedSessions[orderedSessions.length - 1]
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const oldestWindowStart = latestTimestamp - ((count - 1) * weekMs)

  return Array.from({ length: count }, (_, index) => ({
    id: `consistency-week-${index + 1}`,
    label: formatSessionDate(oldestWindowStart + (index * weekMs)),
  }))
}

function buildWeeklyCompletedSessionCounts(sessions, count = 5) {
  const orderedSessions = getOrderedCompletedSessionTimestamps(sessions)
  if (!orderedSessions.length) {
    return Array.from({ length: count }, () => 0)
  }

  const latestTimestamp = orderedSessions[orderedSessions.length - 1]
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const counts = Array.from({ length: count }, () => 0)

  for (const timestamp of orderedSessions) {
    const ageIndex = Math.floor((latestTimestamp - timestamp) / weekMs)
    const chartIndex = counts.length - 1 - ageIndex
    if (chartIndex < 0 || chartIndex >= counts.length) continue
    counts[chartIndex] += 1
  }

  return counts
}

function getOrderedCompletedSessionTimestamps(sessions) {
  return [...sessions]
    .map((session) => new Date(session.completedAt || session.startedAt || 0).getTime())
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0)
    .sort((left, right) => left - right)
}

function buildAnalyticsRecoveryMuscleGroups(sessions) {
  const totals = buildAnalyticsMuscleTotals(sessions)
  const baseRows = DEFAULT_ANALYTICS_VIEW_MODEL.recoveryMuscleGroups
  const maxVolume = Math.max(totals.quads, totals.hamstrings, totals.calves, 0)

  return baseRows.map((row) => {
    if (row.id !== 'legs') {
      return {
        ...row,
        percentageLabel: '100%',
        barWidth: '100%',
        subMuscles: row.subMuscles.map((subMuscle) => ({
          ...subMuscle,
          percentageLabel: '100%',
          barWidth: '100%',
        })),
      }
    }

    const quads = getRecoveryPercentage(totals.quads, maxVolume)
    const hamstrings = getRecoveryPercentage(totals.hamstrings, maxVolume)
    const calves = getRecoveryPercentage(totals.calves, maxVolume)
    const legs = Math.round((quads + hamstrings + calves) / 3)

    return {
      ...row,
      percentageLabel: formatPercentageLabel(legs, maxVolume === 0),
      barWidth: formatPercentageWidth(legs, maxVolume === 0),
      subMuscles: row.subMuscles.map((subMuscle) => {
        const value = subMuscle.id === 'quads'
          ? quads
          : subMuscle.id === 'hamstrings'
            ? hamstrings
            : calves
        return {
          ...subMuscle,
          percentageLabel: formatPercentageLabel(value, maxVolume === 0),
          barWidth: formatPercentageWidth(value, maxVolume === 0),
        }
      }),
    }
  })
}

function buildAnalyticsRecoveryRows(sessions) {
  return buildAnalyticsRecoveryMuscleGroups(sessions).map(({ id, label, percentageLabel, barWidth }) => ({
    id,
    label,
    percentageLabel,
    barWidth,
  }))
}

function buildAnalyticsActivityMuscleGroups(sessions) {
  const totals = buildAnalyticsMuscleTotals(sessions)
  const baseRows = DEFAULT_ANALYTICS_VIEW_MODEL.activityMuscleGroups

  return baseRows.map((row) => {
    if (row.id !== 'legs') {
      return {
        ...row,
        setCountLabel: '0 sets',
        subMuscles: row.subMuscles.map((subMuscle) => ({
          ...subMuscle,
          setCountLabel: '0 sets',
        })),
      }
    }

    return {
      ...row,
      setCountLabel: formatSetCountLabel(totals.totalSets),
      subMuscles: row.subMuscles.map((subMuscle) => ({
        ...subMuscle,
        setCountLabel: formatSetCountLabel(
          subMuscle.id === 'quads'
            ? totals.quadsSets
            : subMuscle.id === 'hamstrings'
              ? totals.hamstringsSets
              : totals.calvesSets
        ),
      })),
    }
  })
}

function buildAnalyticsMuscleTotals(sessions) {
  const totals = {
    quads: 0,
    hamstrings: 0,
    calves: 0,
    quadsSets: 0,
    hamstringsSets: 0,
    calvesSets: 0,
    totalSets: 0,
  }

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()
      const completedSets = (exercise.sets || []).filter((set) => set.isCompleted)
      const completedSetCount = completedSets.length
      const completedVolume = completedSets.reduce((sum, set) => {
        if (set.actualLoad == null || set.actualReps == null) {
          return sum
        }
        return sum + set.actualLoad * set.actualReps
      }, 0)

      if (name.includes('squat') && !name.includes('jump')) {
        totals.quads += completedVolume
        totals.quadsSets += completedSetCount
        totals.totalSets += completedSetCount
      }

      if ((name.includes('deadlift') && !name.includes('trap bar')) || /(^|[^a-z])rdl([^a-z]|$)/.test(name)) {
        totals.hamstrings += completedVolume
        totals.hamstringsSets += completedSetCount
        totals.totalSets += completedSetCount
      }

      if (name.includes('calf')) {
        totals.calves += completedVolume
        totals.calvesSets += completedSetCount
        totals.totalSets += completedSetCount
      }
    }
  }

  return totals
}

function getRecoveryPercentage(value, maxValue) {
  if (!maxValue) {
    return 100
  }

  return Math.max(0, 100 - Math.round((value / maxValue) * 100))
}

function formatPercentageLabel(value, isDefaultFull = false) {
  return `${isDefaultFull ? 100 : value}%`
}

function formatPercentageWidth(value, isDefaultFull = false) {
  return `${isDefaultFull ? 100 : value}%`
}

function formatSetCountLabel(value) {
  return `${value} sets`
}

function getBestExercisePerformance(sessions, exerciseNamePart) {
  const normalized = exerciseNamePart.toLowerCase()
  let bestSet = null

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()
      if (!name.includes(normalized)) continue

      for (const set of exercise.sets || []) {
        if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue
        const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
        if (!bestSet || estimate > estimateOneRepMax(bestSet.actualLoad, bestSet.actualReps)) {
          bestSet = {
            actualLoad: set.actualLoad,
            actualReps: set.actualReps,
            estimate,
          }
        }
      }
    }
  }

  return bestSet
}

function estimateOneRepMax(load, reps) {
  return Math.round(load * (1 + reps / 30))
}

function getSessionLoadVolume(session) {
  return (session.exercises || []).reduce((sessionSum, exercise) => {
    return sessionSum + (exercise.sets || []).reduce((setSum, set) => {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) return setSum
      return setSum + set.actualLoad * set.actualReps
    }, 0)
  }, 0)
}

function getReadinessLabel(totalLoadScore) {
  if (totalLoadScore >= 70) return 'Moderate'
  return 'Low'
}

function getReadinessInterpretation({ completedSessions, totalLoadScore, readiness, fatigueRows }) {
  if (completedSessions.length === 0) {
    return {
      title: 'Readiness interpretation',
      body: 'No completed sessions are feeding readiness yet, so this is still a placeholder signal.',
      rows: [
        {
          title: 'Recent load',
          body: 'No completed load yet. Finish a session to start building the readiness score.',
        },
        {
          title: 'Lower-body fatigue',
          body: 'No completed lower-body work yet, so fatigue is still effectively clear.',
        },
        {
          title: 'Coach read',
          body: 'Finish a session to turn readiness into a real signal instead of a default low state.',
        },
      ],
    }
  }

  const topFatigueRows = fatigueRows
    .slice()
    .sort((left, right) => getFatigueSeverity(right.body) - getFatigueSeverity(left.body))
    .slice(0, 2)
    .map((row) => `${row.title}: ${row.body.toLowerCase()}`)
    .join(' · ')

  return {
    title: 'Readiness interpretation',
    body: `${completedSessions.length} completed sessions are driving a ${readiness.toLowerCase()} readiness signal right now.`,
    rows: [
      {
        title: 'Recent load',
        body: `Weekly load score is ${totalLoadScore}, built only from completed actual work.`,
      },
      {
        title: 'Lower-body fatigue',
        body: topFatigueRows || 'No meaningful lower-body fatigue signal yet.',
      },
      {
        title: 'Coach read',
        body: readiness === 'Low'
          ? 'Recovery still looks open. The athlete can push quality work without much fatigue carryover yet.'
          : 'The athlete can still push quality work, but recovery is no longer wide open after the recent completed load.',
      },
    ],
  }
}

function buildFatigueRows(sessions) {
  const totals = {
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
  }

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const volume = (exercise.sets || []).reduce((sum, set) => {
        if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) return sum
        return sum + set.actualLoad * set.actualReps
      }, 0)
      const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()

      if (name.includes('squat')) {
        totals.Quads += volume
        totals.Glutes += Math.round(volume * 0.6)
      }

      if (name.includes('deadlift') || name.includes('rdl')) {
        totals.Hamstrings += volume
        totals.Glutes += Math.round(volume * 0.5)
      }
    }
  }

  return Object.entries(totals).map(([title, volume]) => ({
    title,
    body: getFatigueLabel(volume),
  }))
}

function buildRecentMomentumRows(sessions) {
  if (sessions.length === 0) {
    return [
      {
        title: 'No completed work yet',
        body: 'Finish a workout to start building recent momentum from actual completed sessions.',
      },
    ]
  }

  const sortedSessions = [...sessions]
    .sort((left, right) => new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime())
    .slice(0, 3)

  return sortedSessions.map((session, index) => {
      const bestSet = getSessionBestSet(session)
      const bestSetCopy = bestSet
        ? `${estimateOneRepMax(bestSet.actualLoad, bestSet.actualReps)} lb est. 1RM from ${bestSet.exerciseName} (${bestSet.actualLoad} x ${bestSet.actualReps})`
        : 'Completed session logged with no usable strength set yet.'
      const trendCopy = getMomentumTrendCopy({
        currentBestSet: bestSet,
        previousBestSet: index < sortedSessions.length - 1 ? getSessionBestSet(sortedSessions[index + 1]) : null,
      })

      return {
        title: `${formatSessionDate(session.completedAt)} • ${session.nameSnapshot || session.workoutName || 'Completed session'}`,
        body: `${session.completedSetsCount} of ${session.totalSetsCount} sets completed. ${bestSetCopy} ${trendCopy}`.trim(),
      }
    })
}

function getMomentumTrendCopy({ currentBestSet, previousBestSet }) {
  if (!currentBestSet || !previousBestSet) {
    return 'First completed session in this sample.'
  }

  const currentEstimate = estimateOneRepMax(currentBestSet.actualLoad, currentBestSet.actualReps)
  const previousEstimate = estimateOneRepMax(previousBestSet.actualLoad, previousBestSet.actualReps)
  const delta = currentEstimate - previousEstimate

  if (delta > 0) {
    return `Trending up. +${delta} lb vs last completed session.`
  }

  if (delta < 0) {
    return `Trending down. ${delta} lb vs last completed session.`
  }

  return 'Holding steady. Flat vs last completed session.'
}

function buildExerciseBreakdownRows(sessions) {
  return [
    buildExerciseBreakdownRow({
      title: 'Squat pattern',
      sessions,
      exerciseNamePart: 'Back Squat',
      emptyCopy: 'Complete squat sessions to unlock this breakdown.',
    }),
    buildExerciseBreakdownRow({
      title: 'Hinge pattern',
      sessions,
      exerciseNamePart: 'Romanian Deadlift',
      emptyCopy: 'Complete hinge sessions to unlock this breakdown.',
    }),
  ]
}

function buildExerciseBreakdownRow({ title, sessions, exerciseNamePart, emptyCopy }) {
  const bestSet = getBestExercisePerformance(sessions, exerciseNamePart)
  if (!bestSet) {
    return {
      title,
      body: emptyCopy,
    }
  }

  const recentPerformances = getRecentExercisePerformances(sessions, exerciseNamePart)
  const current = recentPerformances[0] || null
  const previous = recentPerformances[1] || null
  const trendCopy = getMomentumTrendCopy({
    currentBestSet: current,
    previousBestSet: previous,
  })

  return {
    title,
    body: `${bestSet.estimate} lb best estimate from ${bestSet.actualLoad} x ${bestSet.actualReps}. ${trendCopy}`,
  }
}

function getRecentExercisePerformances(sessions, exerciseNamePart) {
  const normalized = exerciseNamePart.toLowerCase()

  return [...sessions]
    .sort((left, right) => new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime())
    .map((session) => getSessionBestSetByExerciseNamePart(session, normalized))
    .filter(Boolean)
    .slice(0, 2)
}

function getSessionBestSetByExerciseNamePart(session, exerciseNamePart) {
  let bestSet = null

  for (const exercise of session.exercises || []) {
    const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()
    if (!name.includes(exerciseNamePart)) continue

    for (const set of exercise.sets || []) {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue

      const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
      if (!bestSet || estimate > bestSet.estimate) {
        bestSet = {
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          estimate,
        }
      }
    }
  }

  return bestSet
}

function getSessionBestSet(session) {
  let bestSet = null

  for (const exercise of session.exercises || []) {
    for (const set of exercise.sets || []) {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue

      const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
      if (!bestSet || estimate > bestSet.estimate) {
        bestSet = {
          exerciseName: exercise.nameSnapshot || exercise.name || 'Exercise',
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          estimate,
        }
      }
    }
  }

  return bestSet
}

function formatSessionDate(value) {
  if (!value) return 'Recent session'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent session'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Toronto',
  })
}

function getFatigueSeverity(label) {
  if (label === 'High fatigue') return 3
  if (label === 'Moderate fatigue') return 2
  return 1
}

function getFatigueLabel(volume) {
  if (volume >= 3000) return 'High fatigue'
  if (volume >= 1200) return 'Moderate fatigue'
  return 'Low fatigue'
}
