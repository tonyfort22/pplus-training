export function normalizeClassificationValue(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

const EXPLICIT_METRIC_PROFILE_IDS = new Set([
  'strength_1rm',
  'speed_time',
  'distance_load',
  'bodyweight_reps',
  'duration_hold',
])

const STIMULUS_TYPE_TO_METRIC_PROFILE_ID = {
  strength: 'strength_1rm',
  hypertrophy: 'strength_1rm',
  power: 'strength_1rm',
  load: 'strength_1rm',
  speed: 'speed_time',
  run: 'speed_time',
  sprint: 'speed_time',
  distance_load: 'distance_load',
  loaded_carry: 'distance_load',
  sled: 'distance_load',
  bodyweight: 'bodyweight_reps',
  control: 'bodyweight_reps',
  core_control: 'bodyweight_reps',
  isometric: 'duration_hold',
  hold: 'duration_hold',
}

const MOVEMENT_PATTERN_TO_METRIC_PROFILE_ID = {
  run: 'speed_time',
  sprint: 'speed_time',
  carry: 'distance_load',
}

function resolveMetricProfileIdFromExerciseName(exercise = {}) {
  const normalizedExerciseName = normalizeClassificationValue(exercise?.name || exercise?.title || exercise?.nameSnapshot)
  if (!normalizedExerciseName) return null
  const obviousDistanceLoadCues = [
    'carry',
    'farmer',
    'drag',
    'prowler',
    'sled_push',
    'sled_pull',
    'walking_lunge',
    'hurdle_walk',
    'linear_march',
    'straight_leg_march',
    'wall_march',
    'skater_walk',
  ]
  if (obviousDistanceLoadCues.some((cue) => normalizedExerciseName.includes(cue))) {
    return 'distance_load'
  }
  const obviousBodyweightCues = [
    'push_up',
    'chin_up',
    'pull_up',
    'bear_crawl',
    'mountain_climber',
    'body_saw',
    'dead_bug',
    'knee_drive',
  ]
  if (obviousBodyweightCues.some((cue) => normalizedExerciseName.includes(cue))) {
    return 'bodyweight_reps'
  }
  const obviousHoldCues = [
    'side_plank',
    'wall_sit',
  ]
  if (normalizedExerciseName === 'plank' || normalizedExerciseName.endsWith('_hold') || normalizedExerciseName.includes('_hold_') || obviousHoldCues.some((cue) => normalizedExerciseName.includes(cue))) {
    return 'duration_hold'
  }
  if (normalizedExerciseName.includes('sprint')) return 'speed_time'
  if (normalizedExerciseName === 'tempo_run' || normalizedExerciseName.endsWith('_run') || normalizedExerciseName.startsWith('run_') || normalizedExerciseName.includes('_run_')) {
    return 'speed_time'
  }

  const obviousStrengthCues = [
    'squat',
    'deadlift',
    'bench_press',
    'shoulder_press',
    'overhead_press',
    'rdl',
    'row',
  ]
  if (obviousStrengthCues.some((cue) => normalizedExerciseName.includes(cue))) {
    return 'strength_1rm'
  }
  return null
}

export function resolveMetricProfileIdFromClassification({ stimulusType, movementPattern } = {}) {
  const normalizedStimulusType = normalizeClassificationValue(stimulusType)
  if (normalizedStimulusType && STIMULUS_TYPE_TO_METRIC_PROFILE_ID[normalizedStimulusType]) {
    return STIMULUS_TYPE_TO_METRIC_PROFILE_ID[normalizedStimulusType]
  }

  const normalizedMovementPattern = normalizeClassificationValue(movementPattern)
  if (normalizedMovementPattern && MOVEMENT_PATTERN_TO_METRIC_PROFILE_ID[normalizedMovementPattern]) {
    return MOVEMENT_PATTERN_TO_METRIC_PROFILE_ID[normalizedMovementPattern]
  }

  return null
}

export function resolveMetricProfileIdFromExercise(exercise = {}) {
  const explicitMetricProfileId = normalizeClassificationValue(exercise?.metricProfileId)
  if (EXPLICIT_METRIC_PROFILE_IDS.has(explicitMetricProfileId)) {
    return explicitMetricProfileId
  }

  return resolveMetricProfileIdFromClassification(exercise)
    || resolveMetricProfileIdFromExerciseName(exercise)
}
