import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupabaseRestGroupRepository } from '../packages/data/src/groups/index.js'

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: async () => JSON.stringify(payload),
  }
}

test('mobile groups repository reads RLS-scoped athlete_groups without over-filtering by coach or status', async () => {
  const calls = []
  const repository = createSupabaseRestGroupRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      calls.push({ table, query: parsedUrl.searchParams.toString() })

      if (table === 'athlete_groups') {
        return json([
          { id: 'group-a', coach_id: 'coach-1', name: 'AAA Group', description: '', access_level: 'private', status: null, created_at: '2026-06-01T00:00:00.000Z', updated_at: null },
          { id: 'group-b', coach_id: 'coach-1', name: 'Skate Group', description: '', access_level: 'private', status: 'active', created_at: '2026-06-02T00:00:00.000Z', updated_at: null },
        ])
      }

      if (table === 'athlete_group_memberships') {
        return json([
          { id: 'membership-1', athlete_group_id: 'group-a', athlete_id: 'ath-1' },
          { id: 'membership-2', athlete_group_id: 'group-b', athlete_id: 'ath-2' },
          { id: 'membership-3', athlete_group_id: 'group-b', athlete_id: 'ath-3' },
        ])
      }

      return json([])
    },
  })

  const groups = await repository.listGroupsForCoach('coach-1')
  const groupsCall = calls.find((call) => call.table === 'athlete_groups')

  assert.equal(groups.length, 2)
  assert.equal(groups[0].name, 'AAA Group')
  assert.equal(groups[0].athleteCountLabel, '1 athlete')
  assert.equal(groups[1].athleteCountLabel, '2 athletes')
  assert.equal(groupsCall.query.includes('coach_id='), false)
  assert.equal(groupsCall.query.includes('status='), false)
})

test('mobile groups repository still returns groups when membership counts are unavailable', async () => {
  const repository = createSupabaseRestGroupRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url) => {
      const table = new URL(url).pathname.split('/').pop()
      if (table === 'athlete_groups') {
        return json([{ id: 'group-a', name: 'AAA Group', status: 'active' }])
      }
      if (table === 'athlete_group_memberships') {
        return json({ message: 'Could not find the table athlete_group_memberships' }, 404)
      }
      return json([])
    },
  })

  const groups = await repository.listGroupsForCoach('coach-1')

  assert.equal(groups.length, 1)
  assert.equal(groups[0].name, 'AAA Group')
  assert.equal(groups[0].athleteCountLabel, '0 athletes')
})

test('mobile groups repository creates athlete_groups rows and syncs selected athlete memberships', async () => {
  const calls = []
  const repository = createSupabaseRestGroupRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ table, method: options.method, query: parsedUrl.searchParams.toString(), body, prefer: options.headers?.Prefer })

      if (table === 'athlete_groups' && options.method === 'POST') {
        return json([{ id: 'group-created', coach_id: 'coach-1', name: body.name, status: 'active', access_level: 'private' }], 201)
      }
      if (table === 'athlete_group_memberships' && options.method === 'DELETE') {
        return json([], 200)
      }
      if (table === 'athlete_group_memberships' && options.method === 'POST') {
        return json(body.map((row, index) => ({ id: `membership-${index + 1}`, ...row })), 201)
      }
      return json([])
    },
  })

  const group = await repository.createGroup({ coachId: 'coach-1', name: 'Speed Group', athleteIds: ['ath-1', 'ath-2'] })

  assert.equal(group.id, 'group-created')
  assert.equal(group.name, 'Speed Group')
  assert.equal(group.athleteCountLabel, '2 athletes')
  assert.deepEqual(calls.map((call) => `${call.method}:${call.table}`), [
    'POST:athlete_groups',
    'DELETE:athlete_group_memberships',
    'POST:athlete_group_memberships',
  ])
  assert.deepEqual(calls[0].body, { coach_id: 'coach-1', name: 'Speed Group', access_level: 'private', status: 'active' })
  assert.match(calls[1].query, /athlete_group_id=eq\.group-created/)
  assert.deepEqual(calls[2].body, [
    { athlete_group_id: 'group-created', athlete_id: 'ath-1' },
    { athlete_group_id: 'group-created', athlete_id: 'ath-2' },
  ])
})

test('mobile groups repository updates an existing group and replaces memberships', async () => {
  const calls = []
  const repository = createSupabaseRestGroupRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').pop()
      const body = options.body ? JSON.parse(options.body) : null
      calls.push({ table, method: options.method, query: parsedUrl.searchParams.toString(), body })

      if (table === 'athlete_groups' && options.method === 'PATCH') {
        return json([{ id: 'group-existing', coach_id: 'coach-1', name: body.name, status: 'active', access_level: 'private' }])
      }
      if (table === 'athlete_group_memberships' && options.method === 'DELETE') {
        return json([], 200)
      }
      if (table === 'athlete_group_memberships' && options.method === 'POST') {
        return json(body.map((row, index) => ({ id: `membership-${index + 1}`, ...row })), 201)
      }
      return json([])
    },
  })

  const group = await repository.updateGroup({ groupId: 'group-existing', name: 'Updated Group', athleteIds: ['ath-2'] })

  assert.equal(group.id, 'group-existing')
  assert.equal(group.name, 'Updated Group')
  assert.equal(group.athleteCountLabel, '1 athlete')
  assert.deepEqual(calls.map((call) => `${call.method}:${call.table}`), [
    'PATCH:athlete_groups',
    'DELETE:athlete_group_memberships',
    'POST:athlete_group_memberships',
  ])
  assert.match(calls[0].query, /id=eq\.group-existing/)
  assert.deepEqual(calls[0].body, { name: 'Updated Group' })
  assert.deepEqual(calls[2].body, [{ athlete_group_id: 'group-existing', athlete_id: 'ath-2' }])
})
