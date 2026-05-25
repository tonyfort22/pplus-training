const EXERCISE_SELECT = [
  'id',
  'name',
  'default_equipment',
  'video_url',
  'thumbnail_url',
  'difficulty',
  'movement_pattern',
  'stimulus_type',
  'body_region',
  'created_at',
  'exercise_muscle_maps(role,sort_order,muscles(name))',
].join(',')

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function getRepositoryConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    restUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1/exercises`,
    serviceRoleKey,
  }
}

async function requestExercises(query = '') {
  const { restUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${restUrl}${query}`, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`Exercises request failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

function compareMuscleMaps(left, right) {
  const leftRoleRank = left?.role === 'primary' ? 0 : left?.role === 'secondary' ? 1 : 2
  const rightRoleRank = right?.role === 'primary' ? 0 : right?.role === 'secondary' ? 1 : 2

  if (leftRoleRank !== rightRoleRank) {
    return leftRoleRank - rightRoleRank
  }

  return (left?.sort_order ?? Number.MAX_SAFE_INTEGER) - (right?.sort_order ?? Number.MAX_SAFE_INTEGER)
}

function getPrimaryMuscleName(row) {
  const maps = Array.isArray(row?.exercise_muscle_maps) ? [...row.exercise_muscle_maps] : []
  if (!maps.length) return '-'

  maps.sort(compareMuscleMaps)
  return maps[0]?.muscles?.name ?? '-'
}

function formatOriginalExerciseRow(row) {
  return {
    id: row.id,
    name: row.name ?? 'Unnamed exercise',
    muscle: getPrimaryMuscleName(row),
    equipment: row.default_equipment ?? '-',
    sets: '-',
    reps: '-',
    duration: '-',
    distance: '-',
    rest: '-',
    createdAt: row.created_at ?? null,
    bodyRegion: row.body_region ?? null,
    movementPattern: row.movement_pattern ?? null,
    stimulusType: row.stimulus_type ?? null,
    difficulty: row.difficulty ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    videoUrl: row.video_url ?? null,
  }
}

export function createAdminExerciseRepository() {
  return {
    async listExercises() {
      const rows = await requestExercises(`?select=${encodeURIComponent(EXERCISE_SELECT)}&order=name.asc`)
      return Array.isArray(rows) ? rows.map(formatOriginalExerciseRow) : []
    },
  }
}
