import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminDashboardRepository } from '../apps/web/lib/admin-dashboard-repository.js'

const now = new Date('2026-05-30T16:00:00.000Z')

function createFetchMock(tableRows) {
  return async (url) => {
    const pathname = new URL(String(url)).pathname
    const table = pathname.split('/').pop()
    if (!(table in tableRows)) {
      return new Response(JSON.stringify({ error: `unexpected table ${table}` }), { status: 404 })
    }
    return new Response(JSON.stringify(tableRows[table]), { status: 200 })
  }
}

function createRepository(tableRows) {
  return createAdminDashboardRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: createFetchMock(tableRows),
    now,
  })
}

test('dashboard KPI fixture-data states use semantic coverage badges and unique library counts', async () => {
  const overview = await createRepository({
    athlete_profiles: [
      { id: 'athlete-active-1', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'athlete-active-2', status: 'active', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'athlete-inactive', status: 'inactive', created_at: '2026-05-03T10:00:00.000Z' },
      { id: 'athlete-archived', status: 'archived', created_at: '2026-05-04T10:00:00.000Z' },
    ],
    programs: [
      { id: 'program-speed', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'program-strength', status: 'active', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'program-archived', status: 'archived', created_at: '2026-05-03T10:00:00.000Z' },
    ],
    workout_templates: [
      { id: 'template-speed-a', name: 'Speed A', training_type: 'Speed', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'template-speed-b', name: 'Speed B', training_type: 'Speed', status: 'active', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'template-strength', name: 'Strength', training_type: 'Strength', status: 'active', created_at: '2026-05-03T10:00:00.000Z' },
      { id: 'template-archived', name: 'Archived', training_type: 'Archived', status: 'archived', created_at: '2026-05-04T10:00:00.000Z' },
    ],
    exercises: [
      { id: 'exercise-a', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'exercise-b', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'exercise-c', created_at: '2026-05-03T10:00:00.000Z' },
      { id: 'exercise-d', created_at: '2026-05-04T10:00:00.000Z' },
    ],
    workout_template_exercises: [
      { id: 'wte-speed-a-1', workout_template_id: 'template-speed-a', exercise_id: 'exercise-a' },
      { id: 'wte-speed-a-duplicate', workout_template_id: 'template-speed-a', exercise_id: 'exercise-a' },
      { id: 'wte-speed-b-2', workout_template_id: 'template-speed-b', exercise_id: 'exercise-b' },
      { id: 'wte-archived-only', workout_template_id: 'template-archived', exercise_id: 'exercise-c' },
      { id: 'wte-missing-exercise', workout_template_id: 'template-speed-b', exercise_id: 'exercise-missing' },
    ],
    program_workouts: [
      { id: 'assignment-speed-a-1', athlete_id: 'athlete-active-1', program_id: 'program-speed', workout_template_id: 'template-speed-a', status: 'scheduled', scheduled_date: '2026-05-10', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'assignment-speed-a-2', athlete_id: 'athlete-active-2', program_id: 'program-speed', workout_template_id: 'template-speed-a', status: 'scheduled', scheduled_date: '2026-05-11', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'assignment-strength', athlete_id: 'athlete-active-1', program_id: 'program-strength', workout_template_id: 'template-strength', status: 'scheduled', scheduled_date: '2026-05-12', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'assignment-archived-program', athlete_id: 'athlete-active-1', program_id: 'program-archived', workout_template_id: 'template-archived', status: 'scheduled', scheduled_date: '2026-05-13', created_at: '2026-05-01T10:00:00.000Z' },
    ],
    workout_sessions: [],
    athlete_invitations: [
      { id: 'invite-used-1', used_at: '2026-05-10T10:00:00.000Z', revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'invite-used-2', used_at: '2026-05-11T10:00:00.000Z', revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'invite-pending', used_at: null, revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-03T10:00:00.000Z' },
    ],
  }).getOverview({ range: 'last-month' })

  assert.deepEqual(overview.summary.athletes, {
    id: 'athletes',
    label: 'Athletes',
    value: '4',
    change: '50% active',
    changeDirection: 'positive',
    footerHeadline: 'Total athletes',
    footerSubtext: '2 active athletes',
  })

  assert.deepEqual(overview.summary.programs, {
    id: 'programs',
    label: 'Programs',
    value: '2',
    change: '100% assigned',
    changeDirection: 'positive',
    footerHeadline: 'Total programs',
    footerSubtext: '2 of 2 assigned programs',
  })

  assert.deepEqual(overview.summary.workouts, {
    id: 'workouts',
    label: 'Workouts',
    value: '3',
    change: '67% assigned',
    changeDirection: 'positive',
    footerHeadline: 'Total workouts',
    footerSubtext: '2 of 3 assigned workouts',
  })

  assert.deepEqual(overview.summary.exercises, {
    id: 'exercises',
    label: 'Exercises',
    value: '4',
    change: '50% used',
    changeDirection: 'positive',
    footerHeadline: 'Total exercises',
    footerSubtext: '2 of 4 used in workouts',
  })

  assert.deepEqual(overview.summary.invites, {
    id: 'invites',
    label: 'Invites',
    value: '3',
    change: '67% accepted',
    changeDirection: 'positive',
    footerHeadline: 'Total athlete invites',
    footerSubtext: '2 of 3 accepted invites',
  })
})
