import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('send-athlete-invitation deployment assets document the Supabase function config, required secrets, and live verification path', () => {
  const supabaseConfigSource = readFileSync(resolve(process.cwd(), 'infra/supabase/config.toml'), 'utf8')
  const supabaseEnvExampleSource = readFileSync(resolve(process.cwd(), 'infra/supabase/.env.example'), 'utf8')
  const mobileEnvExampleSource = readFileSync(resolve(process.cwd(), 'apps/mobile/.env.example'), 'utf8')
  const deployGuideSource = readFileSync(resolve(process.cwd(), 'infra/supabase/functions/send-athlete-invitation/DEPLOY.md'), 'utf8')
  const maestroFlowSource = readFileSync(resolve(process.cwd(), 'maestro/send-athlete-invitation-smoke.yaml'), 'utf8')

  assert.match(supabaseConfigSource, /\[functions\.send-athlete-invitation\]/)
  assert.match(supabaseConfigSource, /verify_jwt\s*=\s*true/)

  assert.match(supabaseEnvExampleSource, /^LOOPS_API_KEY=$/m)
  assert.match(supabaseEnvExampleSource, /^PPLUS_APP_STORE_URL=$/m)
  assert.match(mobileEnvExampleSource, /^EXPO_PUBLIC_PPLUS_APP_STORE_URL=$/m)

  assert.match(deployGuideSource, /supabase functions deploy send-athlete-invitation/)
  assert.match(deployGuideSource, /supabase secrets set[\s\S]*LOOPS_API_KEY/)
  assert.match(deployGuideSource, /supabase db push|supabase migration up/)
  assert.match(deployGuideSource, /send-athlete-invitation-smoke\.yaml/)
  assert.match(deployGuideSource, /EXPO_PUBLIC_PPLUS_APP_STORE_URL/)

  assert.match(maestroFlowSource, /appId: host\.exp\.Exponent/)
  assert.match(maestroFlowSource, /Invite athlete/)
  assert.match(maestroFlowSource, /Send invitation/)
  assert.match(maestroFlowSource, /The invitation was sent!/)
})
