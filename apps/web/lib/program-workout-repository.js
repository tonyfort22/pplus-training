function requireFetch(fetchImpl, message) {
  if (typeof fetchImpl !== 'function') {
    throw new Error(message)
  }
  return fetchImpl
}

function createRepositoryError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  error.cause = cause
  return error
}

function createSupabaseRequest(config = {}) {
  const baseUrl = config.supabaseUrl || process.env.SUPABASE_URL
  const serviceRoleKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  const fetchImpl = requireFetch(config.fetchImpl ?? globalThis.fetch, 'Program workout repository requires fetch support')

  if (!baseUrl || !serviceRoleKey) {
    throw createRepositoryError('Persistence unavailable until web Supabase env is configured.', 503)
  }

  return async function request({ method = 'GET', table, query = {}, body, prefer = 'return=representation' } = {}) {
    const url = new URL(`/rest/v1/${table}`, baseUrl)
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: prefer,
      },
      body: body == null ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })

    if (response.status === 204) {
      return null
    }

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null
    if (!response.ok) {
      const message = payload?.message || payload?.msg || payload?.error_description || payload?.error || text || response.statusText || 'Unknown program workout repository error'
      throw createRepositoryError(`${table} request failed (${response.status}): ${message}`, response.status)
    }

    return payload
  }
}

const PROGRAM_WORKOUT_SELECT = [
  'id',
  'athlete_id',
  'coach_id',
  'program_id',
  'program_day_id',
  'workout_template_id',
  'name_snapshot',
  'notes',
  'status',
  'sort_order',
  'scheduled_date',
  'scheduled_start_time',
  'scheduled_end_time',
  'created_at',
  'updated_at',
  'program_days(date,name)',
  'workout_templates(name,description,training_type,estimated_duration_minutes,thumbnail_url,status)',
].join(',')

const PROGRAM_WORKOUT_BLOCK_SELECT = [
  'id',
  'program_workout_id',
  'block_code',
  'title',
  'instructions',
  'sort_order',
  'created_at',
  'updated_at',
].join(',')

const PROGRAM_WORKOUT_EXERCISE_SELECT = [
  'id',
  'program_workout_id',
  'program_workout_block_id',
  'exercise_id',
  'name_snapshot',
  'sort_order',
  'notes',
  'default_rest_seconds',
  'created_at',
  'updated_at',
].join(',')

const PROGRAM_WORKOUT_SET_SELECT = [
  'id',
  'program_workout_exercise_id',
  'sort_order',
  'set_type',
  'target_reps',
  'target_load',
  'target_load_unit',
  'target_duration_seconds',
  'target_distance',
  'target_distance_unit',
  'target_rpe',
  'target_rir',
  'target_rest_seconds',
  'notes',
  'created_at',
  'updated_at',
].join(',')

const WORKOUT_TEMPLATE_SELECT = [
  'id',
  'coach_id',
  'name',
  'training_type',
  'bg_color',
  'text_color',
  'status',
].join(',')

const WORKOUT_TEMPLATE_BLOCK_SELECT = [
  'id',
  'workout_template_id',
  'block_code',
  'title',
  'instructions',
  'sort_order',
  'created_at',
  'updated_at',
].join(',')

const WORKOUT_TEMPLATE_EXERCISE_SELECT = [
  'id',
  'workout_template_id',
  'workout_template_block_id',
  'exercise_id',
  'name_snapshot',
  'sort_order',
  'notes',
  'default_rest_seconds',
].join(',')

const WORKOUT_TEMPLATE_SET_SELECT = [
  'id',
  'workout_template_exercise_id',
  'sort_order',
  'set_type',
  'target_reps',
  'target_load',
  'target_load_unit',
  'target_duration_seconds',
  'target_distance',
  'target_distance_unit',
  'target_rpe',
  'target_rir',
  'target_rest_seconds',
  'notes',
].join(',')

function normalizeId(value, label) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw createRepositoryError(`${label} is required.`, 400)
  }
  return normalized
}

