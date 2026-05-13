import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseRestProgramRepository } from '../packages/data/src/programs/index.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseRestProgramRepository lists programs with connected week and workout counts', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      calls.push({ url: parsed.toString(), method: options.method || 'GET' })

      if (parsed.pathname.endsWith('/programs')) {
        return json([
          {
            id: 'prog-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: null,
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_weeks')) {
        return json([
          { id: 'week-1', program_id: 'prog-1' },
          { id: 'week-2', program_id: 'prog-1' },
        ])
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          { id: 'pw-1', program_id: 'prog-1' },
          { id: 'pw-2', program_id: 'prog-1' },
          { id: 'pw-3', program_id: 'prog-1' },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const programs = await repo.listPrograms()

  assert.deepEqual(programs, [
    {
      id: 'prog-1',
      athleteId: 'ath-1',
      coachId: 'coach-1',
      name: 'Training Program',
      description: null,
      startDate: '2026-05-18',
      endDate: '2026-07-27',
      status: 'active',
      weeksCount: 2,
      workoutsCount: 3,
    },
  ])
  assert.equal(calls.length, 3)
})

test('createSupabaseRestProgramRepository lists only one athlete\'s programs when the athlete-scoped profile seam requests them', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      calls.push({ url: parsed.toString(), method: options.method || 'GET' })

      if (parsed.pathname.endsWith('/programs')) {
        assert.equal(parsed.searchParams.get('athlete_id'), 'eq.ath-1')
        return json([
          {
            id: 'prog-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: null,
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_weeks')) {
        return json([
          { id: 'week-1', program_id: 'prog-1' },
        ])
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          { id: 'pw-1', program_id: 'prog-1' },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const programs = await repo.listProgramsForAthlete('ath-1')

  assert.deepEqual(programs, [
    {
      id: 'prog-1',
      athleteId: 'ath-1',
      coachId: 'coach-1',
      name: 'Training Program',
      description: null,
      startDate: '2026-05-18',
      endDate: '2026-07-27',
      status: 'active',
      weeksCount: 1,
      workoutsCount: 1,
    },
  ])
  assert.equal(calls.length, 3)
})

test('createSupabaseRestProgramRepository fetches an assigned program with nested weeks, days, workouts, and derived workout checkbox states', async () => {
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    todayIsoDate: '2026-05-21',
    fetchImpl: async (url) => {
      const parsed = new URL(url)

      if (parsed.pathname.endsWith('/programs')) {
        return json([
          {
            id: 'prog-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: null,
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_weeks')) {
        return json([
          { id: 'week-1', program_id: 'prog-1', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' },
        ])
      }

      if (parsed.pathname.endsWith('/program_days')) {
        return json([
          { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' },
          { id: 'day-2', program_week_id: 'week-1', day_index: 2, date: '2026-05-19', name: null, notes: null, status: 'training' },
          { id: 'day-3', program_week_id: 'week-1', day_index: 4, date: '2026-05-22', name: null, notes: null, status: 'training' },
        ])
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          {
            id: 'pw-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-1',
            workout_template_id: 'tpl-1',
            name_snapshot: 'Phase 3 Speed Accelerator A',
            status: 'scheduled',
            sort_order: 1,
          },
          {
            id: 'pw-2',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-2',
            workout_template_id: 'tpl-2',
            name_snapshot: 'Phase 3 Edge Work A',
            status: 'scheduled',
            sort_order: 2,
          },
          {
            id: 'pw-3',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-3',
            workout_template_id: 'tpl-3',
            name_snapshot: 'Phase 3 Speed Accelerator B',
            status: 'scheduled',
            sort_order: 3,
          },
        ])
      }

      if (parsed.pathname.endsWith('/workout_sessions')) {
        return json([
          {
            id: 'sess-1',
            program_workout_id: 'pw-1',
            status: 'completed',
            started_at: '2026-05-18T14:00:00.000Z',
            completed_at: '2026-05-18T15:00:00.000Z',
            updated_at: '2026-05-18T15:00:00.000Z',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const program = await repo.getAssignedProgramForAthlete('ath-1')

  assert.equal(program.id, 'prog-1')
  assert.equal(program.weeks.length, 1)
  assert.equal(program.weeks[0].days.length, 3)
  assert.equal(program.weeks[0].days[0].workouts.length, 1)
  assert.equal(program.weeks[0].days[0].workouts[0].nameSnapshot, 'Phase 3 Speed Accelerator A')
  assert.equal(program.weeks[0].days[0].workouts[0].status, 'completed')
  assert.equal(program.weeks[0].days[1].workouts[0].status, 'missed')
  assert.equal(program.weeks[0].days[2].workouts[0].status, 'scheduled')
})


test('createSupabaseRestProgramRepository falls back to legacy assigned-program workout selects when the live backend is missing program_workouts.notes', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    todayIsoDate: '2026-05-21',
    fetchImpl: async (url) => {
      const parsed = new URL(url)
      calls.push({ path: parsed.pathname, select: parsed.searchParams.get('select') || '' })

      if (parsed.pathname.endsWith('/programs')) {
        return json([
          {
            id: 'prog-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: null,
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_weeks')) {
        return json([
          { id: 'week-1', program_id: 'prog-1', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' },
        ])
      }

      if (parsed.pathname.endsWith('/program_days')) {
        return json([
          { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-18', name: null, notes: null, status: 'training' },
        ])
      }

      if (parsed.pathname.endsWith('/program_workouts') && (parsed.searchParams.get('select') || '').includes('notes')) {
        return json({ message: "Could not find the 'notes' column of 'program_workouts' in the schema cache" }, 400)
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          {
            id: 'pw-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-1',
            workout_template_id: 'tpl-1',
            name_snapshot: 'Phase 3 Speed Accelerator A',
            status: 'scheduled',
            sort_order: 1,
          },
        ])
      }

      if (parsed.pathname.endsWith('/workout_sessions')) {
        return json([])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const program = await repo.getAssignedProgramForAthlete('ath-1')

  assert.equal(program.id, 'prog-1')
  assert.equal(program.weeks[0].days[0].workouts[0].nameSnapshot, 'Phase 3 Speed Accelerator A')
  const workoutSelects = calls.filter((call) => call.path.endsWith('/program_workouts')).map((call) => call.select)
  assert.equal(workoutSelects[0], 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,notes,status,sort_order')
  assert.equal(workoutSelects[1], 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order')
})

test('createSupabaseRestProgramRepository fetches a program by id with nested weeks, days, and workouts', async () => {
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async (url) => {
      const parsed = new URL(url)

      if (parsed.pathname.endsWith('/programs')) {
        return json([
          {
            id: 'prog-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            name: 'Training Program',
            description: 'Off-season block',
            start_date: '2026-05-18',
            end_date: '2026-07-27',
            status: 'active',
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_weeks')) {
        return json([
          { id: 'week-1', program_id: 'prog-1', week_index: 1, name: 'Week 1', start_date: '2026-05-18', end_date: '2026-05-24' },
        ])
      }

      if (parsed.pathname.endsWith('/program_days')) {
        return json([
          { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-05-18', name: 'Monday', notes: null, status: 'training' },
        ])
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          {
            id: 'pw-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-1',
            workout_template_id: 'tpl-1',
            name_snapshot: 'Phase 3 Speed Accelerator A',
            status: 'scheduled',
            sort_order: 1,
          },
        ])
      }

      if (parsed.pathname.endsWith('/workout_sessions')) {
        return json([])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const program = await repo.getProgramById('prog-1')

  assert.equal(program.id, 'prog-1')
  assert.equal(program.description, 'Off-season block')
  assert.equal(program.weeksCount, 1)
  assert.equal(program.workoutsCount, 1)
  assert.equal(program.weeks[0].days[0].workouts[0].nameSnapshot, 'Phase 3 Speed Accelerator A')
})

test('createSupabaseRestProgramRepository can create a cloned planned set row for workout edit add-set actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workout_sets')) {
        return json([
          {
            id: 'pws-new-1',
            program_workout_exercise_id: 'pwe-1',
            sort_order: 5,
            set_type: 'straight',
            target_reps: 1,
            target_load: 0,
            target_load_unit: 'lb',
            target_rpe: 9,
            target_rir: null,
            target_rest_seconds: 30,
            notes: '',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const createdSet = await repo.createProgramWorkoutSet({
    programWorkoutExerciseId: 'pwe-1',
    sortOrder: 5,
    sourceSet: {
      setType: 'straight',
      reps: '1',
      load: '0',
      effort: '9',
      prescribedRestSeconds: 30,
      targetLoadUnit: 'lb',
      notes: '',
    },
  })

  assert.deepEqual(createdSet, {
    id: 'pws-new-1',
    programWorkoutExerciseId: 'pwe-1',
    programWorkoutSetId: 'pws-new-1',
    setNumber: 5,
    sortOrder: 5,
    setType: 'straight',
    effort: '9',
    load: '0',
    reps: '1',
    targetLoadUnit: 'lb',
    prescribedRestSeconds: 30,
    notes: '',
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].body.program_workout_exercise_id, 'pwe-1')
  assert.equal(calls[0].body.sort_order, 5)
  assert.equal(calls[0].body.target_reps, 1)
  assert.equal(calls[0].body.target_load, 0)
  assert.equal(calls[0].body.target_rpe, 9)
  assert.equal(calls[0].body.target_rest_seconds, 30)
})

test('createSupabaseRestProgramRepository can create a real planned workout for coach-side create-workout actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([
          {
            id: 'pw-created-1',
            athlete_id: 'ath-1',
            coach_id: 'coach-1',
            program_id: 'prog-1',
            program_day_id: 'day-1',
            workout_template_id: null,
            name_snapshot: '',
            status: 'scheduled',
            sort_order: 3,
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const createdWorkout = await repo.createProgramWorkout({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'prog-1',
    programDayId: 'day-1',
    nameSnapshot: '',
    sortOrder: 3,
  })

  assert.equal(createdWorkout.id, 'pw-created-1')
  assert.equal(createdWorkout.programDayId, 'day-1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].body.program_day_id, 'day-1')
  assert.equal(calls[0].body.status, 'scheduled')
  assert.equal(calls[0].body.sort_order, 3)
})

test('createSupabaseRestProgramRepository can create planned workout exercises with linked default sets for workout edit add-exercise actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workout_exercises')) {
        return json([
          {
            id: 'pwe-created-1',
            program_workout_id: 'pw-created-1',
            exercise_id: 'exercise-1',
            name_snapshot: '1-Arm DB Row',
            sort_order: 1,
            notes: '',
            default_rest_seconds: 75,
          },
        ])
      }

      if (parsed.pathname.endsWith('/program_workout_sets')) {
        return json([
          {
            id: 'pws-created-1',
            program_workout_exercise_id: 'pwe-created-1',
            sort_order: 1,
            set_type: 'straight',
            target_reps: 8,
            target_load: 0,
            target_load_unit: 'lb',
            target_rpe: 7,
            target_rir: null,
            target_rest_seconds: 75,
            notes: '',
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const createdExercises = await repo.createProgramWorkoutExercises({
    programWorkoutId: 'pw-created-1',
    startSortOrder: 1,
    exerciseRecords: [
      {
        exerciseId: 'exercise-1',
        nameSnapshot: '1-Arm DB Row',
        defaultRestSeconds: 75,
        notes: '',
        sets: [
          { sortOrder: 1, setType: 'straight', reps: '8', load: '0', effort: '7', targetLoadUnit: 'lb', prescribedRestSeconds: 75, notes: '' },
        ],
      },
    ],
  })

  assert.equal(createdExercises.length, 1)
  assert.equal(createdExercises[0].programWorkoutExerciseId, 'pwe-created-1')
  assert.equal(createdExercises[0].sets.length, 1)
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].body.program_workout_id, 'pw-created-1')
  assert.equal(calls[0].body.exercise_id, 'exercise-1')
  assert.equal(calls[1].method, 'POST')
  assert.equal(calls[1].body.program_workout_exercise_id, 'pwe-created-1')
})

test('createSupabaseRestProgramRepository can update a planned workout exercise sort order for workout edit reordering', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workout_exercises')) {
        return json([
          {
            id: 'pwe-1',
            program_workout_id: 'pw-1',
            exercise_id: 'ex-1',
            name_snapshot: 'Sprint [1/2 Kneel Start]',
            sort_order: 2,
            notes: '',
            default_rest_seconds: 30,
          },
        ])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const updatedExercise = await repo.updateProgramWorkoutExercise({
    programWorkoutExerciseId: 'pwe-1',
    sortOrder: 2,
  })

  assert.equal(updatedExercise.programWorkoutExerciseId, 'pwe-1')
  assert.equal(updatedExercise.sortOrder, 2)
  assert.equal(updatedExercise.nameSnapshot, 'Sprint [1/2 Kneel Start]')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.sort_order, 2)
  assert.equal(calls[0].url.includes('/rest/v1/program_workout_exercises'), true)
})

test('createSupabaseRestProgramRepository can update a planned workout name snapshot for workout edit save actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-created-1', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Custom workout name', status: 'scheduled', sort_order: 1 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const updatedWorkout = await repo.updateProgramWorkout({
    programWorkoutId: 'pw-created-1',
    nameSnapshot: 'Custom workout name',
  })

  assert.equal(updatedWorkout.id, 'pw-created-1')
  assert.equal(updatedWorkout.nameSnapshot, 'Custom workout name')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.name_snapshot, 'Custom workout name')
  assert.equal(new URL(calls[0].url).searchParams.get('id'), 'eq.pw-created-1')
})

test('createSupabaseRestProgramRepository can create a planned workout with a real persisted default name', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-created-2', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Untitled Workout 3', notes: '', status: 'scheduled', sort_order: 3 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const createdWorkout = await repo.createProgramWorkout({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    nameSnapshot: 'Untitled Workout 3',
    notes: '',
    sortOrder: 3,
  })

  assert.equal(createdWorkout.id, 'pw-created-2')
  assert.equal(createdWorkout.nameSnapshot, 'Untitled Workout 3')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].body.name_snapshot, 'Untitled Workout 3')
  assert.equal(calls[0].body.notes, '')
  assert.equal(calls[0].body.sort_order, 3)
})

test('createSupabaseRestProgramRepository can update planned workout name and notes together for workout edit save actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-created-1', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Custom workout name', notes: 'Keep transitions tight', status: 'scheduled', sort_order: 1 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const updatedWorkout = await repo.updateProgramWorkout({
    programWorkoutId: 'pw-created-1',
    nameSnapshot: 'Custom workout name',
    notes: 'Keep transitions tight',
  })

  assert.equal(updatedWorkout.id, 'pw-created-1')
  assert.equal(updatedWorkout.nameSnapshot, 'Custom workout name')
  assert.equal(updatedWorkout.notes, 'Keep transitions tight')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.name_snapshot, 'Custom workout name')
  assert.equal(calls[0].body.notes, 'Keep transitions tight')
  assert.equal(new URL(calls[0].url).searchParams.get('id'), 'eq.pw-created-1')
})

test('createSupabaseRestProgramRepository can update planned workout name and notes together for workout edit save actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-created-1', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Custom workout name', notes: 'Keep transitions tight', status: 'scheduled', sort_order: 1 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const updatedWorkout = await repo.updateProgramWorkout({
    programWorkoutId: 'pw-created-1',
    nameSnapshot: 'Custom workout name',
    notes: 'Keep transitions tight',
  })

  assert.equal(updatedWorkout.id, 'pw-created-1')
  assert.equal(updatedWorkout.nameSnapshot, 'Custom workout name')
  assert.equal(updatedWorkout.notes, 'Keep transitions tight')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.name_snapshot, 'Custom workout name')
  assert.equal(calls[0].body.notes, 'Keep transitions tight')
  assert.equal(new URL(calls[0].url).searchParams.get('id'), 'eq.pw-created-1')
})

test('createSupabaseRestProgramRepository falls back to legacy create-workout payloads when the live backend is missing program_workouts.notes', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts') && calls.length === 1) {
        return json({ message: "Could not find the 'notes' column of 'program_workouts' in the schema cache" }, 400)
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-created-legacy', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Untitled Workout 4', status: 'scheduled', sort_order: 4 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const createdWorkout = await repo.createProgramWorkout({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    programId: 'program-1',
    programDayId: 'day-1',
    nameSnapshot: 'Untitled Workout 4',
    notes: '',
    sortOrder: 4,
  })

  assert.equal(createdWorkout.id, 'pw-created-legacy')
  assert.equal(createdWorkout.nameSnapshot, 'Untitled Workout 4')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].body.notes, '')
  assert.equal(calls[1].body.notes, undefined)
  assert.equal(new URL(calls[1].url).searchParams.get('select'), 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order')
})

test('createSupabaseRestProgramRepository falls back to legacy workout save payloads when the live backend is missing program_workouts.notes', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ url: parsed.toString(), method: options.method || 'GET', body })

      if (parsed.pathname.endsWith('/program_workouts') && calls.length === 1) {
        return json({ message: "Could not find the 'notes' column of 'program_workouts' in the schema cache" }, 400)
      }

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([{ id: 'pw-legacy-save', athlete_id: 'ath-1', coach_id: 'coach-1', program_id: 'program-1', program_day_id: 'day-1', workout_template_id: null, name_snapshot: 'Renamed workout', status: 'scheduled', sort_order: 1 }])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const updatedWorkout = await repo.updateProgramWorkout({
    programWorkoutId: 'pw-legacy-save',
    nameSnapshot: 'Renamed workout',
    notes: '',
  })

  assert.equal(updatedWorkout.id, 'pw-legacy-save')
  assert.equal(updatedWorkout.nameSnapshot, 'Renamed workout')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].body.notes, '')
  assert.equal(calls[1].body.notes, undefined)
  assert.equal(new URL(calls[1].url).searchParams.get('select'), 'id,athlete_id,coach_id,program_id,program_day_id,workout_template_id,name_snapshot,status,sort_order')
})

