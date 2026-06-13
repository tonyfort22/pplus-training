function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase REST program repository requires fetch support')
  }
  return fetchImpl
}

function normalizeCoachAthleteProfileId(athleteId) {
  const value = String(athleteId || '').trim()
  return value.startsWith('coach-athlete-') ? value.slice('coach-athlete-'.length) : value
}

function mapProgramRow(row) {
  if (!row) return null
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    name: row.name ?? '',
    description: row.description ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    status: row.status ?? '',
  }
}

function mapProgramWeekRow(row) {
  if (!row) return null
  return {
    id: row.id,
    programId: row.program_id ?? null,
    weekIndex: row.week_index ?? null,
    name: row.name ?? '',
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
  }
}

function mapProgramDayRow(row) {
  if (!row) return null
  return {
    id: row.id,
    programWeekId: row.program_week_id ?? null,
    dayIndex: row.day_index ?? null,
    date: row.date ?? null,
    name: row.name ?? null,
    notes: row.notes ?? null,
    status: row.status ?? '',
  }
}

function mapProgramWorkoutRow(row) {
  if (!row) return null
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    programId: row.program_id ?? null,
    programDayId: row.program_day_id ?? null,
    workoutTemplateId: row.workout_template_id ?? null,
    nameSnapshot: row.name_snapshot ?? '',
    notes: row.notes ?? '',
    status: row.status ?? '',
    sortOrder: row.sort_order ?? 0,
  }
}

function mapProgramWorkoutExerciseRow(row) {
  if (!row) return null
  return {
    id: row.id,
    programWorkoutExerciseId: row.id,
    programWorkoutId: row.program_workout_id ?? null,
    exerciseId: row.exercise_id ?? null,
    nameSnapshot: row.name_snapshot ?? '',
    sortOrder: row.sort_order ?? 0,
    notes: row.notes ?? '',
    defaultRestSeconds: row.default_rest_seconds ?? null,
  }
}

