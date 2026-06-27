import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ADMIN_TEST_RECORD_CLEANUP_TARGETS,
  createAdminTestRecordCleanup,
} from '../apps/web/lib/admin-test-record-cleanup.js'

test('admin test record cleanup only deletes exact known program, workout template, exercise, athlete, group, and invite test records', async () => {
  const calls = []
  const data = {
    programs: [
      { id: 'program-created', name: 'Test Workflow Program' },
      { id: 'program-updated', name: 'Updated Test Workflow Program' },
      { id: 'program-duplicate-copy', name: 'Test Duplicable Program copy' },
      { id: 'program-real', name: 'Real Test Program' },
    ],
    workout_templates: [
      { id: 'workout-template-created', name: 'Test Workflow Workout Template' },
      { id: 'workout-template-updated', name: 'Updated Workflow Workout Template' },
      { id: 'workout-template-real', name: 'Real Test Workflow Workout Template' },
    ],
    exercises: [
      { id: 'exercise-created', name: 'Test Workflow Exercise' },
      { id: 'exercise-updated', name: 'Updated Workflow Exercise' },
      { id: 'exercise-delete-archive-seed', name: 'Lateral bound stick' },
      { id: 'exercise-real', name: 'Real Test Workflow Exercise' },
    ],
    athlete_profiles: [
      { id: 'athlete-testy', user_id: 'auth-testy', first_name: 'Testy', last_name: 'McAthlete' },
      { id: 'athlete-real', user_id: 'auth-real', first_name: 'Test', last_name: 'Real Athlete' },
    ],
    athlete_groups: [
      { id: 'group-test', name: 'Test Workflow Group' },
      { id: 'group-updated', name: 'Updated Workflow Group' },
      { id: 'group-real', name: 'Real Test Group' },
    ],
    athlete_invitations: [
      { id: 'invite-testy', invitee_email: 'testy.mcathlete+workflow@example.com', athlete_profile_id: 'athlete-testy' },
      { id: 'invite-safe', invitee_email: 'pplus.safe+invite.workflow@example.com', athlete_profile_id: 'athlete-safe' },
      { id: 'invite-linked', invitee_email: 'other@example.com', athlete_profile_id: 'athlete-testy' },
      { id: 'invite-real', invitee_email: 'test@example.com', athlete_profile_id: 'athlete-real' },
    ],
  }

  const cleanup = createAdminTestRecordCleanup({
    async listTable(table) {
      calls.push(['listTable', table])
      return data[table] ?? []
    },
    async deleteTable(table, ids, key = 'id') {
      calls.push(['deleteTable', table, key, ids])
      return ids.map((id) => ({ id }))
    },
    async deleteAuthUser(userId) {
      calls.push(['deleteAuthUser', userId])
      return { id: userId }
    },
  })

  const result = await cleanup.cleanupKnownTestRecords()

  assert.deepEqual(ADMIN_TEST_RECORD_CLEANUP_TARGETS.athleteNames, [
    { firstName: 'Testy', lastName: 'McAthlete' },
  ])
  assert.deepEqual(ADMIN_TEST_RECORD_CLEANUP_TARGETS.workoutTemplateNames, [
    'Test Workflow Workout Template',
    'Updated Workflow Workout Template',
  ])
  assert.deepEqual(ADMIN_TEST_RECORD_CLEANUP_TARGETS.exerciseNames, [
    'Test Workflow Exercise',
    'Updated Workflow Exercise',
    'Lateral bound stick',
  ])
  assert.deepEqual(result, {
    programs: { ids: ['program-created', 'program-updated', 'program-duplicate-copy'], deletedCount: 3 },
    workoutTemplates: { ids: ['workout-template-created', 'workout-template-updated'], deletedCount: 2 },
    exercises: { ids: ['exercise-created', 'exercise-updated', 'exercise-delete-archive-seed'], deletedCount: 3 },
    athletes: { ids: ['athlete-testy'], deletedCount: 1 },
    groups: { ids: ['group-test', 'group-updated'], deletedCount: 2 },
    invites: { ids: ['invite-testy', 'invite-safe', 'invite-linked'], deletedCount: 3 },
    authUsers: { ids: ['auth-testy'], deletedCount: 1 },
  })
  assert.deepEqual(calls, [
    ['listTable', 'programs'],
    ['listTable', 'workout_templates'],
    ['listTable', 'exercises'],
    ['listTable', 'athlete_profiles'],
    ['listTable', 'athlete_groups'],
    ['listTable', 'athlete_invitations'],
    ['deleteTable', 'athlete_group_memberships', 'athlete_group_id', ['group-test', 'group-updated']],
    ['deleteTable', 'athlete_group_memberships', 'athlete_id', ['athlete-testy']],
    ['deleteTable', 'athlete_invitations', 'id', ['invite-testy', 'invite-safe', 'invite-linked']],
    ['deleteTable', 'exercise_muscle_maps', 'exercise_id', ['exercise-created', 'exercise-updated', 'exercise-delete-archive-seed']],
    ['deleteTable', 'exercise_sets', 'exercise_id', ['exercise-created', 'exercise-updated', 'exercise-delete-archive-seed']],
    ['deleteTable', 'exercises', 'id', ['exercise-created', 'exercise-updated', 'exercise-delete-archive-seed']],
    ['deleteTable', 'workout_templates', 'id', ['workout-template-created', 'workout-template-updated']],
    ['deleteTable', 'programs', 'id', ['program-created', 'program-updated', 'program-duplicate-copy']],
    ['deleteTable', 'athlete_groups', 'id', ['group-test', 'group-updated']],
    ['deleteTable', 'athlete_profiles', 'id', ['athlete-testy']],
    ['deleteAuthUser', 'auth-testy'],
  ])
})

test('admin test record cleanup returns zero counts without delete calls when no known test records exist', async () => {
  const calls = []
  const cleanup = createAdminTestRecordCleanup({
    async listTable(table) {
      calls.push(['listTable', table])
      return []
    },
    async deleteTable(table, ids) {
      calls.push(['deleteTable', table, ids])
      return []
    },
    async deleteAuthUser(userId) {
      calls.push(['deleteAuthUser', userId])
      return { id: userId }
    },
  })

  const result = await cleanup.cleanupKnownTestRecords()

  assert.deepEqual(result, {
    programs: { ids: [], deletedCount: 0 },
    workoutTemplates: { ids: [], deletedCount: 0 },
    exercises: { ids: [], deletedCount: 0 },
    athletes: { ids: [], deletedCount: 0 },
    groups: { ids: [], deletedCount: 0 },
    invites: { ids: [], deletedCount: 0 },
    authUsers: { ids: [], deletedCount: 0 },
  })
  assert.deepEqual(calls, [
    ['listTable', 'programs'],
    ['listTable', 'workout_templates'],
    ['listTable', 'exercises'],
    ['listTable', 'athlete_profiles'],
    ['listTable', 'athlete_groups'],
    ['listTable', 'athlete_invitations'],
  ])
})
