import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const dashboardOverviewPath = resolve(repoRoot, 'apps/web/components/admin/dashboard-overview.jsx')

test('dashboard overview fetches real overview API data instead of hardcoded KPI mocks', () => {
  const source = readFileSync(dashboardOverviewPath, 'utf8')

  assert.match(source, /fetch\(`\/api\/admin\/dashboard\/overview\?range=\$\{activeRange\}`/)
  assert.match(source, /setOverview\(payload\.overview/)
  assert.match(source, /setLoading\(true\)/)
  assert.match(source, /setError\(/)
  assert.match(source, /Dashboard overview loading/)
  assert.match(source, /Dashboard overview error/)
  assert.match(source, /No dashboard data yet/)
  assert.match(source, /const cards = buildSummaryCards\(overview\?\.summary\)/)
  assert.match(source, /sessionsChart=\{overview\?\.sessionsChart\}/)
  assert.match(source, /complianceChart=\{overview\?\.complianceChart\}/)
  assert.match(source, /sessionsByTime=\{overview\?\.sessionsByTime\}/)
  assert.doesNotMatch(source, /const overviewRangeCardData = \{/)
  assert.doesNotMatch(source, /value: '148'/)
  assert.doesNotMatch(source, /Daily adherence meets projections/)
})