test('createSupabaseRestProgramRepository can delete a planned workout row for workout edit delete actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      calls.push({ url: parsed.toString(), method: options.method || 'GET' })

      if (parsed.pathname.endsWith('/program_workouts')) {
        return json([])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const result = await repo.deleteProgramWorkout({ programWorkoutId: 'pw-delete-1' })

  assert.deepEqual(result, { success: true, programWorkoutId: 'pw-delete-1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'DELETE')
  const deleteUrl = new URL(calls[0].url)
  assert.equal(deleteUrl.pathname.endsWith('/program_workouts'), true)
  assert.equal(deleteUrl.searchParams.get('id'), 'eq.pw-delete-1')
})

test('createSupabaseRestProgramRepository can delete a planned set row for workout edit swipe-delete actions', async () => {
  const calls = []
  const repo = createSupabaseRestProgramRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsed = new URL(url)
      calls.push({
        url: parsed.toString(),
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : null,
      })

      if (parsed.pathname.endsWith('/program_workout_sets')) {
        return json([])
      }

      throw new Error(`Unexpected request: ${parsed.pathname}`)
    },
  })

  const result = await repo.deleteProgramWorkoutSet({
    programWorkoutSetId: 'pws-new-1',
  })

  assert.deepEqual(result, { success: true, programWorkoutSetId: 'pws-new-1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'DELETE')
  assert.equal(new URL(calls[0].url).searchParams.get('id'), 'eq.pws-new-1')
})