function mapWorkoutSessionStatusRow(row) {
  if (!row) return null
  return {
    id: row.id,
    programWorkoutId: row.program_workout_id ?? null,
    status: row.status ?? '',
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function mapProgramWorkoutSetRow(row) {
  if (!row) return null
  return {
    id: row.id,
    programWorkoutExerciseId: row.program_workout_exercise_id ?? null,
    sortOrder: row.sort_order ?? 0,
    setType: row.set_type ?? 'straight',
    reps: row.target_reps == null ? '' : String(row.target_reps),
    load: row.target_load == null ? '' : String(row.target_load),
    effort: row.target_rpe == null ? '' : String(row.target_rpe),
    targetReps: row.target_reps ?? null,
    targetLoad: row.target_load ?? null,
    targetLoadUnit: row.target_load_unit ?? null,
    targetDurationSeconds: row.target_duration_seconds ?? null,
    targetDistance: row.target_distance ?? null,
    targetDistanceUnit: row.target_distance_unit ?? null,
    targetRpe: row.target_rpe ?? null,
    targetRir: row.target_rir ?? null,
    prescribedRestSeconds: row.target_rest_seconds ?? null,
    notes: row.notes ?? '',
  }
}

function mapProgramWorkoutRowsWithDerivedStatus(workoutRows = [], workoutSessions = [], daysById = new Map(), todayIsoDate = formatLocalIsoDate()) {
  const latestSessionByProgramWorkoutId = new Map()
  for (const session of workoutSessions) {
    if (!session?.programWorkoutId) continue
    if (!latestSessionByProgramWorkoutId.has(session.programWorkoutId)) {
      latestSessionByProgramWorkoutId.set(session.programWorkoutId, session)
    }
  }

  return workoutRows.map((row) => {
    const workout = mapProgramWorkoutRow(row)
    const dayDate = daysById.get(workout.programDayId)?.date || null
    return {
      ...workout,
      status: deriveProgramWorkoutStatus({
        workout,
        dayDate,
        todayIsoDate,
        latestSession: latestSessionByProgramWorkoutId.get(workout.id) || null,
      }),
    }
  })
}

function attachProgramWorkoutExercises(workouts = [], exerciseRows = [], setRows = []) {
  const setsByExerciseId = new Map()
  for (const row of Array.isArray(setRows) ? setRows : []) {
    const set = mapProgramWorkoutSetRow(row)
    if (!set?.programWorkoutExerciseId) continue
    const list = setsByExerciseId.get(set.programWorkoutExerciseId) || []
    list.push(set)
    setsByExerciseId.set(set.programWorkoutExerciseId, list)
  }

  const exercisesByWorkoutId = new Map()
  for (const row of Array.isArray(exerciseRows) ? exerciseRows : []) {
    const exercise = mapProgramWorkoutExerciseRow(row)
    if (!exercise?.programWorkoutId) continue
    const list = exercisesByWorkoutId.get(exercise.programWorkoutId) || []
    list.push({
      ...exercise,
      sets: setsByExerciseId.get(exercise.id) || [],
    })
    exercisesByWorkoutId.set(exercise.programWorkoutId, list)
  }

  return workouts.map((workout) => ({
    ...workout,
    exercises: exercisesByWorkoutId.get(workout.id) || workout.exercises || [],
  }))
}

function formatLocalIsoDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function compareIsoDates(left, right) {
  return String(left || '').localeCompare(String(right || ''))
}

function deriveProgramWorkoutStatus({ workout, dayDate, todayIsoDate, latestSession }) {
  const sessionStatus = String(latestSession?.status || '').toLowerCase()
  if (sessionStatus === 'completed') return 'completed'
  if (sessionStatus === 'in_progress' || sessionStatus === 'paused') return 'scheduled'
  if (sessionStatus === 'discarded' || sessionStatus === 'abandoned') return 'missed'

  const workoutStatus = String(workout?.status || '').toLowerCase()
  if (workoutStatus === 'completed') return 'completed'
  if (workoutStatus === 'missed' || workoutStatus === 'skipped') return 'missed'

  if (dayDate && todayIsoDate && compareIsoDates(dayDate, todayIsoDate) < 0) {
    return 'missed'
  }

  return 'scheduled'
}

const PROGRAM_WORKOUT_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order'
const PROGRAM_WORKOUT_LEGACY_SELECT = 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order'

function isMissingProgramWorkoutNotesColumnError(error) {
  const message = String(error?.message || '')
  return message.includes("Could not find the 'notes' column of 'program_workouts' in the schema cache")
    || message.includes('program_workouts.notes does not exist')
}

export function createSupabaseRestProgramRepository(config) {
  const baseUrl = config?.url
  const anonKey = config?.anonKey
  const accessToken = config?.accessToken || null
  const schema = config?.schema || 'public'
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch)

  if (!baseUrl) {
    throw new Error('Supabase REST program repository requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase REST program repository requires an anonKey')
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
      const message = payload?.message || response.statusText || 'Unknown Supabase program error'
      throw new Error(`Supabase program request failed (${response.status}): ${message}`)
    }

    return payload
  }

  async function getProgramTree(query) {
    const todayIsoDate = config?.todayIsoDate || formatLocalIsoDate()
    const programRows = await request({
      table: 'programs',
      query: {
        select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status',
        ...query,
        limit: '1',
      },
    })

    const program = mapProgramRow(Array.isArray(programRows) ? programRows[0] : null)
    if (!program?.id) return null

    const weekRows = await request({
      table: 'program_weeks',
      query: {
        select: 'id,program_id,week_index,name,start_date,end_date',
        program_id: `eq.${program.id}`,
        order: 'week_index.asc',
      },
    })

    const weeks = Array.isArray(weekRows) ? weekRows.map(mapProgramWeekRow).filter(Boolean) : []
    const weekIds = weeks.map((week) => week.id).filter(Boolean)

    const dayRows = weekIds.length > 0
      ? await request({
          table: 'program_days',
          query: {
            select: 'id,program_week_id,day_index,date,name,notes,status',
            program_week_id: `in.(${weekIds.join(',')})`,
            order: 'day_index.asc',
          },
        })
      : []

    const days = Array.isArray(dayRows) ? dayRows.map(mapProgramDayRow).filter(Boolean) : []
    const daysById = new Map(days.map((day) => [day.id, day]))
    const dayIds = days.map((day) => day.id).filter(Boolean)

    const workoutRows = dayIds.length > 0
      ? await (async () => {
          try {
            return await request({
              table: 'program_workouts',
              query: {
                select: PROGRAM_WORKOUT_SELECT,
                program_day_id: `in.(${dayIds.join(',')})`,
                order: 'sort_order.asc',
              },
            })
          } catch (error) {
            if (!isMissingProgramWorkoutNotesColumnError(error)) throw error
            return request({
              table: 'program_workouts',
              query: {
                select: PROGRAM_WORKOUT_LEGACY_SELECT,
                program_day_id: `in.(${dayIds.join(',')})`,
                order: 'sort_order.asc',
              },
            })
          }
        })()
      : []

    const workoutIds = Array.isArray(workoutRows) ? workoutRows.map((row) => row.id).filter(Boolean) : []
    const workoutSessionRows = workoutIds.length > 0
      ? await request({
          table: 'workout_sessions',
          query: {
            program_workout_id: `in.(${workoutIds.join(',')})`,
            select: 'id,program_workout_id,status,started_at,completed_at,updated_at',
            order: 'updated_at.desc.nullslast,started_at.desc.nullslast',
          },
        })
      : []

    const exerciseRows = workoutIds.length > 0
      ? await request({
          table: 'program_workout_exercises',
          query: {
            select: 'id,program_workout_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds',
            program_workout_id: `in.(${workoutIds.join(',')})`,
            order: 'sort_order.asc',
          },
        })
      : []

    const exerciseIds = Array.isArray(exerciseRows) ? exerciseRows.map((row) => row.id).filter(Boolean) : []
    const setRows = exerciseIds.length > 0
      ? await request({
          table: 'program_workout_sets',
          query: {
            select: 'id,program_workout_exercise_id,sort_order,set_type,target_reps,target_load,target_load_unit,target_duration_seconds,target_distance,target_distance_unit,target_rpe,target_rir,target_rest_seconds,notes',
            program_workout_exercise_id: `in.(${exerciseIds.join(',')})`,
            order: 'sort_order.asc',
          },
        })
      : []

    const workoutSessions = Array.isArray(workoutSessionRows)
      ? workoutSessionRows.map(mapWorkoutSessionStatusRow).filter(Boolean)
      : []

    const workouts = attachProgramWorkoutExercises(
      mapProgramWorkoutRowsWithDerivedStatus(workoutRows, workoutSessions, daysById, todayIsoDate),
      exerciseRows,
      setRows,
    )
    const workoutsByDayId = new Map()
    for (const workout of workouts) {
      const list = workoutsByDayId.get(workout.programDayId) || []
      list.push(workout)
      workoutsByDayId.set(workout.programDayId, list)
    }

    const daysByWeekId = new Map()
    for (const day of days) {
      const list = daysByWeekId.get(day.programWeekId) || []
      list.push({
        ...day,
        workouts: workoutsByDayId.get(day.id) || [],
      })
      daysByWeekId.set(day.programWeekId, list)
    }

    return {
      ...program,
      weeksCount: weeks.length,
      workoutsCount: workouts.length,
      weeks: weeks.map((week) => ({
        ...week,
        days: daysByWeekId.get(week.id) || [],
      })),
    }
  }

  async function listProgramsByQuery(query = {}) {
    const programRows = await request({
      table: 'programs',
      query: {
        select: 'id,athlete_id,coach_id,name,description,start_date,end_date,status',
        ...query,
      },
    })

    const programs = Array.isArray(programRows) ? programRows.map(mapProgramRow).filter(Boolean) : []
    if (programs.length === 0) return []

    const programIds = programs.map((program) => program.id).filter(Boolean)
    const [weekRows, workoutRows] = await Promise.all([
      request({
        table: 'program_weeks',
        query: {
          select: 'id,program_id',
          program_id: `in.(${programIds.join(',')})`,
        },
      }),
      request({
        table: 'program_workouts',
        query: {
          select: 'id,program_id',
          program_id: `in.(${programIds.join(',')})`,
        },
      }),
    ])

    const weekCounts = new Map()
    const workoutCounts = new Map()

    for (const row of Array.isArray(weekRows) ? weekRows : []) {
      weekCounts.set(row.program_id, (weekCounts.get(row.program_id) || 0) + 1)
    }

    for (const row of Array.isArray(workoutRows) ? workoutRows : []) {
      workoutCounts.set(row.program_id, (workoutCounts.get(row.program_id) || 0) + 1)
    }

    return programs.map((program) => ({
      ...program,
      weeksCount: weekCounts.get(program.id) || 0,
      workoutsCount: workoutCounts.get(program.id) || 0,
    }))
  }

  return {
    async listPrograms() {
      return listProgramsByQuery({
        order: 'start_date.asc',
      })
    },

    async listProgramsForAthlete(athleteId) {
      const resolvedAthleteId = normalizeCoachAthleteProfileId(athleteId)
      if (!resolvedAthleteId) return []
      return listProgramsByQuery({
        athlete_id: `eq.${resolvedAthleteId}`,
        order: 'start_date.asc',
      })
    },

    async getAssignedProgramForAthlete(athleteId) {
      const resolvedAthleteId = normalizeCoachAthleteProfileId(athleteId)
      if (!resolvedAthleteId) return null
      return getProgramTree({
        athlete_id: `eq.${resolvedAthleteId}`,
        order: 'start_date.asc',
      })
    },

    async getProgramById(programId) {
      if (!programId) return null
      return getProgramTree({
        id: `eq.${programId}`,
      })
    },

    async updateProgramWorkoutExercise({ programWorkoutExerciseId, sortOrder }) {
      if (!programWorkoutExerciseId) {
        throw new Error('updateProgramWorkoutExercise requires programWorkoutExerciseId')
      }

      const exerciseRows = await request({
        method: 'PATCH',
        table: 'program_workout_exercises',
        query: {
          id: `eq.${programWorkoutExerciseId}`,
          select: 'id,program_workout_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds',
        },
        body: {
          sort_order: sortOrder,
        },
      })

      return mapProgramWorkoutExerciseRow(Array.isArray(exerciseRows) ? exerciseRows[0] : exerciseRows)
    },

    async createProgramWorkout({ athleteId = null, coachId = null, programId = null, programDayId = null, nameSnapshot = '', notes = '', sortOrder = 1 }) {
      const resolvedAthleteId = normalizeCoachAthleteProfileId(athleteId)
      let workoutRows
      try {
        workoutRows = await request({
          method: 'POST',
          table: 'program_workouts',
          query: {
            select: PROGRAM_WORKOUT_SELECT,
          },
          body: {
            athlete_id: resolvedAthleteId,
            coach_id: coachId,
            program_id: programId,
            program_day_id: programDayId,
            workout_template_id: null,
            name_snapshot: nameSnapshot,
            notes,
            status: 'scheduled',
            sort_order: sortOrder,
          },
        })
      } catch (error) {
        if (!isMissingProgramWorkoutNotesColumnError(error) || notes) throw error
        workoutRows = await request({
          method: 'POST',
          table: 'program_workouts',
          query: {
            select: PROGRAM_WORKOUT_LEGACY_SELECT,
          },
          body: {
            athlete_id: resolvedAthleteId,
            coach_id: coachId,
            program_id: programId,
            program_day_id: programDayId,
            workout_template_id: null,
            name_snapshot: nameSnapshot,
            status: 'scheduled',
            sort_order: sortOrder,
          },
        })
      }

      return mapProgramWorkoutRow(Array.isArray(workoutRows) ? workoutRows[0] : workoutRows)
    },

    async updateProgramWorkout({ programWorkoutId, nameSnapshot = '', notes = '' }) {
      if (!programWorkoutId) {
        throw new Error('updateProgramWorkout requires programWorkoutId')
      }

      let workoutRows
      try {
        workoutRows = await request({
          method: 'PATCH',
          table: 'program_workouts',
          query: {
            id: `eq.${programWorkoutId}`,
            select: PROGRAM_WORKOUT_SELECT,
          },
          body: {
            name_snapshot: nameSnapshot,
            notes,
          },
        })
      } catch (error) {
        if (!isMissingProgramWorkoutNotesColumnError(error) || notes) throw error
        workoutRows = await request({
          method: 'PATCH',
          table: 'program_workouts',
          query: {
            id: `eq.${programWorkoutId}`,
            select: PROGRAM_WORKOUT_LEGACY_SELECT,
          },
          body: {
            name_snapshot: nameSnapshot,
          },
        })
      }

      return mapProgramWorkoutRow(Array.isArray(workoutRows) ? workoutRows[0] : workoutRows)
    },

    async createProgramWorkoutExercises({ programWorkoutId, startSortOrder = 1, exerciseRecords = [] }) {
      if (!programWorkoutId) {
        throw new Error('createProgramWorkoutExercises requires programWorkoutId')
      }

      const createdExercises = []

      for (const [index, exerciseRecord] of exerciseRecords.entries()) {
        const exerciseRows = await request({
          method: 'POST',
          table: 'program_workout_exercises',
          query: {
            select: 'id,program_workout_id,exercise_id,name_snapshot,sort_order,notes,default_rest_seconds',
          },
          body: {
            program_workout_id: programWorkoutId,
            exercise_id: exerciseRecord.exerciseId,
            name_snapshot: exerciseRecord.nameSnapshot || '',
            sort_order: startSortOrder + index,
            notes: exerciseRecord.notes || '',
            default_rest_seconds: exerciseRecord.defaultRestSeconds ?? null,
          },
        })

        const createdExercise = mapProgramWorkoutExerciseRow(Array.isArray(exerciseRows) ? exerciseRows[0] : exerciseRows)
        const createdSets = []

        for (const setRecord of Array.isArray(exerciseRecord.sets) ? exerciseRecord.sets : []) {
          const setRows = await request({
            method: 'POST',
            table: 'program_workout_sets',
            query: { select: '*' },
            body: {
              program_workout_exercise_id: createdExercise.programWorkoutExerciseId,
              sort_order: setRecord.sortOrder ?? (createdSets.length + 1),
              set_type: setRecord.setType || 'straight',
              target_reps: setRecord.reps === '' || setRecord.reps == null ? null : Number(setRecord.reps),
              target_load: setRecord.load === '' || setRecord.load == null ? null : Number(setRecord.load),
              target_load_unit: setRecord.targetLoadUnit || null,
              target_rpe: setRecord.effort === '' || setRecord.effort == null ? null : Number(setRecord.effort),
              target_rest_seconds: setRecord.prescribedRestSeconds ?? null,
              notes: setRecord.notes || '',
            },
          })

          createdSets.push(mapProgramWorkoutSetRow(Array.isArray(setRows) ? setRows[0] : setRows))
        }

        createdExercises.push({
          ...createdExercise,
          sets: createdSets,
        })
      }

      return createdExercises
    },

    async createProgramWorkoutSet({ programWorkoutExerciseId, sortOrder, sourceSet = {} }) {
      if (!programWorkoutExerciseId) {
        throw new Error('createProgramWorkoutSet requires programWorkoutExerciseId')
      }

      const setRows = await request({
        method: 'POST',
        table: 'program_workout_sets',
        query: { select: '*' },
        body: {
          program_workout_exercise_id: programWorkoutExerciseId,
          sort_order: sortOrder,
          set_type: sourceSet.setType || 'straight',
          target_reps: sourceSet.reps === '' || sourceSet.reps == null ? null : Number(sourceSet.reps),
          target_load: sourceSet.load === '' || sourceSet.load == null ? null : Number(sourceSet.load),
          target_load_unit: sourceSet.targetLoadUnit || null,
          target_rpe: sourceSet.effort === '' || sourceSet.effort == null ? null : Number(sourceSet.effort),
          target_rest_seconds: sourceSet.prescribedRestSeconds ?? null,
          notes: sourceSet.notes || '',
        },
      })

      const createdSet = mapProgramWorkoutSetRow(Array.isArray(setRows) ? setRows[0] : setRows)
      if (!createdSet?.id) {
        throw new Error('Supabase program repository failed to create program_workout_sets row')
      }

      return {
        ...createdSet,
        programWorkoutSetId: createdSet.id,
        setNumber: createdSet.sortOrder,
      }
    },

    async deleteProgramWorkout({ programWorkoutId }) {
      if (!programWorkoutId) {
        throw new Error('deleteProgramWorkout requires programWorkoutId')
      }

      await request({
        method: 'DELETE',
        table: 'program_workouts',
        query: {
          id: `eq.${programWorkoutId}`,
        },
      })

      return {
        success: true,
        programWorkoutId,
      }
    },

    async deleteProgramWorkoutSet({ programWorkoutSetId }) {
      if (!programWorkoutSetId) {
        throw new Error('deleteProgramWorkoutSet requires programWorkoutSetId')
      }

      await request({
        method: 'DELETE',
        table: 'program_workout_sets',
        query: {
          id: `eq.${programWorkoutSetId}`,
        },
      })

      return {
        success: true,
        programWorkoutSetId,
      }
    },
  }
}

