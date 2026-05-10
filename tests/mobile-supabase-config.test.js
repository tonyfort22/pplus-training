import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app ships a Supabase env example and setup doc for Expo runtime', () => {
  const mobileEnvExamplePath = resolve(process.cwd(), 'apps/mobile/.env.example')
  const mobileSetupDocPath = resolve(process.cwd(), 'docs/mobile-supabase-setup.md')

  assert.equal(existsSync(mobileEnvExamplePath), true)
  assert.equal(existsSync(mobileSetupDocPath), true)

  const mobileEnvExample = readFileSync(mobileEnvExamplePath, 'utf8')
  const mobileSetupDoc = readFileSync(mobileSetupDocPath, 'utf8')

  assert.match(mobileEnvExample, /^EXPO_PUBLIC_SUPABASE_URL=/m)
  assert.match(mobileEnvExample, /^EXPO_PUBLIC_SUPABASE_ANON_KEY=/m)
  assert.match(mobileSetupDoc, /apps\/mobile\/.env/)
  assert.match(mobileSetupDoc, /EXPO_PUBLIC_SUPABASE_URL/)
  assert.match(mobileSetupDoc, /EXPO_PUBLIC_SUPABASE_ANON_KEY/)
  assert.match(mobileSetupDoc, /Profile update requires Supabase auth configuration/)
  assert.match(mobileSetupDoc, /entry falls back to the auth route/i)
})
