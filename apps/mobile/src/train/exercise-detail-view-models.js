import {
  resolveMetricProfileIdFromExercise,
} from './exercise-metric-profile-resolution.js'

const DEFAULT_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'

const EXERCISE_LIBRARY = {
  'exercise-squat': {
    id: 'exercise-squat',
    title: 'Barbell Back Squat',
    videoUrl: DEFAULT_VIDEO_URL,
  },
  'exercise-rdl': {
    id: 'exercise-rdl',
    title: 'Barbell Romanian Deadlift',
    videoUrl: DEFAULT_VIDEO_URL,
  },
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function createFallbackExerciseDetail(exercise) {
  return {
    id: exercise?.exerciseId || exercise?.id || 'exercise-generic',
    title: exercise?.title || exercise?.name || exercise?.nameSnapshot || 'Exercise detail',
    videoUrl: exercise?.videoUrl || DEFAULT_VIDEO_URL,
    metricProfileId: 'strength_1rm',
    progressPoints: [],
    historyHeaders: ['DATE', 'WEIGHT (LB)', 'REPS', 'EST 1RM (LB)'],
    historyRows: [],
  }
}

function formatDateLabel(timestamp) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Unknown date'
  return DATE_FORMATTER.format(new Date(timestamp))
}

function normalizeExerciseName(value) {
  return String(value || '').trim().toLowerCase()
}

function estimateOneRepMax(load, reps) {
  return Math.round(Number(load) * (1 + Number(reps) / 30))
}

function formatNumber(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--'
}

function formatDistanceLabel(distance, unit = null) {
  if (!Number.isFinite(Number(distance)) || Number(distance) <= 0) return '--'
  const roundedDistance = Number.isInteger(Number(distance)) ? String(Number(distance)) : formatNumber(distance)
  return unit ? `${roundedDistance} ${unit}` : roundedDistance
}

function formatDurationLabel(durationSeconds) {
  if (!Number.isFinite(Number(durationSeconds)) || Number(durationSeconds) <= 0) return '--'
  return `${formatNumber(durationSeconds)} s`
}

