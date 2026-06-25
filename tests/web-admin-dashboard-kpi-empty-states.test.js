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

function emptyDashboardRows() {
  return {
    athlete_profiles: [],
    programs: [],
    workout_templates: [],
    exercises: [],
    workout_template_exercises: [],
    program_workouts: [],
    workout_sessions: [],
    athlete_invitations: [],
  }
}

test('dashboard KPI empty states stay neutral and avoid zero-of-zero coverage copy', async () => {
  const overview = await createRepository(emptyDashboardRows()).getOverview({ range: 'last-month' })

  assert.deepEqual(overview.summary.athletes, {
    id: 'athletes',
    label: 'Athletes',
    value: '0',
    change: '0% active',
    changeDirection: 'neutral',
    footerHeadline: 'No athletes yet',
    footerSubtext: '0 active athletes',
  })

  assert.deepEqual(overview.summary.programs, {
    id: 'programs',
    label: 'Programs',
    value: '0',
    change: '0% assigned',
    changeDirection: 'neutral',
    footerHeadline: 'No programs yet',
    footerSubtext: 'No assigned programs yet',
  })

  assert.deepEqual(overview.summary.workouts, {
    id: 'workouts',
    label: 'Workouts',
    value: '0',
    change: '0% assigned',
    changeDirection: 'neutral',
    footerHeadline: 'No workouts yet',
    footerSubtext: 'No assigned workouts yet',
  })

  assert.deepEqual(overview.summary.exercises, {
    id: 'exercises',
    label: 'Exercises',
    value: '0',
    change: '0% used',
    changeDirection: 'neutral',
    footerHeadline: 'No exercises yet',
    footerSubtext: 'No exercises used in workouts yet',
  })

  assert.deepEqual(overview.summary.invites, {
    id: 'invites',
    label: 'Invites',
    value: '0',
    change: '0% accepted',
    changeDirection: 'neutral',
    footerHeadline: 'No invites yet',
    footerSubtext: 'No accepted invites yet',
  })
})
