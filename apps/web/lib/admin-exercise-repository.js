import { createSupabaseRestIdentityRepository } from '../../../packages/data/src/identity/index.js'

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function requireFetch(fetchImpl, message) {
  if (typeof fetchImpl !== 'function') {
    throw createRepositoryError(message, 500)
  }
  return fetchImpl
}

function getRepositoryConfig(overrides = {}) {
  const supabaseUrl = overrides.supabaseUrl ?? process.env.SUPABASE_URL
  const serviceRoleKey = overrides.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  const fetchImpl = requireFetch(overrides.fetchImpl ?? globalThis.fetch, 'Fetch support is required for admin exercise persistence.')

  if (!supabaseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
    fetchImpl,
  }
}

function createRepositoryClient(overrides = {}) {
  const config = getRepositoryConfig(overrides)

  async function requestJson(url, options = {}, errorLabel = 'Supabase request') {
    const response = await config.fetchImpl(url, {
      cache: 'no-store',
      ...options,
    })

    const text = await response.text()
    let parsed = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
    }

    if (!response.ok) {
      const message = parsed?.message || parsed?.error || parsed?.msg || (typeof parsed === 'string' ? parsed : '') || response.statusText || `Unknown ${errorLabel} error`
      throw createRepositoryError(`${errorLabel} failed: ${response.status} ${message}`, response.status)
    }

    return parsed
  }

  function buildHeaders(extraHeaders = {}) {
    return {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extraHeaders,
    }
  }

  async function requestTable(table, query = '') {
    return requestJson(
      `${config.baseRestUrl}/${table}${query}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      },
      `${table} request`,
    )
  }

  async function insertTable(table, payload) {
    return requestJson(
      `${config.baseRestUrl}/${table}`,
      {
        method: 'POST',
        headers: buildHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(payload),
      },
      `${table} insert`,
    )
  }

  async function patchTable(table, query = '', payload = {}) {
    return requestJson(
      `${config.baseRestUrl}/${table}${query}`,
      {
        method: 'PATCH',
        headers: buildHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(payload),
      },
      `${table} patch`,
    )
  }

  async function deleteTable(table, query = '') {
    return requestJson(
      `${config.baseRestUrl}/${table}${query}`,
      {
        method: 'DELETE',
        headers: buildHeaders({ Prefer: 'return=minimal' }),
      },
      `${table} delete`,
    )
  }

  return {
    config,
    requestTable,
    insertTable,
    patchTable,
    deleteTable,
  }
}

const EXERCISE_LIST_SELECT = [
  'id',
  'name',
  'slug',
  'description',
  'difficulty',
  'movement_pattern',
  'stimulus_type',
  'default_equipment',
  'default_sets',
  'default_reps',
  'default_distance',
  'default_weight',
  'default_duration',
  'default_rest',
  'default_tempo',
  'status',
  'created_at',
  'exercise_muscle_maps(muscle_id,role,sort_order,muscles(id,name))',
].join(',')

const EXERCISE_DETAIL_SELECT = [
  'id',
  'name',
  'slug',
  'description',
  'difficulty',
  'movement_pattern',
  'stimulus_type',
  'default_equipment',
  'default_sets',
  'default_reps',
  'default_distance',
  'default_weight',
  'default_duration',
  'default_rest',
  'default_tempo',
  'status',
  'thumbnail_url',
  'video_url',
  'created_at',
  'exercise_muscle_maps(muscle_id,role,sort_order,muscles(id,name))',
].join(',')

function normalizeOptionalString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeRequiredString(value, fieldLabel) {
  const trimmed = normalizeOptionalString(value)
  if (!trimmed) {
    throw createRepositoryError(`${fieldLabel} is required.`, 400)
  }
  return trimmed
}

function normalizeExerciseFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function slugifyExerciseName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createIdValue() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeSelectedValues(values = []) {
  const seenValues = new Set()

  return (Array.isArray(values) ? values : [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .filter((value) => {
      const normalizedValue = normalizeExerciseFilterValue(value)
      if (!normalizedValue || seenValues.has(normalizedValue)) {
        return false
      }
      seenValues.add(normalizedValue)
      return true
    })
}

function parseDataUrlToUploadPayload(dataUrl, label = 'Exercise media upload') {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) {
    throw createRepositoryError(`${label} payload is invalid.`, 400)
  }

  return {
    contentType: match[1],
    fileBuffer: Uint8Array.from(Buffer.from(match[2], 'base64')),
  }
}

function normalizeUploadInput(upload) {
  if (!upload || typeof upload !== 'object') {
    return null
  }
  if (!upload.dataUrl) {
    return null
  }
  return {
    dataUrl: upload.dataUrl,
    contentType: normalizeOptionalString(upload.contentType),
    fileName: normalizeOptionalString(upload.fileName),
  }
}

function normalizeDirectExerciseVideoUrl(input = {}, supabaseBaseUrl = '') {
  const directVideoUrl = normalizeOptionalString(input?.video_url ?? input?.videoUrl)
  if (!directVideoUrl) return null

  let parsedUrl = null
  try {
    parsedUrl = new URL(directVideoUrl)
  } catch {
    throw createRepositoryError('Exercise video_url must be a direct Supabase mp4 URL.', 400)
  }

  const parsedBaseUrl = supabaseBaseUrl ? new URL(supabaseBaseUrl) : null
  const isSupabaseStorageUrl = parsedUrl.pathname.includes('/storage/v1/object/public/exercise-videos/')
  const isConfiguredSupabaseHost = parsedBaseUrl ? parsedUrl.host === parsedBaseUrl.host : false
  const isSupabaseProjectHost = parsedUrl.hostname.endsWith('.supabase.co')
  const isMp4Url = parsedUrl.pathname.toLowerCase().endsWith('.mp4')

  if (!isSupabaseStorageUrl || (!isConfiguredSupabaseHost && !isSupabaseProjectHost) || !isMp4Url) {
    throw createRepositoryError('Exercise video_url must be a direct Supabase mp4 URL.', 400)
  }

  return directVideoUrl
}

function compareMuscleMaps(left, right) {
  const leftRoleRank = left?.role === 'primary' ? 0 : left?.role === 'secondary' ? 1 : 2
  const rightRoleRank = right?.role === 'primary' ? 0 : right?.role === 'secondary' ? 1 : 2

  if (leftRoleRank !== rightRoleRank) {
    return leftRoleRank - rightRoleRank
  }

  return (left?.sort_order ?? Number.MAX_SAFE_INTEGER) - (right?.sort_order ?? Number.MAX_SAFE_INTEGER)
}

function getSortedMuscleMaps(row) {
  const maps = Array.isArray(row?.exercise_muscle_maps) ? [...row.exercise_muscle_maps] : []
  if (!maps.length) return []
  maps.sort(compareMuscleMaps)
  return maps
}

function getSortedMuscleNames(row) {
  return getSortedMuscleMaps(row)
    .map((map) => map?.muscles?.name ?? null)
    .filter(Boolean)
}

function getMovementTypeValues(row) {
  return [row?.movement_pattern, row?.stimulus_type]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
}

function formatExerciseRow(row, totalSetCount = 0) {
  const sortedMuscleMaps = getSortedMuscleMaps(row)
  const primaryMuscleMap = sortedMuscleMaps.find((map) => map?.role === 'primary') ?? null
  const secondaryMuscleIds = sortedMuscleMaps
    .filter((map) => map?.role === 'secondary')
    .map((map) => map?.muscle_id ?? null)
    .filter(Boolean)
  const muscleNames = getSortedMuscleNames(row)
  const movementTypeValues = getMovementTypeValues(row)
  const defaultEquipment = normalizeOptionalString(row?.default_equipment)
  const thumbnailUrl = normalizeOptionalString(row?.thumbnail_url)
  const videoUrl = normalizeOptionalString(row?.video_url)

  return {
    id: row.id,
    name: row.name ?? 'Unnamed exercise',
    description: normalizeOptionalString(row?.description) ?? '',
    difficulty: normalizeOptionalString(row?.difficulty) ?? '',
    category: normalizeOptionalString(row?.stimulus_type) ?? '',
    movementPattern: normalizeOptionalString(row?.movement_pattern) ?? '',
    thumbnailUrl,
    videoUrl,
    muscle: muscleNames[0] ?? '-',
    muscleNames,
    primaryMuscleId: primaryMuscleMap?.muscle_id ?? '',
    secondaryMuscleIds,
    equipment: defaultEquipment,
    equipmentNeeded: defaultEquipment ? [normalizeExerciseFilterValue(defaultEquipment)] : [],
    movementTypeValues,
    totalSetCount,
    sets: normalizeOptionalString(row?.default_sets) ?? (totalSetCount > 0 ? String(totalSetCount) : '-'),
    reps: normalizeOptionalString(row?.default_reps) ?? '-',
    duration: normalizeOptionalString(row?.default_duration) ?? '-',
    distance: normalizeOptionalString(row?.default_distance) ?? '-',
    weights: normalizeOptionalString(row?.default_weight) ?? '',
    rest: normalizeOptionalString(row?.default_rest) ?? '-',
    tempo: normalizeOptionalString(row?.default_tempo) ?? '',
    status: normalizeOptionalString(row?.status) ?? 'draft',
    createdAt: row.created_at ?? null,
  }
}

async function listExercisesWithSetCounts(client) {
  const [exerciseRows, workoutTemplateExerciseRows, workoutTemplateSetRows] = await Promise.all([
    client.requestTable('exercises', `?select=${encodeURIComponent(EXERCISE_LIST_SELECT)}&order=name.asc`),
    client.requestTable('workout_template_exercises', '?select=id,exercise_id&limit=5000'),
    client.requestTable('workout_template_sets', '?select=id,workout_template_exercise_id&limit=5000'),
  ])

  const setCountByTemplateExerciseId = new Map()
  for (const row of Array.isArray(workoutTemplateSetRows) ? workoutTemplateSetRows : []) {
    const currentCount = setCountByTemplateExerciseId.get(row.workout_template_exercise_id) ?? 0
    setCountByTemplateExerciseId.set(row.workout_template_exercise_id, currentCount + 1)
  }

  const totalSetCountByExerciseId = new Map()
  for (const row of Array.isArray(workoutTemplateExerciseRows) ? workoutTemplateExerciseRows : []) {
    if (!row?.exercise_id) continue

    const setCount = setCountByTemplateExerciseId.get(row.id) ?? 0
    const currentCount = totalSetCountByExerciseId.get(row.exercise_id) ?? 0
    totalSetCountByExerciseId.set(row.exercise_id, currentCount + setCount)
  }

  return Array.isArray(exerciseRows)
    ? exerciseRows.map((row) => formatExerciseRow(row, totalSetCountByExerciseId.get(row.id) ?? 0))
    : []
}

async function getExerciseDetail(client, exerciseId) {
  const normalizedExerciseId = normalizeRequiredString(exerciseId, 'Exercise ID')
  const rows = await client.requestTable(
    'exercises',
    `?select=${encodeURIComponent(EXERCISE_DETAIL_SELECT)}&id=eq.${encodeURIComponent(normalizedExerciseId)}&limit=1`,
  )
  const row = Array.isArray(rows) ? rows[0] : rows
  if (!row?.id) {
    throw createRepositoryError('Exercise not found.', 404)
  }
  return formatExerciseRow(row, 0)
}

async function listMuscles(client) {
  const muscleRows = await client.requestTable('muscles', '?select=id,name,sort_order,is_active&is_active=is.true&limit=500')

  return (Array.isArray(muscleRows) ? muscleRows : [])
    .filter((row) => row?.id && normalizeOptionalString(row?.name))
    .sort((left, right) => {
      const leftSortOrder = Number.isFinite(left?.sort_order) ? left.sort_order : Number.MAX_SAFE_INTEGER
      const rightSortOrder = Number.isFinite(right?.sort_order) ? right.sort_order : Number.MAX_SAFE_INTEGER
      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder
      }
      return String(left?.name || '').localeCompare(String(right?.name || ''))
    })
    .map((row) => ({
      value: row.id,
      label: normalizeRequiredString(row.name, 'Muscle name'),
    }))
}

function buildExerciseWritePayload(input = {}, { includeSlug = false } = {}) {
  const name = normalizeRequiredString(input?.name, 'Exercise name')
  const payload = {
    name,
    description: normalizeOptionalString(input?.description),
    difficulty: normalizeOptionalString(input?.difficulty),
    stimulus_type: normalizeOptionalString(input?.category),
    updated_at: new Date().toISOString(),
  }

  const equipmentValues = normalizeSelectedValues(input?.equipmentNeeded)
  payload.default_equipment = equipmentValues[0] ?? null
  payload.default_sets = normalizeOptionalString(input?.sets)
  payload.default_reps = normalizeOptionalString(input?.reps)
  payload.default_distance = normalizeOptionalString(input?.distance)
  payload.default_weight = normalizeOptionalString(input?.weights)
  payload.default_duration = normalizeOptionalString(input?.duration)
  payload.default_rest = normalizeOptionalString(input?.rest)
  payload.default_tempo = normalizeOptionalString(input?.tempo)
  payload.status = normalizeOptionalString(input?.status) ?? 'draft'

  if (includeSlug) {
    payload.slug = slugifyExerciseName(name) || `exercise-${Date.now()}`
  }

  return payload
}

function buildExerciseMuscleMapRows(exerciseId, input = {}) {
  const primaryMuscleId = normalizeOptionalString(input?.primaryMuscleId)
  const secondaryMuscleIds = normalizeSelectedValues(input?.secondaryMuscleIds).filter((muscleId) => muscleId !== primaryMuscleId)
  const rows = []

  if (primaryMuscleId) {
    rows.push({
      exercise_id: exerciseId,
      muscle_id: primaryMuscleId,
      role: 'primary',
      sort_order: 0,
    })
  }

  secondaryMuscleIds.forEach((muscleId, index) => {
    rows.push({
      exercise_id: exerciseId,
      muscle_id: muscleId,
      role: 'secondary',
      sort_order: index + 1,
    })
  })

  return rows
}

function mergeExerciseResponseWithInput(exerciseRow, input = {}) {
  const primaryMuscleId = normalizeOptionalString(input?.primaryMuscleId) ?? ''
  const secondaryMuscleIds = normalizeSelectedValues(input?.secondaryMuscleIds).filter((muscleId) => muscleId !== primaryMuscleId)

  return {
    ...exerciseRow,
    primaryMuscleId,
    secondaryMuscleIds,
  }
}

async function replaceExerciseMuscleMaps(client, exerciseId, input = {}) {
  await client.deleteTable('exercise_muscle_maps', `?exercise_id=eq.${encodeURIComponent(exerciseId)}`)
  const rows = buildExerciseMuscleMapRows(exerciseId, input)
  if (!rows.length) {
    return []
  }
  return client.insertTable('exercise_muscle_maps', rows)
}

export function createAdminExerciseRepository(overrides = {}) {
  const client = createRepositoryClient(overrides)
  const identityRepository = createSupabaseRestIdentityRepository({
    url: client.config.baseUrl,
    anonKey: client.config.serviceRoleKey,
    accessToken: client.config.serviceRoleKey,
    fetchImpl: client.config.fetchImpl,
  })

  async function uploadExerciseThumbnail({ exerciseId, thumbnailUpload }) {
    const normalizedUpload = normalizeUploadInput(thumbnailUpload)
    if (!normalizedUpload?.dataUrl) {
      return null
    }

    const { fileBuffer, contentType } = parseDataUrlToUploadPayload(normalizedUpload.dataUrl, 'Exercise thumbnail upload')
    const safeFileName = String(normalizedUpload.fileName || 'thumbnail.png').replace(/[^a-zA-Z0-9._-]/g, '-')
    const uploadedThumbnail = await identityRepository.uploadObject({
      bucket: 'exercise-media',
      objectPath: `${exerciseId}/${safeFileName}`,
      fileBuffer,
      contentType: normalizedUpload.contentType || contentType || 'image/png',
    })
    return uploadedThumbnail?.publicUrl || null
  }

  async function uploadExerciseVideo({ exerciseId, videoUpload }) {
    const normalizedUpload = normalizeUploadInput(videoUpload)
    if (!normalizedUpload?.dataUrl) {
      return null
    }

    const { fileBuffer, contentType } = parseDataUrlToUploadPayload(normalizedUpload.dataUrl, 'Exercise video upload')
    const safeFileName = String(normalizedUpload.fileName || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '-')
    const uploadedVideo = await identityRepository.uploadObject({
      bucket: 'exercise-videos',
      objectPath: `${exerciseId}/${safeFileName}`,
      fileBuffer,
      contentType: normalizedUpload.contentType || contentType || 'video/mp4',
    })
    return uploadedVideo?.publicUrl || null
  }

  return {
    async listExercises() {
      return listExercisesWithSetCounts(client)
    },

    async getExercise(exerciseId) {
      return getExerciseDetail(client, exerciseId)
    },

    async listMuscles() {
      return listMuscles(client)
    },

    async createExercise(input = {}) {
      const exerciseId = createIdValue()
      const payload = {
        id: exerciseId,
        ...buildExerciseWritePayload(input, { includeSlug: true }),
      }
      const uploadedThumbnailUrl = await uploadExerciseThumbnail({
        exerciseId,
        thumbnailUpload: input?.thumbnailUpload,
      })
      if (uploadedThumbnailUrl) {
        payload.thumbnail_url = uploadedThumbnailUrl
      }
      const uploadedVideoUrl = await uploadExerciseVideo({
        exerciseId,
        videoUpload: input?.videoUpload,
      })
      const directVideoUrl = normalizeDirectExerciseVideoUrl(input, client.config.baseUrl)
      const directThumbnailUrl = normalizeOptionalString(input?.thumbnailUrl)
      if (directThumbnailUrl) {
        payload.thumbnail_url = directThumbnailUrl
      }
      if (uploadedVideoUrl) {
        payload.video_url = uploadedVideoUrl
      }
      if (directVideoUrl) {
        payload.video_url = directVideoUrl
      }

      const insertedRows = await client.insertTable('exercises', payload)
      const insertedRow = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows

      if (!insertedRow?.id) {
        throw createRepositoryError('Exercise creation did not return a saved row.', 500)
      }

      const muscleRows = buildExerciseMuscleMapRows(insertedRow.id, input)
      if (muscleRows.length) {
        await client.insertTable('exercise_muscle_maps', muscleRows)
      }

      return mergeExerciseResponseWithInput(formatExerciseRow(insertedRow, 0), input)
    },

    async deleteExercise(exerciseId) {
      const normalizedExerciseId = normalizeRequiredString(exerciseId, 'Exercise ID')
      await client.deleteTable('exercises', `?id=eq.${encodeURIComponent(normalizedExerciseId)}`)
      return { exerciseId: normalizedExerciseId }
    },

    async updateExercise(exerciseId, input = {}) {
      const normalizedExerciseId = normalizeRequiredString(exerciseId, 'Exercise ID')
      const payload = buildExerciseWritePayload(input)
      const uploadedThumbnailUrl = await uploadExerciseThumbnail({
        exerciseId: normalizedExerciseId,
        thumbnailUpload: input?.thumbnailUpload,
      })
      if (uploadedThumbnailUrl) {
        payload.thumbnail_url = uploadedThumbnailUrl
      }
      const uploadedVideoUrl = await uploadExerciseVideo({
        exerciseId: normalizedExerciseId,
        videoUpload: input?.videoUpload,
      })
      const directVideoUrl = normalizeDirectExerciseVideoUrl(input, client.config.baseUrl)
      const directThumbnailUrl = normalizeOptionalString(input?.thumbnailUrl)
      if (directThumbnailUrl) {
        payload.thumbnail_url = directThumbnailUrl
      }
      if (uploadedVideoUrl) {
        payload.video_url = uploadedVideoUrl
      }
      if (directVideoUrl) {
        payload.video_url = directVideoUrl
      }

      const updatedRows = await client.patchTable('exercises', `?id=eq.${encodeURIComponent(normalizedExerciseId)}`, payload)
      const updatedRow = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows

      if (!updatedRow?.id) {
        throw createRepositoryError('Exercise update did not return a saved row.', 500)
      }

      await replaceExerciseMuscleMaps(client, normalizedExerciseId, input)

      return mergeExerciseResponseWithInput(formatExerciseRow(updatedRow, 0), input)
    },
  }
}
