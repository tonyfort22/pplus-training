import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'
import { createProgramPlannerFromAdminProgram } from '../apps/web/components/admin/program-planner-utils.js'

const repoRoot = resolve(import.meta.dirname, '..')
const plannerRoutePath = resolve(repoRoot, 'apps/web/app/admin/programs/[programId]/page.jsx')

function withPlannerDetailFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    requests.push({ url: requestUrl, method })

    if (method === 'GET' && requestUrl.includes('/programs?select=id,athlete_id,coach_id,name,description,start_date,end_date,status,created_at,athlete_profiles')) {
      return Response.json([
        {
          id: 'program-detail-1',
          athlete_id: 'athlete-1',
          coach_id: 'coach-1',
          name: 'Detail route strength block',
          description: 'Planner route should keep the real DB-backed nested shape.',
          start_date: '2026-08-03',
          end_date: '2026-08-16',
          status: 'active',
          created_at: '2026-06-20T12:00:00.000Z',
          athlete_profiles: { first_name: 'Avery', last_name: 'Adams' },
        },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_weeks?') && requestUrl.includes('program_id=eq.program-detail-1')) {
      return Response.json([
        { id: 'week-1', program_id: 'program-detail-1', week_index: 1, name: 'Week 1', start_date: '2026-08-03', end_date: '2026-08-09' },
        { id: 'week-2', program_id: 'program-detail-1', week_index: 2, name: 'Week 2', start_date: '2026-08-10', end_date: '2026-08-16' },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_days?')) {
      return Response.json([
        { id: 'day-1', program_week_id: 'week-1', day_index: 1, date: '2026-08-03', name: 'Day 1', notes: 'Heavy lower', status: 'training' },
        { id: 'day-3', program_week_id: 'week-1', day_index: 3, date: '2026-08-05', name: 'Day 3', notes: 'Recovery', status: 'recovery' },
        { id: 'day-8', program_week_id: 'week-2', day_index: 1, date: '2026-08-10', name: 'Day 1', notes: 'Speed', status: 'training' },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workouts?') && requestUrl.includes('program_id=eq.program-detail-1')) {
      return Response.json([
        {
          id: 'workout-1',
          athlete_id: 'athlete-1',
          coach_id: 'coach-1',
          program_id: 'program-detail-1',
          program_day_id: 'day-1',
          workout_template_id: 'template-1',
          name_snapshot: 'Acceleration lift',
          notes: 'Keep reps crisp.',
          bg_color: '#102030',
          text_color: '#F8FAFC',
          status: 'scheduled',
          sort_order: 2,
          scheduled_date: '2026-08-03',
          scheduled_start_time: '09:00',
          scheduled_end_time: '10:00',
          created_at: '2026-06-20T12:00:00.000Z',
          updated_at: '2026-06-20T12:05:00.000Z',
          import_source: 'ai_pdf',
          import_source_file_name: 'speed-block.pdf',
          workout_templates: {
            name: 'Speed template',
            description: 'Template fallback note.',
            training_type: 'Speed Accelerator',
            bg_color: '#334455',
            text_color: '#FFFFFF',
            estimated_duration_minutes: 60,
            thumbnail_url: null,
            status: 'active',
          },
        },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_blocks?')) {
      return Response.json([
        { id: 'block-1', program_workout_id: 'workout-1', block_code: 'A', title: 'Acceleration', instructions: 'Sprint primer', sort_order: 1 },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_exercises?')) {
      return Response.json([
        { id: 'exercise-1', program_workout_id: 'workout-1', program_workout_block_id: 'block-1', exercise_id: 'library-exercise-1', name_snapshot: 'Trap bar deadlift', sort_order: 1, notes: 'Explode up.', default_rest_seconds: 120 },
      ])
    }

    if (method === 'GET' && requestUrl.includes('/program_workout_sets?')) {
      return Response.json([
        { id: 'set-1', program_workout_exercise_id: 'exercise-1', sort_order: 1, set_type: 'working', target_reps: 4, target_load: 225, target_load_unit: 'lb', target_duration_seconds: null, target_distance: null, target_distance_unit: null, target_rpe: 8, target_rir: 2, target_rest_seconds: 120, notes: 'fast concentric' },
      ])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  return Promise.resolve()
    .then(() => callback({ requests }))
    .finally(() => {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL
      else process.env.SUPABASE_URL = previousUrl
      if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
      globalThis.fetch = previousFetch
    })
}

test('program detail route source uses the DB-backed planner mapper before local seed fallback', () => {
  const source = readFileSync(plannerRoutePath, 'utf8')

  assert.match(source, /export const dynamic = 'force-dynamic'/)
  assert.match(source, /const repository = createAdminProgramRepository\(\)/)
  assert.match(source, /adminProgram = await repository\.getProgramById\(programId\)/)
  assert.match(source, /program = createProgramPlannerFromAdminProgram\(adminProgram\)/)
  assert.match(source, /isLocalSeedPlanner = false/)
  assert.match(source, /contentOverride=\{<ProgramPlannerView program=\{program\} enableLocalAiImportPersistence=\{isLocalSeedPlanner\} \/>\}/)
})

test('program detail planner data shape keeps DB ids, fixed day lanes, workout cards, blocks, exercises, and sets', async () => {
  await withPlannerDetailFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()
    const adminProgram = await repository.getProgramById('program-detail-1')
    const planner = createProgramPlannerFromAdminProgram(adminProgram)

    const programLookup = requests.find((request) => request.url.includes('/programs?select=id,athlete_id,coach_id,name'))
    const setLookup = requests.find((request) => request.url.includes('/program_workout_sets?'))

    assert.ok(programLookup)
    assert.ok(setLookup)
    assert.equal(planner.id, 'program-detail-1')
    assert.equal(planner.title, 'Detail route strength block')
    assert.equal(planner.athleteLabel, 'Avery Adams')
    assert.equal(planner.duration, '2 weeks')
    assert.equal(planner.weekCount, 2)
    assert.equal(planner.weeks.length, 2)
    assert.equal(planner.weeks[0].programWeekId, 'week-1')
    assert.deepEqual(planner.weeks[0].daySlots.map((day) => day.label), ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'])
    assert.equal(planner.weeks[0].daySlots[0].programDayId, 'day-1')
    assert.equal(planner.weeks[0].daySlots[0].programWeekId, 'week-1')
    assert.equal(planner.weeks[0].daySlots[1].programDayId, null)
    assert.equal(planner.weeks[0].daySlots[2].programDayId, 'day-3')
    assert.equal(planner.weeks[0].daySlots[2].focus, 'Recovery')

    const workout = planner.weeks[0].daySlots[0].workouts[0]
    assert.deepEqual({
      id: workout.id,
      programWorkoutId: workout.programWorkoutId,
      programDayId: workout.programDayId,
      title: workout.title,
      source: workout.source,
      sourceFileName: workout.sourceFileName,
      blockLabel: workout.blockLabel,
      blockBgColor: workout.blockBgColor,
      blockTextColor: workout.blockTextColor,
      duration: workout.duration,
      status: workout.status,
      coachNote: workout.coachNote,
      programBlocks: workout.programBlocks,
      sections: workout.sections,
    }, {
      id: 'workout-1',
      programWorkoutId: 'workout-1',
      programDayId: 'day-1',
      title: 'Acceleration lift',
      source: 'ai_pdf',
      sourceFileName: 'speed-block.pdf',
      blockLabel: 'Speed Accelerator',
      blockBgColor: '#102030',
      blockTextColor: '#F8FAFC',
      duration: '60 min',
      status: 'scheduled',
      coachNote: 'Keep reps crisp.',
      programBlocks: [
        { id: 'block-1', title: 'Acceleration', description: 'Sprint primer' },
      ],
      sections: [
        {
          id: 'block-1',
          title: 'Acceleration',
          description: 'Sprint primer',
          exercises: [
            {
              id: 'exercise-1',
              title: 'Trap bar deadlift',
              instruction: 'Explode up.',
              sets: [
                { id: 'set-1', reps: '4', duration: '', distance: '', effort: '8', rest: '120s', tempo: 'fast concentric', side: '' },
              ],
            },
          ],
        },
      ],
    })
  })
})
