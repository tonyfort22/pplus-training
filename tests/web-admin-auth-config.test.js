import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getAdminAuthConfig,
  getAdminAuthRedirectUrl,
} from '../apps/web/lib/admin-auth-config.js'

function withEnv(overrides, callback) {
  const previous = {}
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key]
    if (overrides[key] == null) {
      delete process.env[key]
    } else {
      process.env[key] = overrides[key]
    }
  }

  try {
    return callback()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('getAdminAuthConfig reads server Supabase auth env first', () => {
  withEnv(
    {
      SUPABASE_URL: 'https://server.supabase.co',
      SUPABASE_ANON_KEY: 'server-anon-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://public.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
    },
    () => {
      assert.deepEqual(getAdminAuthConfig(), {
        supabaseUrl: 'https://server.supabase.co',
        anonKey: 'server-anon-key',
      })
    },
  )
})

test('getAdminAuthConfig falls back to public Supabase env values', () => {
  withEnv(
    {
      SUPABASE_URL: null,
      SUPABASE_ANON_KEY: null,
      NEXT_PUBLIC_SUPABASE_URL: 'https://public.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
    },
    () => {
      assert.deepEqual(getAdminAuthConfig(), {
        supabaseUrl: 'https://public.supabase.co',
        anonKey: 'public-anon-key',
      })
    },
  )
})

test('getAdminAuthConfig throws a clear admin auth config error when env is missing', () => {
  withEnv(
    {
      SUPABASE_URL: null,
      SUPABASE_ANON_KEY: null,
      NEXT_PUBLIC_SUPABASE_URL: null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: null,
    },
    () => {
      assert.throws(
        () => getAdminAuthConfig(),
        /Missing admin auth Supabase configuration: SUPABASE_URL, SUPABASE_ANON_KEY/,
      )
    },
  )
})

test('getAdminAuthRedirectUrl builds an absolute redirect URL from the request origin', () => {
  const request = new Request('https://admin.pplus.test/admin/login?next=%2Fadmin')

  assert.equal(
    getAdminAuthRedirectUrl(request, '/admin/reset-password'),
    'https://admin.pplus.test/admin/reset-password',
  )
})
