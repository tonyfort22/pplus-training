function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase REST exercise repository requires fetch support')
  }
  return fetchImpl
}

function mapExerciseRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name ?? '',
    thumbnailUrl: row.thumbnail_url ?? null,
    videoUrl: row.video_url ?? null,
  }
}

function mapProgramWorkoutSetRow(row) {
  if (!row) return null
  return {
    setType: row.set_type || 'straight',
    targetReps: row.target_reps ?? null,
    targetLoad: row.target_load ?? null,
    targetLoadUnit: row.target_load_unit ?? null,
    targetDurationSeconds: row.target_duration_seconds ?? null,
    targetDistance: row.target_distance ?? null,
    targetDistanceUnit: row.target_distance_unit ?? null,
    targetRpe: row.target_rpe ?? null,
    targetRir: row.target_rir ?? null,
    targetRestSeconds: row.target_rest_seconds ?? null,
    notes: row.notes || '',
    sortOrder: row.sort_order ?? 0,
  }
}

export function createSupabaseRestExerciseRepository(config) {
  const baseUrl = config?.url
  const anonKey = config?.anonKey
  const accessToken = config?.accessToken || null
  const schema = config?.schema || 'public'
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch)

  if (!baseUrl) {
    throw new Error('Supabase REST exercise repository requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase REST exercise repository requires an anonKey')
  }

  async function request({ method = 'GET', table, query = {}, body }) {
    const url = new URL(`/rest/v1/${table}`, baseUrl)

    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken || anonKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
      body: body == null ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Unknown Supabase exercise error'
      throw new Error(`Supabase exercise request failed (${response.status}): ${message}`)
    }

    return payload
  }

  async function getLatestLinkedExerciseTemplate(exerciseId) {
    if (!exerciseId) return null

    try {
      const linkedRows = await request({
        table: 'program_workout_exercises',
        query: {
          select: 'id,default_rest_seconds',
          exercise_id: `eq.${exerciseId}`,
          order: 'updated_at.desc,created_at.desc',
          limit: '1',
        },
      })

      const linkedRow = Array.isArray(linkedRows) ? linkedRows[0] : null
      if (!linkedRow?.id) return null

      const setRows = await request({
        table: 'program_workout_sets',
        query: {
          select: 'sort_order,set_type,target_reps,target_load,target_load_unit,target_duration_seconds,target_distance,target_distance_unit,target_rpe,target_rir,target_rest_seconds,notes',
          program_workout_exercise_id: `eq.${linkedRow.id}`,
          order: 'sort_order.asc',
        },
      })

      return {
        defaultRestSeconds: linkedRow.default_rest_seconds ?? null,
        sets: Array.isArray(setRows) ? setRows.map(mapProgramWorkoutSetRow).filter(Boolean) : [],
      }
    } catch {
      return null
    }
  }

  async function resolveExerciseWithLinkedDefaults(row) {
    const exercise = mapExerciseRow(row)
    if (!exercise?.id) return exercise
    const linkedTemplate = await getLatestLinkedExerciseTemplate(exercise.id)
    if (!linkedTemplate) return exercise
    return {
      ...exercise,
      defaultRestSeconds: linkedTemplate.defaultRestSeconds,
      sets: linkedTemplate.sets,
    }
  }

  return {
    async listExercises() {
      const rows = await request({
        table: 'exercises',
        query: {
          select: 'id,name,thumbnail_url,video_url',
          order: 'name.asc',
        },
      })

      return Array.isArray(rows) ? rows.map(mapExerciseRow).filter(Boolean) : []
    },
    async getExerciseById(exerciseId) {
      if (!exerciseId) return null

      const rows = await request({
        table: 'exercises',
        query: {
          select: 'id,name,thumbnail_url,video_url',
          id: `eq.${exerciseId}`,
          limit: '1',
        },
      })

      const row = Array.isArray(rows) ? rows[0] : null
      return resolveExerciseWithLinkedDefaults(row)
    },
    async getExerciseByName(exerciseName) {
      if (!exerciseName) return null

      const rows = await request({
        table: 'exercises',
        query: {
          select: 'id,name,thumbnail_url,video_url',
          name: `eq.${exerciseName}`,
          limit: '1',
        },
      })

      const row = Array.isArray(rows) ? rows[0] : null
      return resolveExerciseWithLinkedDefaults(row)
    },
    async getExerciseWithMappings(exerciseId) {
      return {
        exerciseId,
        muscleMaps: [],
        subMuscleMaps: [],
      }
    },
  }
}

export function createExerciseRepository(db) {
  return {
    db,
    async listExercises() {
      if (typeof db?.listExercises === 'function') {
        return db.listExercises()
      }
      return []
    },
    async getExerciseById(exerciseId) {
      if (typeof db?.getExerciseById === 'function') {
        return db.getExerciseById(exerciseId)
      }
      return null
    },
    async getExerciseByName(exerciseName) {
      if (typeof db?.getExerciseByName === 'function') {
        return db.getExerciseByName(exerciseName)
      }
      return null
    },
    async getExerciseWithMappings(exerciseId) {
      if (typeof db?.getExerciseWithMappings === 'function') {
        return db.getExerciseWithMappings(exerciseId)
      }
      return {
        exerciseId,
        muscleMaps: [],
        subMuscleMaps: [],
      }
    },
  }
}