function normalizeOptionalString(value) {
  if (value == null) return null
  const normalized = String(value)
  return normalized.trim() ? normalized : null
}

function parseIntegerLike(value) {
  if (value == null) return null
  const match = String(value).match(/-?\d+/)
  if (!match) return null
  const parsed = Number.parseInt(match[0], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNumericLike(value) {
  if (value == null) return null
  const match = String(value).match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number.parseFloat(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

function parseDurationSeconds(value) {
  const numericValue = parseNumericLike(value)
  if (numericValue == null) return null
  return Math.round(numericValue)
}

function parseDistanceValue(value) {
  return parseNumericLike(value)
}

function parseDistanceUnit(value) {
  if (value == null) return null
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes(' m')) return 'm'
  if (normalized.endsWith('m')) return 'm'
  if (normalized.includes(' km')) return 'km'
  if (normalized.endsWith('km')) return 'km'
  if (normalized.includes(' yd')) return 'yd'
  if (normalized.endsWith('yd')) return 'yd'
  return null
}

function parseEffortToRpe(value) {
  const numericValue = parseNumericLike(value)
  return numericValue == null ? null : numericValue
}

function normalizeScheduleInput(payload = {}, { requireComplete } = { requireComplete: false }) {
  const scheduledDate = payload.scheduled_date ?? payload.start_date ?? payload.startDate ?? null
  const scheduledStartTime = payload.scheduled_start_time ?? payload.start_time ?? payload.startTime ?? null
  const scheduledEndTime = payload.scheduled_end_time ?? payload.end_time ?? payload.endTime ?? null
  const endDate = payload.end_date ?? payload.endDate ?? scheduledDate ?? null

  if (requireComplete) {
    if (!scheduledDate) throw createRepositoryError('Start date is required.', 400)
    if (!scheduledStartTime) throw createRepositoryError('Start time is required.', 400)
    if (!scheduledEndTime) throw createRepositoryError('End time is required.', 400)
    if (!endDate) throw createRepositoryError('End date is required.', 400)
  }

  if (scheduledDate && endDate && scheduledDate !== endDate) {
    throw createRepositoryError('End date must equal start date for calendar program workouts v1.', 400)
  }

  return {
    scheduled_date: scheduledDate,
    scheduled_start_time: scheduledStartTime,
    scheduled_end_time: scheduledEndTime,
  }
}

function encodeInFilter(values = []) {
  const filtered = values.filter(Boolean)
  return filtered.length ? `(${filtered.map((value) => encodeURIComponent(value)).join(',')})` : null
}

function normalizeWorkoutTemplateStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['draft', 'active', 'archived'].includes(normalized) ? normalized : 'active'
}

function normalizeWorkoutTemplatePayload(payload = {}) {
  const name = normalizeOptionalString(payload.name)
  if (!name) throw createRepositoryError('Workout name is required.', 400)

  return {
    name,
    description: normalizeOptionalString(payload.description),
    training_type: normalizeOptionalString(payload.training_type ?? payload.trainingType ?? payload.focusArea),
    estimated_duration_minutes: parseIntegerLike(payload.estimated_duration_minutes ?? payload.estimatedDurationMinutes ?? payload.duration),
    status: normalizeWorkoutTemplateStatus(payload.status),
    updated_at: new Date().toISOString(),
  }
}

export function createProgramWorkoutRepository(config = {}) {
  const request = createSupabaseRequest(config)

  async function listWorkoutTemplates() {
    const rows = await request({
      table: 'workout_templates',
      query: {
        select: 'id,name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status',
        order: 'name.asc',
      },
    })

    const templates = Array.isArray(rows) ? rows : []
    const templateIds = templates.map((row) => row.id).filter(Boolean)
    const templateFilter = encodeInFilter(templateIds)

    if (!templateFilter) {
      return templates
    }

    const templateExercises = await request({
      table: 'workout_template_exercises',
      query: {
        select: 'id,workout_template_id',
        workout_template_id: `in.${templateFilter}`,
      },
    })
    const exercises = Array.isArray(templateExercises) ? templateExercises : []

    const exerciseIds = exercises.map((row) => row.id).filter(Boolean)
    const exerciseFilter = encodeInFilter(exerciseIds)
    const templateSets = exerciseFilter ? await request({
      table: 'workout_template_sets',
      query: {
        select: 'id,workout_template_exercise_id',
        workout_template_exercise_id: `in.${exerciseFilter}`,
      },
    }) : []
    const sets = Array.isArray(templateSets) ? templateSets : []

    const templateBlocks = await request({
      table: 'workout_template_blocks',
      query: {
        select: 'id,workout_template_id',
        workout_template_id: `in.${templateFilter}`,
      },
    })
    const blocks = Array.isArray(templateBlocks) ? templateBlocks : []

    const exerciseCountByTemplateId = new Map()
    const templateIdByExerciseId = new Map()
    for (const exercise of exercises) {
      const templateId = exercise.workout_template_id
      if (!templateId) continue
      templateIdByExerciseId.set(exercise.id, templateId)
      exerciseCountByTemplateId.set(templateId, (exerciseCountByTemplateId.get(templateId) ?? 0) + 1)
    }

    const setCountByTemplateId = new Map()
    for (const setRow of sets) {
      const templateId = templateIdByExerciseId.get(setRow.workout_template_exercise_id)
      if (!templateId) continue
      setCountByTemplateId.set(templateId, (setCountByTemplateId.get(templateId) ?? 0) + 1)
    }

    const blockCountByTemplateId = new Map()
    for (const block of blocks) {
      const templateId = block.workout_template_id
      if (!templateId) continue
      blockCountByTemplateId.set(templateId, (blockCountByTemplateId.get(templateId) ?? 0) + 1)
    }

    return templates.map((template) => {
      const exerciseCount = exerciseCountByTemplateId.get(template.id) ?? 0
      const blockCount = blockCountByTemplateId.get(template.id) ?? 0
      return {
        ...template,
        exercise_count: exerciseCount,
        set_count: setCountByTemplateId.get(template.id) ?? 0,
        section_count: blockCount > 0 ? blockCount : (exerciseCount > 0 ? 1 : 0),
      }
    })
  }

  async function resolveWorkoutTemplateCoachId() {
    const coachRows = await request({
      table: 'coach_profiles',
      query: {
        select: 'id',
        order: 'created_at.asc',
        limit: '1',
      },
    })
    const coachId = Array.isArray(coachRows) ? coachRows[0]?.id : coachRows?.id
    if (!coachId) throw createRepositoryError('No coach profile exists yet for workout template ownership.', 400)
    return coachId
  }

  async function getWorkoutTemplate(workoutTemplateId) {
    const normalizedWorkoutTemplateId = normalizeId(workoutTemplateId, 'Workout template ID')
    const rows = await request({
      table: 'workout_templates',
      query: {
        select: 'id,name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status',
        id: `eq.${normalizedWorkoutTemplateId}`,
        limit: '1',
      },
    })
    const template = Array.isArray(rows) ? rows[0] : rows
    if (!template?.id) throw createRepositoryError('Workout template not found.', 404)
    return template
  }

  async function createWorkoutTemplate(payload = {}) {
    const coachId = await resolveWorkoutTemplateCoachId()
    const templatePayload = normalizeWorkoutTemplatePayload(payload)
    const rows = await request({
      method: 'POST',
      table: 'workout_templates',
      query: {
        select: 'id,name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status',
      },
      body: {
        ...templatePayload,
        coach_id: coachId,
      },
    })
    const template = Array.isArray(rows) ? rows[0] : rows
    if (!template?.id) throw createRepositoryError('Workout template create did not return an id.', 500)
    return template
  }

  async function updateWorkoutTemplate(workoutTemplateId, payload = {}) {
    const normalizedWorkoutTemplateId = normalizeId(workoutTemplateId, 'Workout template ID')
    const rows = await request({
      method: 'PATCH',
      table: 'workout_templates',
      query: {
        id: `eq.${normalizedWorkoutTemplateId}`,
        select: 'id,name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status',
      },
      body: normalizeWorkoutTemplatePayload(payload),
    })
    const template = Array.isArray(rows) ? rows[0] : rows
    if (!template?.id) throw createRepositoryError('Workout template not found.', 404)
    return template
  }

  async function archiveWorkoutTemplate(workoutTemplateId) {
    const normalizedWorkoutTemplateId = normalizeId(workoutTemplateId, 'Workout template ID')
    const rows = await request({
      method: 'PATCH',
      table: 'workout_templates',
      query: {
        id: `eq.${normalizedWorkoutTemplateId}`,
        select: 'id,name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status',
      },
      body: {
        status: 'archived',
        updated_at: new Date().toISOString(),
      },
    })
    const template = Array.isArray(rows) ? rows[0] : rows
    if (!template?.id) throw createRepositoryError('Workout template not found.', 404)
    return template
  }

  async function getProgramWorkoutTree(programWorkoutId) {
    const normalizedProgramWorkoutId = normalizeId(programWorkoutId, 'Program workout ID')
    const workoutRows = await request({
      table: 'program_workouts',
      query: {
        select: PROGRAM_WORKOUT_SELECT,
        id: `eq.${normalizedProgramWorkoutId}`,
        limit: '1',
      },
    })

    const workout = Array.isArray(workoutRows) ? workoutRows[0] : workoutRows
    if (!workout?.id) {
      throw createRepositoryError('Program workout not found.', 404)
    }

    const blockRows = await request({
      table: 'program_workout_blocks',
      query: {
        select: PROGRAM_WORKOUT_BLOCK_SELECT,
        program_workout_id: `eq.${normalizedProgramWorkoutId}`,
        order: 'sort_order.asc',
      },
    })
    const blocks = Array.isArray(blockRows) ? blockRows : []

    const exerciseRows = await request({
      table: 'program_workout_exercises',
      query: {
        select: PROGRAM_WORKOUT_EXERCISE_SELECT,
        program_workout_id: `eq.${normalizedProgramWorkoutId}`,
        order: 'sort_order.asc',
      },
    })
    const exercises = Array.isArray(exerciseRows) ? exerciseRows : []

    const exerciseIds = exercises.map((row) => row.id).filter(Boolean)
    const setFilter = encodeInFilter(exerciseIds)
    const setRows = setFilter ? await request({
      table: 'program_workout_sets',
      query: {
        select: PROGRAM_WORKOUT_SET_SELECT,
        program_workout_exercise_id: `in.${setFilter}`,
        order: 'sort_order.asc',
      },
    }) : []

    return {
      workout,
      blocks,
      exercises,
      sets: Array.isArray(setRows) ? setRows : [],
    }
  }

  async function updateProgramWorkoutDetails(programWorkoutId, payload = {}) {
    const normalizedProgramWorkoutId = normalizeId(programWorkoutId, 'Program workout ID')
    const schedule = normalizeScheduleInput(payload)
    const nextPayload = {
      updated_at: new Date().toISOString(),
    }

    if (payload.name_snapshot !== undefined) nextPayload.name_snapshot = normalizeOptionalString(payload.name_snapshot)
    if (payload.notes !== undefined) nextPayload.notes = normalizeOptionalString(payload.notes)
    if (payload.status !== undefined) nextPayload.status = normalizeOptionalString(payload.status)
    if (schedule.scheduled_date !== null) nextPayload.scheduled_date = schedule.scheduled_date
    if (schedule.scheduled_start_time !== null) nextPayload.scheduled_start_time = schedule.scheduled_start_time
    if (schedule.scheduled_end_time !== null) nextPayload.scheduled_end_time = schedule.scheduled_end_time

    const rows = await request({
      method: 'PATCH',
      table: 'program_workouts',
      query: {
        id: `eq.${normalizedProgramWorkoutId}`,
        select: PROGRAM_WORKOUT_SELECT,
      },
      body: nextPayload,
    })

    const workout = Array.isArray(rows) ? rows[0] : rows
    if (!workout?.id) {
      throw createRepositoryError('Program workout not found.', 404)
    }

    return workout
  }

  async function replaceProgramWorkoutChildren(programWorkoutId, trainingSections = []) {
    const normalizedProgramWorkoutId = normalizeId(programWorkoutId, 'Program workout ID')
    const existingTree = await getProgramWorkoutTree(normalizedProgramWorkoutId)
    const existingExerciseIds = existingTree.exercises.map((exercise) => exercise.id).filter(Boolean)
    const now = new Date().toISOString()

    if (existingExerciseIds.length > 0) {
      await request({
        method: 'DELETE',
        table: 'program_workout_sets',
        query: {
          program_workout_exercise_id: `in.${encodeInFilter(existingExerciseIds)}`,
        },
        prefer: 'return=minimal',
      })
    }

    await request({
      method: 'DELETE',
      table: 'program_workout_exercises',
      query: {
        program_workout_id: `eq.${normalizedProgramWorkoutId}`,
      },
      prefer: 'return=minimal',
    })

    await request({
      method: 'DELETE',
      table: 'program_workout_blocks',
      query: {
        program_workout_id: `eq.${normalizedProgramWorkoutId}`,
      },
      prefer: 'return=minimal',
    })

    const normalizedSections = Array.isArray(trainingSections) ? trainingSections : []
    if (!normalizedSections.length) {
      return getProgramWorkoutTree(normalizedProgramWorkoutId)
    }

    const createdBlockRows = await request({
      method: 'POST',
      table: 'program_workout_blocks',
      query: {
        select: PROGRAM_WORKOUT_BLOCK_SELECT,
      },
      body: normalizedSections.map((section, index) => ({
        program_workout_id: normalizedProgramWorkoutId,
        block_code: normalizeOptionalString(section.label) ?? `A${index + 1}`,
        title: normalizeOptionalString(section.label) ?? `A${index + 1}`,
        instructions: normalizeOptionalString(section.instruction),
        sort_order: index,
        updated_at: now,
      })),
    })
    const createdBlocks = Array.isArray(createdBlockRows) ? createdBlockRows : [createdBlockRows]

    const exerciseSeedRows = []
    normalizedSections.forEach((section, sectionIndex) => {
      const createdBlockId = createdBlocks[sectionIndex]?.id ?? null
      const sectionExercises = Array.isArray(section.exercises) ? section.exercises : []
      sectionExercises.forEach((exercise, exerciseIndex) => {
        exerciseSeedRows.push({
          sourceExerciseId: exercise.id,
          program_workout_id: normalizedProgramWorkoutId,
          program_workout_block_id: createdBlockId,
          exercise_id: null,
          name_snapshot: normalizeOptionalString(exercise.title) ?? 'Exercise',
          sort_order: exerciseSeedRows.length,
          notes: normalizeOptionalString(exercise.instruction),
          default_rest_seconds: parseIntegerLike(exercise.sets?.[0]?.rest),
          updated_at: now,
          sourceSets: Array.isArray(exercise.sets) ? exercise.sets : [],
        })
      })
    })

    const createdExerciseRows = exerciseSeedRows.length > 0 ? await request({
      method: 'POST',
      table: 'program_workout_exercises',
      query: {
        select: PROGRAM_WORKOUT_EXERCISE_SELECT,
      },
      body: exerciseSeedRows.map(({ sourceExerciseId, sourceSets, ...row }) => row),
    }) : []
    const createdExercises = Array.isArray(createdExerciseRows) ? createdExerciseRows : (createdExerciseRows ? [createdExerciseRows] : [])

    const setRows = []
    createdExercises.forEach((createdExercise, index) => {
      const sourceSets = exerciseSeedRows[index]?.sourceSets ?? []
      sourceSets.forEach((setValues, setIndex) => {
        setRows.push({
          program_workout_exercise_id: createdExercise.id,
          sort_order: setIndex,
          set_type: 'straight',
          target_reps: parseIntegerLike(setValues.reps),
          target_load: null,
          target_load_unit: null,
          target_duration_seconds: parseDurationSeconds(setValues.duration),
          target_distance: parseDistanceValue(setValues.distance),
          target_distance_unit: parseDistanceUnit(setValues.distance),
          target_rpe: parseEffortToRpe(setValues.effort),
          target_rir: null,
          target_rest_seconds: parseIntegerLike(setValues.rest),
          notes: normalizeOptionalString(setValues.tempo) ?? normalizeOptionalString(setValues.side),
          updated_at: now,
        })
      })
    })

    if (setRows.length > 0) {
      await request({
        method: 'POST',
        table: 'program_workout_sets',
        query: {
          select: PROGRAM_WORKOUT_SET_SELECT,
        },
        body: setRows,
      })
    }

    return getProgramWorkoutTree(normalizedProgramWorkoutId)
  }

  async function createProgramWorkoutFromTemplate(payload = {}) {
    const workoutTemplateId = normalizeId(payload.workout_template_id ?? payload.workoutTemplateId, 'Workout template ID')
    const schedule = normalizeScheduleInput(payload, { requireComplete: true })
    const now = new Date().toISOString()

    const templateRows = await request({
      table: 'workout_templates',
      query: {
        select: WORKOUT_TEMPLATE_SELECT,
        id: `eq.${workoutTemplateId}`,
        limit: '1',
      },
    })
    const template = Array.isArray(templateRows) ? templateRows[0] : templateRows
    if (!template?.id) {
      throw createRepositoryError('Workout template not found.', 404)
    }

    const templateBlockRows = await request({
      table: 'workout_template_blocks',
      query: {
        select: WORKOUT_TEMPLATE_BLOCK_SELECT,
        workout_template_id: `eq.${workoutTemplateId}`,
        order: 'sort_order.asc',
      },
    })
    const rawTemplateBlocks = Array.isArray(templateBlockRows) ? templateBlockRows : []

    const templateExerciseRows = await request({
      table: 'workout_template_exercises',
      query: {
        select: WORKOUT_TEMPLATE_EXERCISE_SELECT,
        workout_template_id: `eq.${workoutTemplateId}`,
        order: 'sort_order.asc',
      },
    })
    const templateExercises = Array.isArray(templateExerciseRows) ? templateExerciseRows : []

    const templateExerciseIds = templateExercises.map((row) => row.id).filter(Boolean)
    const templateSetFilter = encodeInFilter(templateExerciseIds)
    const templateSetRows = templateSetFilter ? await request({
      table: 'workout_template_sets',
      query: {
        select: WORKOUT_TEMPLATE_SET_SELECT,
        workout_template_exercise_id: `in.${templateSetFilter}`,
        order: 'sort_order.asc',
      },
    }) : []
    const templateSets = Array.isArray(templateSetRows) ? templateSetRows : []
    const templateBlocks = rawTemplateBlocks.length > 0
      ? rawTemplateBlocks
      : [{
          id: '__default-block__',
          workout_template_id: workoutTemplateId,
          block_code: 'A1',
          title: 'A1',
          instructions: null,
          sort_order: 0,
        }]

    const createdWorkoutRows = await request({
      method: 'POST',
      table: 'program_workouts',
      query: {
        select: PROGRAM_WORKOUT_SELECT,
      },
      body: {
        athlete_id: payload.athlete_id ?? payload.athleteId ?? null,
        coach_id: payload.coach_id ?? payload.coachId ?? template.coach_id ?? null,
        program_id: payload.program_id ?? payload.programId ?? null,
        program_day_id: payload.program_day_id ?? payload.programDayId ?? null,
        workout_template_id: template.id,
        name_snapshot: normalizeOptionalString(payload.name_snapshot ?? payload.nameSnapshot) || template.name,
        notes: normalizeOptionalString(payload.notes) ?? null,
        status: normalizeOptionalString(payload.status) || 'scheduled',
        sort_order: payload.sort_order ?? payload.sortOrder ?? null,
        scheduled_date: schedule.scheduled_date,
        scheduled_start_time: schedule.scheduled_start_time,
        scheduled_end_time: schedule.scheduled_end_time,
        updated_at: now,
      },
    })
    const createdWorkout = Array.isArray(createdWorkoutRows) ? createdWorkoutRows[0] : createdWorkoutRows
    if (!createdWorkout?.id) {
      throw createRepositoryError('Failed to create program workout.', 500)
    }

    const templateBlockIdMap = new Map()
    const templateExerciseIdMap = new Map()
    if (templateBlocks.length > 0) {
      const createdBlockRows = await request({
        method: 'POST',
        table: 'program_workout_blocks',
        query: {
          select: PROGRAM_WORKOUT_BLOCK_SELECT,
        },
        body: templateBlocks.map((block) => ({
          program_workout_id: createdWorkout.id,
          block_code: block.block_code ?? null,
          title: block.title ?? null,
          instructions: block.instructions ?? null,
          sort_order: block.sort_order,
          updated_at: now,
        })),
      })
      const createdBlocks = Array.isArray(createdBlockRows) ? createdBlockRows : [createdBlockRows]
      templateBlocks.forEach((block, index) => {
        templateBlockIdMap.set(block.id, createdBlocks[index]?.id)
      })
    }

    if (templateExercises.length > 0) {
      const createdExerciseRows = await request({
        method: 'POST',
        table: 'program_workout_exercises',
        query: {
          select: PROGRAM_WORKOUT_EXERCISE_SELECT,
        },
        body: templateExercises.map((exercise) => ({
          program_workout_id: createdWorkout.id,
          program_workout_block_id: (() => {
            if (exercise.workout_template_block_id) {
              return templateBlockIdMap.get(exercise.workout_template_block_id) ?? null
            }

            return templateBlockIdMap.get('__default-block__') ?? null
          })(),
          exercise_id: exercise.exercise_id,
          name_snapshot: exercise.name_snapshot,
          sort_order: exercise.sort_order,
          notes: exercise.notes ?? null,
          default_rest_seconds: exercise.default_rest_seconds ?? null,
          updated_at: now,
        })),
      })
      const createdExercises = Array.isArray(createdExerciseRows) ? createdExerciseRows : [createdExerciseRows]
      templateExercises.forEach((exercise, index) => {
        templateExerciseIdMap.set(exercise.id, createdExercises[index]?.id)
      })
    }

    if (templateSets.length > 0) {
      await request({
        method: 'POST',
        table: 'program_workout_sets',
        query: {
          select: PROGRAM_WORKOUT_SET_SELECT,
        },
        body: templateSets
          .map((setRow) => ({
            program_workout_exercise_id: templateExerciseIdMap.get(setRow.workout_template_exercise_id),
            sort_order: setRow.sort_order,
            set_type: setRow.set_type,
            target_reps: setRow.target_reps,
            target_load: setRow.target_load,
            target_load_unit: setRow.target_load_unit,
            target_duration_seconds: setRow.target_duration_seconds,
            target_distance: setRow.target_distance,
            target_distance_unit: setRow.target_distance_unit,
            target_rpe: setRow.target_rpe,
            target_rir: setRow.target_rir,
            target_rest_seconds: setRow.target_rest_seconds,
            notes: setRow.notes ?? null,
            updated_at: now,
          }))
          .filter((setRow) => setRow.program_workout_exercise_id),
      })
    }

    return getProgramWorkoutTree(createdWorkout.id)
  }

  return {
    listWorkoutTemplates,
    getWorkoutTemplate,
    createWorkoutTemplate,
    updateWorkoutTemplate,
    archiveWorkoutTemplate,
    getProgramWorkoutTree,
    updateProgramWorkoutDetails,
    replaceProgramWorkoutChildren,
    createProgramWorkoutFromTemplate,
  }
}
