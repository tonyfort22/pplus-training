import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const routePath = resolve(repoRoot, 'apps/web/app/admin/api/settings/profile/route.js')

test('admin settings profile route reads the authenticated admin cookie and delegates GET/PATCH to the coach profile repository', () => {
  assert.ok(existsSync(routePath), 'expected admin settings profile route')

  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /cookies\(\)/)
  assert.match(source, /PPLUS_ADMIN_ACCESS_TOKEN_COOKIE/)
  assert.match(source, /createAdminCoachProfileRepository\(\{ accessToken \}\)/)
  assert.match(source, /export async function GET\(\)/)
  assert.match(source, /getCurrentCoachProfile\(\)/)
  assert.match(source, /export async function PATCH\(request\)/)
  assert.match(source, /updateCurrentCoachProfile\(body \?\? \{\}\)/)
})
