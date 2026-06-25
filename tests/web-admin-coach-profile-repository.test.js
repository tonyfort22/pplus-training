import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminCoachProfileRepository } from '../apps/web/lib/admin-coach-profile-repository.js'

function createIdentityRepositoryFactory(instances) {
  const calls = []
  return {
    calls,
    factory(config) {
      calls.push(config)
      const next = instances.shift()
      if (!next) throw new Error('Unexpected identity repository creation')
      return next
    },
  }
}

test('admin coach profile repository loads the authenticated coach profile from the admin access token', async () => {
  const { calls, factory } = createIdentityRepositoryFactory([
    {
      async getCurrentUser() {
        return { id: 'user-1', email: 'coach@example.com' }
      },
      async getCoachProfileByUserId(userId) {
        assert.equal(userId, 'user-1')
        return { id: 'coach-1', displayName: 'Coach One', firstName: 'Coach', lastName: 'One', phoneNumber: '555-1111', avatarUrl: 'https://cdn/avatar.jpg' }
      },
    },
  ])
  const repository = createAdminCoachProfileRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    identityRepositoryFactory: factory,
  })

  const profile = await repository.getCurrentCoachProfile()

  assert.equal(calls[0].accessToken, 'admin-access-token')
  assert.deepEqual(profile, {
    id: 'coach-1',
    name: 'Coach One',
    firstName: 'Coach',
    lastName: 'One',
    phone: '555-1111',
    avatarUrl: 'https://cdn/avatar.jpg',
    email: 'coach@example.com',
  })
})

test('admin coach profile repository saves approved coach fields and optional avatar upload', async () => {
  const uploadCalls = []
  const updateCalls = []
  const { factory } = createIdentityRepositoryFactory([
    {
      async getCurrentUser() {
        return { id: 'user-1', email: 'coach@example.com' }
      },
      async getCoachProfileByUserId() {
        return { id: 'coach-1', displayName: 'Coach One', firstName: 'Coach', lastName: 'One', phoneNumber: '555-1111', avatarUrl: 'old.jpg' }
      },
      async uploadCoachAvatar(payload) {
        uploadCalls.push(payload)
        return { path: 'coach-1/coach-avatar.png', publicUrl: 'https://cdn/new-avatar.jpg', payload: { Key: 'coach-avatars/coach-1/coach-avatar.png' } }
      },
      async updateCoachProfile(payload) {
        updateCalls.push(payload)
        return { id: 'coach-1', displayName: payload.updates.displayName, firstName: payload.updates.firstName, lastName: payload.updates.lastName, phoneNumber: payload.updates.phoneNumber, avatarUrl: payload.updates.avatarUrl }
      },
    },
  ])
  const repository = createAdminCoachProfileRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    identityRepositoryFactory: factory,
  })

  const profile = await repository.updateCurrentCoachProfile({
    firstName: 'Anthony',
    lastName: 'Fortugno',
    phone: '555-2222',
    avatarUpload: {
      dataUrl: 'data:image/png;base64,aGVsbG8=',
      fileName: 'coach avatar.png',
      contentType: 'image/png',
    },
  })

  assert.equal(uploadCalls.length, 1)
  assert.equal(uploadCalls[0].coachId, 'coach-1')
  assert.equal(uploadCalls[0].contentType, 'image/png')
  assert.equal(uploadCalls[0].fileName, 'coach avatar.png')
  assert.ok(uploadCalls[0].fileBuffer instanceof Uint8Array)
  assert.deepEqual(updateCalls, [
    {
      coachId: 'coach-1',
      updates: {
        displayName: 'Anthony Fortugno',
        firstName: 'Anthony',
        lastName: 'Fortugno',
        phoneNumber: '555-2222',
        avatarUrl: 'https://cdn/new-avatar.jpg',
      },
    },
  ])
  assert.deepEqual(profile, {
    id: 'coach-1',
    name: 'Anthony Fortugno',
    firstName: 'Anthony',
    lastName: 'Fortugno',
    phone: '555-2222',
    avatarUrl: 'https://cdn/new-avatar.jpg',
    email: 'coach@example.com',
  })
})

test('admin coach profile repository stores avatar upload publicUrl instead of the upload response object', async () => {
  const uploadResponse = Object.freeze({
    path: 'coach-1/profile.png',
    publicUrl: 'https://cdn/avatar-public-url.png',
    payload: Object.freeze({ Key: 'coach-avatars/coach-1/profile.png', bucket: 'coach-avatars' }),
  })
  const updateCalls = []
  const { factory } = createIdentityRepositoryFactory([
    {
      async getCurrentUser() {
        return { id: 'user-1', email: 'coach@example.com' }
      },
      async getCoachProfileByUserId() {
        return { id: 'coach-1', displayName: 'Coach One', firstName: 'Coach', lastName: 'One', phoneNumber: '555-1111', avatarUrl: 'old.jpg' }
      },
      async uploadCoachAvatar() {
        return uploadResponse
      },
      async updateCoachProfile(payload) {
        updateCalls.push(payload)
        return { id: 'coach-1', displayName: 'Coach One', firstName: 'Coach', lastName: 'One', phoneNumber: '555-1111', avatarUrl: payload.updates.avatarUrl }
      },
    },
  ])
  const repository = createAdminCoachProfileRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'admin-access-token',
    identityRepositoryFactory: factory,
  })

  const profile = await repository.updateCurrentCoachProfile({
    firstName: 'Coach',
    lastName: 'One',
    phone: '555-1111',
    avatarUpload: {
      dataUrl: 'data:image/png;base64,aGVsbG8=',
      fileName: 'profile.png',
      contentType: 'image/png',
    },
  })

  assert.equal(updateCalls[0].updates.avatarUrl, 'https://cdn/avatar-public-url.png')
  assert.equal(typeof updateCalls[0].updates.avatarUrl, 'string')
  assert.notDeepEqual(updateCalls[0].updates.avatarUrl, uploadResponse)
  assert.equal(profile.avatarUrl, 'https://cdn/avatar-public-url.png')
})

test('admin coach profile repository rejects missing authenticated admin session', async () => {
  const repository = createAdminCoachProfileRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: '',
    identityRepositoryFactory: () => ({}),
  })

  await assert.rejects(
    () => repository.getCurrentCoachProfile(),
    (error) => error.message === 'Admin session is required.' && error.status === 401,
  )
})

test('admin coach profile repository maps expired Supabase sessions to a clean 401', async () => {
  const repository = createAdminCoachProfileRepository({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'expired-token',
    identityRepositoryFactory: () => ({
      async getCurrentUser() {
        throw new Error('Supabase identity request failed (403): Forbidden')
      },
    }),
  })

  await assert.rejects(
    () => repository.getCurrentCoachProfile(),
    (error) => error.message === 'Admin session is invalid.' && error.status === 401,
  )
})
