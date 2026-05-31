import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const dashboardOverviewPath = resolve(repoRoot, 'apps/web/components/admin/dashboard-overview.jsx')

test('dashboard overview fetches real v2 coach overview API data instead of hardcoded KPI mocks', () => {
  const source = readFileSync(dashboardOverviewPath, 'utf8')

  assert.match(source, /fetch\(`\/api\/admin\/dashboard\/overview\?range=\$\{activeRange\}`/)
  assert.match(source, /setOverview\(payload\.overview/)
  assert.match(source, /setLoading\(true\)/)
  assert.match(source, /setError\(/)
  assert.match(source, /Dashboard overview loading/)
  assert.match(source, /Dashboard overview error/)
  assert.match(source, /No dashboard data yet/)
  assert.match(source, /const cards = buildSummaryCards\(overview\?\.summary\)/)
  assert.match(source, /activeAthletes/)
  assert.match(source, /dueWorkouts/)
  assert.match(source, /completedSessions/)
  assert.match(source, /planAdherence/)
  assert.match(source, /needsAttention/)
  assert.match(source, /trainingExecution=\{overview\?\.trainingExecution\}/)
  assert.match(source, /planAdherenceChart=\{overview\?\.planAdherenceChart\}/)
  assert.match(source, /trainingConsistency=\{overview\?\.trainingConsistency\}/)
  assert.match(source, /CalendarHeatmap/)
  assert.match(source, /const heatmapDates = buildTrainingConsistencyWeightedDates\(trainingConsistency\?\.dailyActivity\)/)
  assert.match(source, /weightedDates=\{heatmapDates\}/)
  assert.match(source, /variantClassnames=\{trainingConsistencyHeatmapVariants\}/)
  assert.match(source, /numberOfMonths=\{1\}/)
  assert.match(source, /Monthly activity heatmap/)
  assert.match(source, /Use the arrows to review previous months\./)
  assert.match(source, /Training execution/)
  assert.match(source, /Training consistency/)
  assert.doesNotMatch(source, /const overviewRangeCardData = \{/)
  assert.doesNotMatch(source, /value: '148'/)
  assert.doesNotMatch(source, /Daily adherence meets projections/)
  assert.doesNotMatch(source, /Sessions by time of the day/)
  assert.doesNotMatch(source, /RadarChart/)
})