function formatPaceLabel(durationSeconds, distance, distanceUnit = null) {
  if (!Number.isFinite(Number(durationSeconds)) || !Number.isFinite(Number(distance)) || Number(durationSeconds) <= 0 || Number(distance) <= 0) {
    return '--'
  }

  const normalizedDistance = normalizeDistanceToMeters(distance, distanceUnit)
  if (!Number.isFinite(normalizedDistance) || normalizedDistance <= 0) {
    return '--'
  }

  const secondsPerHundredMeters = Number(durationSeconds) / (normalizedDistance / 100)
  return `${formatNumber(secondsPerHundredMeters)} s / 100m`
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

function getPaceBestValue(durationSeconds, distance, distanceUnit = null) {
  if (!Number.isFinite(Number(durationSeconds)) || Number(durationSeconds) <= 0) return null
  const normalizedDistance = normalizeDistanceToMeters(distance, distanceUnit)
  if (!Number.isFinite(normalizedDistance) || normalizedDistance <= 0) return null
  return -(Number(durationSeconds) / normalizedDistance)
}

function isMatchingExercise(sessionExercise, selectedExercise) {
  const selectedExerciseId = String(selectedExercise?.exerciseId || selectedExercise?.id || '').trim()
  const sessionExerciseId = String(sessionExercise?.exerciseId || sessionExercise?.id || '').trim()
  if (selectedExerciseId && sessionExerciseId && selectedExerciseId === sessionExerciseId) {
    return true
  }

  const selectedName = normalizeExerciseName(selectedExercise?.title || selectedExercise?.name || selectedExercise?.nameSnapshot)
  const sessionName = normalizeExerciseName(sessionExercise?.nameSnapshot || sessionExercise?.name || sessionExercise?.title)
  return Boolean(selectedName && sessionName && selectedName === sessionName)
}

function collectExerciseObservations(exercise, sessions = []) {
  const observations = []

  for (const session of sessions) {
    if (!session || session.status !== 'completed') continue
    const sessionTimestamp = new Date(session.completedAt || session.startedAt || 0).getTime()

    for (const sessionExercise of session.exercises || []) {
      if (!isMatchingExercise(sessionExercise, exercise)) continue

      for (const set of sessionExercise.sets || []) {
        if (!set?.isCompleted) continue

        const load = Number(set.actualLoad ?? set.prescribedLoad)
        const reps = Number(set.actualReps ?? set.prescribedReps)
        const durationSeconds = Number(set.actualDurationSeconds ?? set.prescribedDurationSeconds)
        const distance = Number(set.actualDistance ?? set.prescribedDistance)

        observations.push({
          id: `${session.id || session.completedAt || 'session'}:${sessionExercise.id || sessionExercise.exerciseId || 'exercise'}:${set.id || observations.length}`,
          timestamp: sessionTimestamp,
          dateLabel: formatDateLabel(sessionTimestamp),
          load: Number.isFinite(load) ? load : null,
          loadUnit: set.actualLoadUnit ?? set.prescribedLoadUnit ?? null,
          reps: Number.isFinite(reps) ? reps : null,
          durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
          distance: Number.isFinite(distance) ? distance : null,
          distanceUnit: set.actualDistanceUnit ?? set.prescribedDistanceUnit ?? null,
        })
      }
    }
  }

  return observations.sort((left, right) => right.timestamp - left.timestamp || left.id.localeCompare(right.id))
}

function buildProgressPoints(rows = []) {
  if (!rows.length) return []

  const bestRowByDateLabel = new Map()
  for (const row of rows) {
    const rowBestValue = row.bestValue ?? row.progressValue
    const existingRow = bestRowByDateLabel.get(row.dateLabel)
    if (!existingRow) {
      bestRowByDateLabel.set(row.dateLabel, row)
      continue
    }

    const existingBestValue = existingRow.bestValue ?? existingRow.progressValue
    if (rowBestValue > existingBestValue) {
      bestRowByDateLabel.set(row.dateLabel, row)
    }
  }

  const ascendingRows = [...bestRowByDateLabel.values()].sort((left, right) => left.timestamp - right.timestamp || (left.bestValue ?? left.progressValue) - (right.bestValue ?? right.progressValue) || left.id.localeCompare(right.id))
  const progressPoints = []
  let runningBest = -Infinity

  for (const row of ascendingRows) {
    const rowBestValue = row.bestValue ?? row.progressValue
    if (rowBestValue <= runningBest) continue
    runningBest = rowBestValue
    progressPoints.push({
      id: `progress:${row.id}`,
      dateLabel: row.dateLabel,
      value: row.progressValue,
      displayValue: row.progressDisplayValue,
    })
  }

  return progressPoints
}

function buildStrengthProfile(observations = []) {
  const rows = observations
    .filter((row) => Number.isFinite(row.load) && row.load > 0 && Number.isFinite(row.reps) && row.reps > 0)
    .map((row) => {
      const estimated1Rm = estimateOneRepMax(row.load, row.reps)
      return {
        id: row.id,
        timestamp: row.timestamp,
        dateLabel: row.dateLabel,
        progressValue: estimated1Rm,
        progressDisplayValue: String(estimated1Rm),
        bestValue: estimated1Rm,
        cells: [row.dateLabel, formatNumber(row.load), String(row.reps), formatNumber(estimated1Rm)],
      }
    })

  return {
    metricProfileId: 'strength_1rm',
    progressYAxisLabel: 'ESTIMATED 1RM (LB)',
    progressXAxisLabel: 'DATE',
    progressPoints: buildProgressPoints(rows, { direction: 'higher' }),
    historyHeaders: ['DATE', 'WEIGHT (LB)', 'REPS', 'EST 1RM (LB)'],
    historyRows: rows.sort((left, right) => right.timestamp - left.timestamp || right.bestValue - left.bestValue || left.id.localeCompare(right.id)),
  }
}

function buildSpeedProfile(observations = []) {
  const rows = observations
    .filter((row) => Number.isFinite(row.distance) && row.distance > 0 && Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
    .map((row) => {
      const bestValue = getPaceBestValue(row.durationSeconds, row.distance, row.distanceUnit)
      return {
        id: row.id,
        timestamp: row.timestamp,
        dateLabel: row.dateLabel,
        progressValue: row.durationSeconds,
        progressDisplayValue: formatDurationLabel(row.durationSeconds),
        bestValue,
        cells: [
          row.dateLabel,
          formatDistanceLabel(row.distance, row.distanceUnit),
          formatDurationLabel(row.durationSeconds),
          formatPaceLabel(row.durationSeconds, row.distance, row.distanceUnit),
        ],
      }
    })
    .filter((row) => row.bestValue != null)

  return {
    metricProfileId: 'speed_time',
    progressYAxisLabel: 'TIME (SEC)',
    progressXAxisLabel: 'DATE',
    progressPoints: buildProgressPoints(rows, { direction: 'lower' }),
    historyHeaders: ['DATE', 'DISTANCE', 'TIME', 'PACE'],
    historyRows: rows.sort((left, right) => right.timestamp - left.timestamp || right.bestValue - left.bestValue || left.id.localeCompare(right.id)),
  }
}

function buildDistanceLoadProfile(observations = []) {
  const rows = observations
    .filter((row) => Number.isFinite(row.distance) && row.distance > 0 && Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
    .filter((row) => Number.isFinite(row.load) && row.load > 0)
    .map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      dateLabel: row.dateLabel,
      progressValue: row.durationSeconds,
      progressDisplayValue: formatDurationLabel(row.durationSeconds),
      bestValue: -row.durationSeconds,
      cells: [
        row.dateLabel,
        row.loadUnit ? `${formatNumber(row.load)} ${row.loadUnit}` : formatNumber(row.load),
        formatDistanceLabel(row.distance, row.distanceUnit),
        formatDurationLabel(row.durationSeconds),
      ],
    }))

  return {
    metricProfileId: 'distance_load',
    progressYAxisLabel: 'TIME (SEC)',
    progressXAxisLabel: 'DATE',
    progressPoints: buildProgressPoints(rows, { direction: 'lower' }),
    historyHeaders: ['DATE', 'LOAD', 'DISTANCE', 'TIME'],
    historyRows: rows.sort((left, right) => right.timestamp - left.timestamp || right.bestValue - left.bestValue || left.id.localeCompare(right.id)),
  }
}

