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
    baseRestUrl: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
  }
}

async function requestTable(table, query = '') {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
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
    throw createRepositoryError(`${table} request failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function insertTable(table, payload) {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} insert failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function patchTable(table, query = '', payload = {}) {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} patch failed: ${response.status} ${text}`, response.status)
  }

  return response.json()
}

async function deleteTable(table, query = '') {
  const { baseRestUrl, serviceRoleKey } = getRepositoryConfig()
  const response = await fetch(`${baseRestUrl}/${table}${query}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw createRepositoryError(`${table} delete failed: ${response.status} ${text}`, response.status)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : true
}

async function resolveCoachId() {
  const coachRows = await requestTable('coach_profiles', '?select=id&order=created_at.asc&limit=1')
  const coachId = Array.isArray(coachRows) ? coachRows[0]?.id : null
  if (!coachId) throw createRepositoryError('No coach profile exists yet for program ownership.', 400)
  return coachId
}

function formatAthleteLabel(row) {
  const firstName = row?.athlete_profiles?.first_name ?? ''
  const lastName = row?.athlete_profiles?.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || 'Unassigned'
}

function formatDurationLabel(weekCount) {
  if (!weekCount) return '-'
  return `${weekCount} week${weekCount === 1 ? '' : 's'}`
}

function formatCreatedDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatStatusLabel(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatProgramTypeLabel(row) {
  return row?.athlete_id ? 'Assigned' : 'Unassigned'
}

function createCounter(rows, key) {
  return rows.reduce((accumulator, row) => {
    const value = row?.[key]
    if (!value) return accumulator
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1)
    return accumulator
  }, new Map())
}

function mapAthleteOption(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed athlete'
  return { id: row.id, name, avatarUrl: row.avatar_url ?? '' }
}

function normalizeAthleteIds(athleteIds = []) {
  return Array.from(new Set((Array.isArray(athleteIds) ? athleteIds : []).map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function normalizeWeekCount(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

function buildProgramPayload({ athleteId = null, coachId, name, description = '', startDate = '', endDate = '', status = 'active' }) {
  return {
    athlete_id: athleteId,
    coach_id: coachId,
    name: String(name).trim(),
    description: String(description ?? '').trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
    status,
    updated_at: new Date().toISOString(),
  }
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function buildProgramWeekPayloads({ programId, weeks, startDate = '', endDate = '' }) {
  const weekCount = normalizeWeekCount(weeks)
  if (!programId || weekCount <= 0) return []

  const startSeed = startDate ? new Date(`${startDate}T12:00:00Z`) : null
  const endSeed = endDate ? new Date(`${endDate}T12:00:00Z`) : null

  return Array.from({ length: weekCount }, (_, index) => {
    const weekStart = startSeed ? addDays(startSeed, index * 7) : null
    const weekEnd = weekStart ? addDays(weekStart, 6) : null
    const isLastWeek = index === weekCount - 1

    return {
      program_id: programId,
      week_index: index + 1,
      name: `Week ${index + 1}`,
      start_date: weekStart ? formatDateOnly(weekStart) : null,
      end_date: isLastWeek && endSeed ? formatDateOnly(endSeed) : weekEnd ? formatDateOnly(weekEnd) : null,
    }
  })
}

function formatProgramRow(row, context) {
  const weekCount = context.weekCountByProgramId.get(row.id) ?? 0
  const workoutCount = context.workoutCountByProgramId.get(row.id) ?? 0
  const exerciseCount = context.exerciseCountByProgramId.get(row.id) ?? 0

  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    athleteIds: row.athlete_id ? [row.athlete_id] : [],
    coachId: row.coach_id ?? null,
    programType: formatProgramTypeLabel(row),
    name: row.name ?? 'Untitled program',
    athletesLabel: formatAthleteLabel(row),
    weekCount,
    duration: formatDurationLabel(weekCount),
    workouts: String(workoutCount),
    exercises: String(exerciseCount),
    createdDate: formatCreatedDate(row.created_at),
    createdAt: row.created_at ?? null,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    description: row.description ?? '',
    status: formatStatusLabel(row.status),
  }
}

function normalizeDaySlotId(dayIndex) {
  const parsed = Number(dayIndex)
  const index = Number.isFinite(parsed) ? Math.max(1, Math.min(7, Math.floor(parsed))) : 1
  return `day-${index}`
}

function formatDurationFromWorkout(row) {
  const minutes = row?.workout_templates?.estimated_duration_minutes
  if (minutes == null) return '30 min'
  return `${minutes} min`
}

function mapSetRowToBuilderSet(row = {}) {
  return {
    id: row.id,
    reps: row.target_reps == null ? '' : String(row.target_reps),
    duration: row.target_duration_seconds == null ? '' : `${row.target_duration_seconds}s`,
    distance: row.target_distance == null ? '' : `${row.target_distance}${row.target_distance_unit ? ` ${row.target_distance_unit}` : ''}`,
    effort: row.target_rpe == null ? '' : String(row.target_rpe),
    rest: row.target_rest_seconds == null ? '' : `${row.target_rest_seconds}s`,
    tempo: row.notes ?? '',
    side: '',
  }
}

function mapProgramWorkoutToPlannerWorkout(row = {}, children = {}) {
  const blocks = children.blocksByWorkoutId.get(row.id) ?? []
  const exercises = children.exercisesByWorkoutId.get(row.id) ?? []
  const setsByExerciseId = children.setsByExerciseId
  const fallbackBlock = { id: `${row.id}-main`, title: row.workout_templates?.training_type || 'Main Work', instructions: row.notes ?? '', sort_order: 0 }
  const sectionBlocks = blocks.length ? blocks : [fallbackBlock]

  return {
    id: row.id,
    programWorkoutId: row.id,
    programDayId: row.program_day_id ?? null,
    title: row.name_snapshot || row.workout_templates?.name || 'Workout',
    blockLabel: row.workout_templates?.training_type || 'Main Work',
    blockBgColor: row.bg_color || row.workout_templates?.bg_color || null,
    blockTextColor: row.text_color || row.workout_templates?.text_color || null,
    duration: formatDurationFromWorkout(row),
    status: row.status || 'scheduled',
    focusArea: row.workout_templates?.training_type || 'main-work',
    coachNote: row.notes || row.workout_templates?.description || '',
    programBlocks: sectionBlocks.map((block, blockIndex) => ({
      id: block.id,
      title: block.title || block.block_code || `A${blockIndex + 1}`,
      description: block.instructions || '',
    })),
    sections: sectionBlocks.map((block, blockIndex) => {
      const blockExercises = exercises.filter((exercise) => {
        if (block.id === fallbackBlock.id) return !exercise.program_workout_block_id || !blocks.length
        return exercise.program_workout_block_id === block.id
      })

      return {
        id: block.id,
        title: block.title || block.block_code || `A${blockIndex + 1}`,
        description: block.instructions || '',
        exercises: blockExercises.map((exercise) => ({
          id: exercise.id,
          title: exercise.name_snapshot || 'Exercise',
          instruction: exercise.notes || '',
          sets: (setsByExerciseId.get(exercise.id) ?? []).map(mapSetRowToBuilderSet),
        })),
      }
    }),
  }
}

function groupBy(rows = [], key) {
  return rows.reduce((map, row) => {
    const value = row?.[key]
    if (!value) return map
    if (!map.has(value)) map.set(value, [])
    map.get(value).push(row)
    return map
  }, new Map())
}

function createProgramPlannerWeeks({ weekRows = [], dayRows = [], workoutRows = [], blockRows = [], exerciseRows = [], setRows = [] }) {
  const daysByWeekId = groupBy(dayRows, 'program_week_id')
  const workoutsByDayId = groupBy(workoutRows, 'program_day_id')
  const blocksByWorkoutId = groupBy(blockRows, 'program_workout_id')
  const exercisesByWorkoutId = groupBy(exerciseRows, 'program_workout_id')
  const setsByExerciseId = groupBy(setRows, 'program_workout_exercise_id')
  const childContext = { blocksByWorkoutId, exercisesByWorkoutId, setsByExerciseId }

  return weekRows.map((week, index) => {
    const days = (daysByWeekId.get(week.id) ?? []).sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0))

    return {
      id: `week-${week.week_index ?? index + 1}`,
      programWeekId: week.id,
      label: week.name || `Week ${week.week_index ?? index + 1}`,
      focus: 'Training content',
      summary: week.start_date && week.end_date ? `${week.start_date} to ${week.end_date}` : 'Coach-managed weekly structure.',
      daySlots: days.map((day) => ({
        id: normalizeDaySlotId(day.day_index),
        programDayId: day.id,
        date: day.date ?? null,
        label: `Day ${day.day_index ?? 1}`,
        summary: day.date || day.name || 'Training day',
        focus: day.status === 'off' ? 'Off day' : day.status === 'recovery' ? 'Recovery' : 'Training day',
        workouts: (workoutsByDayId.get(day.id) ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((workout) => mapProgramWorkoutToPlannerWorkout(workout, childContext)),
      })),
    }
  })
}

async function getProgramById(programId) {
  const [programRows, weekRows, dayRows, workoutRows, workoutBlockRows, workoutExerciseRows] = await Promise.all([
    requestTable(
      'programs',
      `?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&id=eq.${encodeURIComponent(programId)}&limit=1`,
    ),
    requestTable('program_weeks', `?select=id,program_id,week_index,name,start_date,end_date&program_id=eq.${encodeURIComponent(programId)}&order=week_index.asc`),
    requestTable('program_days', '?select=id,program_week_id,day_index,date,name,notes,status&order=day_index.asc'),
    requestTable('program_workouts', `?select=id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,bg_color,text_color,status,sort_order,scheduled_date,scheduled_start_time,scheduled_end_time,created_at,updated_at,workout_templates(name,description,training_type,bg_color,text_color,estimated_duration_minutes,thumbnail_url,status)&program_id=eq.${encodeURIComponent(programId)}&order=sort_order.asc`),
    requestTable('program_workout_blocks', '?select=id,program_workout_id,block_code,title,instructions,sort_order&order=sort_order.asc'),
    requestTable('program_workout_exercises', '?select=id,program_workout_id,program_workout_block_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds&order=sort_order.asc'),
  ])

  const programRow = Array.isArray(programRows) ? programRows[0] : null
  if (!programRow) throw createRepositoryError('Program not found.', 404)

  const weekRowsList = Array.isArray(weekRows) ? weekRows : []
  const programWeekIds = new Set(weekRowsList.map((week) => week.id).filter(Boolean))
  const dayRowsList = (Array.isArray(dayRows) ? dayRows : []).filter((day) => programWeekIds.has(day.program_week_id))
  const workoutRowsList = Array.isArray(workoutRows) ? workoutRows : []
  const workoutIds = workoutRowsList.map((row) => row.id).filter(Boolean)
  const workoutIdSet = new Set(workoutIds)
  const exerciseRowsList = (Array.isArray(workoutExerciseRows) ? workoutExerciseRows : []).filter((exercise) => workoutIdSet.has(exercise.program_workout_id))
  const exerciseIds = exerciseRowsList.map((row) => row.id).filter(Boolean)
  const setRows = exerciseIds.length ? await requestTable('program_workout_sets', `?select=id,program_workout_exercise_id,sort_order,set_type,target_reps,target_load,target_load_unit,target_duration_seconds,target_distance,target_distance_unit,target_rpe,target_rir,target_rest_seconds,notes&program_workout_exercise_id=in.(${exerciseIds.map(encodeURIComponent).join(',')})&order=sort_order.asc`) : []
  const blockRowsList = (Array.isArray(workoutBlockRows) ? workoutBlockRows : []).filter((row) => workoutIdSet.has(row.program_workout_id))

  const weekCountByProgramId = createCounter(weekRowsList, 'program_id')
  const workoutCountByProgramId = createCounter(workoutRowsList, 'program_id')
  const exerciseCountByWorkoutId = createCounter(exerciseRowsList, 'program_workout_id')
  const exerciseCountByProgramId = workoutRowsList.reduce((accumulator, workoutRow) => {
    const nextProgramId = workoutRow?.program_id
    const workoutId = workoutRow?.id
    if (!nextProgramId || !workoutId) return accumulator
    accumulator.set(nextProgramId, (accumulator.get(nextProgramId) ?? 0) + (exerciseCountByWorkoutId.get(workoutId) ?? 0))
    return accumulator
  }, new Map())

  const formattedProgram = formatProgramRow(programRow, {
    weekCountByProgramId,
    workoutCountByProgramId,
    exerciseCountByProgramId,
  })

  return {
    ...formattedProgram,
    weeks: createProgramPlannerWeeks({
      weekRows: weekRowsList,
      dayRows: dayRowsList,
      workoutRows: workoutRowsList,
      blockRows: blockRowsList,
      exerciseRows: exerciseRowsList,
      setRows: Array.isArray(setRows) ? setRows : [],
    }),
  }
}


async function syncProgramAthleteAssignments({ programId, athleteIds = [], name, startDate = '', endDate = '', description = '' }) {
  const existingProgram = await getProgramById(programId)
  if (!existingProgram?.id) throw createRepositoryError('Program not found.', 404)

  const coachId = existingProgram.coachId || await resolveCoachId()
  const targetAthleteIds = athleteIds.length ? athleteIds : [null]
  const primaryAthleteId = targetAthleteIds[0]

  await patchTable(
    'programs',
    `?id=eq.${encodeURIComponent(programId)}`,
    buildProgramPayload({
      athleteId: primaryAthleteId,
      coachId,
      name,
      description,
      startDate,
      endDate,
      status: existingProgram.status?.toLowerCase?.() || 'active',
    }),
  )

  const siblingRows = await requestTable(
    'programs',
    `?select=id,athlete_id&name=eq.${encodeURIComponent(existingProgram.name)}&coach_id=eq.${encodeURIComponent(coachId)}&start_date=${existingProgram.startDate ? `eq.${encodeURIComponent(existingProgram.startDate)}` : 'is.null'}&end_date=${existingProgram.endDate ? `eq.${encodeURIComponent(existingProgram.endDate)}` : 'is.null'}`,
  )
  const siblingRowsList = Array.isArray(siblingRows) ? siblingRows.filter((row) => row.id !== programId) : []
  const siblingByAthleteId = new Map(siblingRowsList.filter((row) => row.athlete_id).map((row) => [row.athlete_id, row]))
  const wantedSiblingAthleteIds = targetAthleteIds.slice(1).filter(Boolean)

  for (const athleteId of wantedSiblingAthleteIds) {
    const existingSibling = siblingByAthleteId.get(athleteId)
    if (existingSibling?.id) {
      await patchTable(
        'programs',
        `?id=eq.${encodeURIComponent(existingSibling.id)}`,
        buildProgramPayload({
          athleteId,
          coachId,
          name,
          description,
          startDate,
          endDate,
          status: existingProgram.status?.toLowerCase?.() || 'active',
        }),
      )
      continue
    }

    await insertTable('programs', buildProgramPayload({
      athleteId,
      coachId,
      name,
      description,
      startDate,
      endDate,
      status: existingProgram.status?.toLowerCase?.() || 'active',
    }))
  }

  const wantedSiblingSet = new Set(wantedSiblingAthleteIds)
  for (const sibling of siblingRowsList) {
    if (sibling.athlete_id && !wantedSiblingSet.has(sibling.athlete_id)) {
      await deleteTable('programs', `?id=eq.${encodeURIComponent(sibling.id)}`)
    }
  }

  return getProgramById(programId)
}

export function createAdminProgramRepository() {
  return {
    getProgramById,

    async listAthleteOptions() {
      const athleteRows = await requestTable('athlete_profiles', '?select=id,first_name,last_name,avatar_url&order=created_at.asc')
      return Array.isArray(athleteRows) ? athleteRows.map(mapAthleteOption) : []
    },

    async listPrograms() {
      const [programRows, weekRows, workoutRows, workoutExerciseRows] = await Promise.all([
        requestTable(
          'programs',
          '?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles(first_name,last_name)&order=created_at.asc',
        ),
        requestTable('program_weeks', '?select=id,program_id'),
        requestTable('program_workouts', '?select=id,program_id'),
        requestTable('program_workout_exercises', '?select=id,program_workout_id'),
      ])

      const weekCountByProgramId = createCounter(Array.isArray(weekRows) ? weekRows : [], 'program_id')
      const workoutRowsList = Array.isArray(workoutRows) ? workoutRows : []
      const workoutCountByProgramId = createCounter(workoutRowsList, 'program_id')
      const exerciseCountByWorkoutId = createCounter(Array.isArray(workoutExerciseRows) ? workoutExerciseRows : [], 'program_workout_id')
      const exerciseCountByProgramId = workoutRowsList.reduce((accumulator, workoutRow) => {
        const programId = workoutRow?.program_id
        const workoutId = workoutRow?.id
        if (!programId || !workoutId) return accumulator
        accumulator.set(programId, (accumulator.get(programId) ?? 0) + (exerciseCountByWorkoutId.get(workoutId) ?? 0))
        return accumulator
      }, new Map())

      const context = {
        weekCountByProgramId,
        workoutCountByProgramId,
        exerciseCountByProgramId,
      }

      return Array.isArray(programRows) ? programRows.map((row) => formatProgramRow(row, context)) : []
    },

    async createProgram({ athleteIds = [], name, weeks, startDate = '', endDate = '', description = '', status = 'active' }) {
      const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
      if (!name || !String(name).trim()) throw createRepositoryError('Program name is required.', 400)

      const coachId = await resolveCoachId()
      const createdProgramIds = []
      const targetAthleteIds = normalizedAthleteIds.length ? normalizedAthleteIds : [null]

      for (const athleteId of targetAthleteIds) {
        const createdProgramRows = await insertTable('programs', buildProgramPayload({
          athleteId,
          coachId,
          name,
          description,
          startDate,
          endDate,
          status,
        }))

        const createdProgram = Array.isArray(createdProgramRows) ? createdProgramRows[0] : createdProgramRows
        const createdProgramId = createdProgram?.id
        if (!createdProgramId) throw createRepositoryError('Program create did not return an id.', 500)
        createdProgramIds.push(createdProgramId)

        const weekPayloads = buildProgramWeekPayloads({
          programId: createdProgramId,
          weeks,
          startDate,
          endDate,
        })

        if (weekPayloads.length > 0) {
          await insertTable('program_weeks', weekPayloads)
        }
      }

      return getProgramById(createdProgramIds[0])
    },

    async updateProgram({ programId, athleteIds = [], name, startDate = '', endDate = '', description = '' }) {
      if (!programId) throw createRepositoryError('Program id is required.', 400)
      const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
      if (!name || !String(name).trim()) throw createRepositoryError('Program name is required.', 400)

      return syncProgramAthleteAssignments({
        programId,
        athleteIds: normalizedAthleteIds,
        name,
        startDate,
        endDate,
        description,
      })
    },

    async deleteProgram(programId) {
      if (!programId) throw createRepositoryError('Program id is required.', 400)
      const deletedRows = await deleteTable('programs', `?id=eq.${encodeURIComponent(programId)}`)
      if (Array.isArray(deletedRows) && deletedRows.length === 0) throw createRepositoryError('Program not found.', 404)
      return { id: programId }
    },
  }
}
