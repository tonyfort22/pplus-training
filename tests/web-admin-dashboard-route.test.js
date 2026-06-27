import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const routePath = resolve(repoRoot, 'apps/web/app/api/admin/dashboard/overview/route.js')

test('admin dashboard overview API route exists and delegates to dashboard repository', () => {
  assert.equal(existsSync(routePath), true)
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /getAdminDashboardOverview/)
  assert.match(source, /export async function GET\(request\)/)
  assert.match(source, /return getAdminDashboardOverview\(request\)/)
})

test('admin dashboard overview route handler owns range parsing, repository delegation, and errors', () => {
  const handlerPath = resolve(repoRoot, 'apps/web/lib/admin-dashboard-route-handlers.js')
  assert.equal(existsSync(handlerPath), true)
  const source = readFileSync(handlerPath, 'utf8')

  assert.match(source, /createAdminDashboardRepository/)
  assert.match(source, /createAdminDashboardRouteHandlers/)
  assert.match(source, /request\.url/)
  assert.match(source, /searchParams\.get\('range'\)/)
  assert.match(source, /getOverview\(\{ range \}\)/)
  assert.match(source, /return json\(\{ overview \}\)/)
  assert.match(source, /Unsupported dashboard range/)
  assert.match(source, /status: error\?\.status \|\| 500/)
})