function buildBodyweightRepsProfile(observations = []) {
  const rows = observations
    .filter((row) => Number.isFinite(row.reps) && row.reps > 0)
    .filter((row) => !Number.isFinite(row.load) || row.load <= 0)
    .map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      dateLabel: row.dateLabel,
      progressValue: row.reps,
      progressDisplayValue: `${row.reps} reps`,
      bestValue: row.reps,
      cells: [
        row.dateLabel,
        String(row.reps),
        formatDurationLabel(row.durationSeconds),
        Number.isFinite(row.durationSeconds) && row.durationSeconds > 0
          ? `${row.reps} reps in ${formatDurationLabel(row.durationSeconds)}`
          : `${row.reps} reps`,
      ],
    }))

  return {
    metricProfileId: 'bodyweight_reps',
    progressYAxisLabel: 'REPS',
    progressXAxisLabel: 'DATE',
    progressPoints: buildProgressPoints(rows, { direction: 'higher' }),
    historyHeaders: ['DATE', 'REPS', 'DURATION', 'RESULT'],
    historyRows: rows.sort((left, right) => right.timestamp - left.timestamp || right.progressValue - left.progressValue || left.id.localeCompare(right.id)),
  }
}

function buildDurationHoldProfile(observations = []) {
  const rows = observations
    .filter((row) => Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
    .map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      dateLabel: row.dateLabel,
      progressValue: row.durationSeconds,
      progressDisplayValue: formatDurationLabel(row.durationSeconds),
      bestValue: row.durationSeconds,
      cells: [row.dateLabel, formatDurationLabel(row.durationSeconds), `${formatDurationLabel(row.durationSeconds)} hold`],
    }))

  return {
    metricProfileId: 'duration_hold',
    progressYAxisLabel: 'DURATION (SEC)',
    progressXAxisLabel: 'DATE',
    progressPoints: buildProgressPoints(rows, { direction: 'higher' }),
    historyHeaders: ['DATE', 'DURATION', 'RESULT'],
    historyRows: rows.sort((left, right) => right.timestamp - left.timestamp || right.progressValue - left.progressValue || left.id.localeCompare(right.id)),
  }
}