export function createProgramRepository(db) {
  return {
    db,
    async listPrograms() {
      if (typeof db?.listPrograms === 'function') {
        return db.listPrograms()
      }
      return []
    },
    async getAssignedProgramForAthlete(athleteId) {
      const resolvedAthleteId = normalizeCoachAthleteProfileId(athleteId)
      if (typeof db?.getAssignedProgramForAthlete === 'function') {
        return db.getAssignedProgramForAthlete(resolvedAthleteId)
      }
      return null
    },
    async getProgramById(programId) {
      if (typeof db?.getProgramById === 'function') {
        return db.getProgramById(programId)
      }
      return null
    },
    async updateProgramWorkoutExercise(input) {
      if (typeof db?.updateProgramWorkoutExercise === 'function') {
        return db.updateProgramWorkoutExercise(input)
      }
      throw new Error('Program repository requires db.updateProgramWorkoutExercise(input) for exercise reorder workflow')
    },
    async createProgramWorkout(input) {
      if (typeof db?.createProgramWorkout === 'function') {
        return db.createProgramWorkout({
          ...input,
          athleteId: normalizeCoachAthleteProfileId(input?.athleteId),
        })
      }
      throw new Error('Program repository requires db.createProgramWorkout(input) for create-workout workflow')
    },
    async createProgramWorkoutExercises(input) {
      if (typeof db?.createProgramWorkoutExercises === 'function') {
        return db.createProgramWorkoutExercises(input)
      }
      throw new Error('Program repository requires db.createProgramWorkoutExercises(input) for add-exercise workflow')
    },
    async createProgramWorkoutSet(input) {
      if (typeof db?.createProgramWorkoutSet === 'function') {
        return db.createProgramWorkoutSet(input)
      }
      throw new Error('Program repository requires db.createProgramWorkoutSet(input) for add-set workflow')
    },
    async deleteProgramWorkout(input) {
      if (typeof db?.deleteProgramWorkout === 'function') {
        return db.deleteProgramWorkout(input)
      }
      throw new Error('Program repository requires db.deleteProgramWorkout(input) for delete-workout workflow')
    },
    async deleteProgramWorkoutSet(input) {
      if (typeof db?.deleteProgramWorkoutSet === 'function') {
        return db.deleteProgramWorkoutSet(input)
      }
      throw new Error('Program repository requires db.deleteProgramWorkoutSet(input) for delete-set workflow')
    },
  }
}