function buildMetricProfileFromId(metricProfileId, observations = []) {
  if (metricProfileId === 'speed_time') return buildSpeedProfile(observations)
  if (metricProfileId === 'distance_load') return buildDistanceLoadProfile(observations)
  if (metricProfileId === 'bodyweight_reps') return buildBodyweightRepsProfile(observations)
  if (metricProfileId === 'duration_hold') return buildDurationHoldProfile(observations)
  return buildStrengthProfile(observations)
}

function buildMetricProfile(exercise, observations = []) {
  const metricProfileId = resolveMetricProfileIdFromExercise(exercise)
  if (metricProfileId) {
    return buildMetricProfileFromId(metricProfileId, observations)
  }

  const hasStrengthRows = observations.some((row) => Number.isFinite(row.load) && row.load > 0 && Number.isFinite(row.reps) && row.reps > 0)
  if (hasStrengthRows) return buildStrengthProfile(observations)

  const hasDistanceLoadRows = observations.some((row) => Number.isFinite(row.load) && row.load > 0 && Number.isFinite(row.distance) && row.distance > 0 && Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
  if (hasDistanceLoadRows) return buildDistanceLoadProfile(observations)

  const hasSpeedRows = observations.some((row) => Number.isFinite(row.distance) && row.distance > 0 && Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
  if (hasSpeedRows) return buildSpeedProfile(observations)

  const hasBodyweightRows = observations.some((row) => Number.isFinite(row.reps) && row.reps > 0)
  if (hasBodyweightRows) return buildBodyweightRepsProfile(observations)

  const hasDurationRows = observations.some((row) => Number.isFinite(row.durationSeconds) && row.durationSeconds > 0)
  if (hasDurationRows) return buildDurationHoldProfile(observations)

  return buildStrengthProfile(observations)
}

function getExerciseDetailRecord(exercise, sessions = []) {
  if (!exercise) return null

  const libraryDetail = EXERCISE_LIBRARY[exercise.exerciseId]
  const observations = collectExerciseObservations(exercise, sessions)
  const metricProfile = buildMetricProfile(exercise, observations)

  if (libraryDetail) {
    return {
      ...libraryDetail,
      videoUrl: exercise?.videoUrl || libraryDetail.videoUrl || DEFAULT_VIDEO_URL,
      ...metricProfile,
    }
  }

  return {
    ...createFallbackExerciseDetail(exercise),
    ...metricProfile,
  }
}

export function getExerciseDetailViewModel({ exercise, sessions = [] }) {
  const detail = getExerciseDetailRecord(exercise, sessions)
  if (!detail) return null

  return {
    id: detail.id,
    title: detail.title,
    videoUrl: detail.videoUrl,
    metricProfileId: detail.metricProfileId,
    progressTitle: 'Progress',
    progressYAxisLabel: detail.progressYAxisLabel,
    progressXAxisLabel: detail.progressXAxisLabel,
    progressPoints: detail.progressPoints,
    historyTitle: 'History',
    historyMode: exercise?.entryContext?.historyMode || 'recent',
    historyModes: [
      { id: 'recent', label: 'Recent' },
      { id: 'best', label: 'Best' },
    ],
    historyHeaders: detail.historyHeaders,
    historyRows: detail.historyRows,
    entryContext: exercise?.entryContext || null,
    prCallout: exercise?.entryContext?.type === 'completed-session-pr' ? {
      title: 'New PR',
      body: `This exercise was opened from a new PR. Previous best: ${exercise.entryContext.previousBestLabel}.`,
    } : null,
  }
}
