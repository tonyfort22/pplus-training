import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const rankingsDataTablePath = resolve(repoRoot, 'apps/web/components/admin/rankings-data-table.jsx')
const rankingsRepositoryPath = resolve(repoRoot, 'apps/web/lib/admin-ranking-repository.js')

test('rankings admin uses real athlete-derived rows and the shared admin table shell', () => {
  const rankingsSource = readFileSync(rankingsDataTablePath, 'utf8')
  const repositorySource = readFileSync(rankingsRepositoryPath, 'utf8')

  assert.match(repositorySource, /createAdminAthleteRepository/)
  assert.match(repositorySource, /listAthletes\(\)/)
  assert.match(repositorySource, /workoutsPercentage/)
  assert.match(repositorySource, /workoutsCompleted/)
  assert.match(repositorySource, /badgeSrc/)
  assert.match(repositorySource, /gold_badge\.svg/)
  assert.match(repositorySource, /silver_badge\.svg/)
  assert.match(repositorySource, /bronze_badget\.svg/)
  assert.match(repositorySource, /\.sort\(/)
  assert.doesNotMatch(repositorySource, /source:\s*'ranking_metric_unavailable'/)
  assert.doesNotMatch(repositorySource, /rankings:\s*\[\]/)

  assert.doesNotMatch(rankingsSource, /import AdminCard/)
  assert.doesNotMatch(rankingsSource, /import AdminEmptyState/)
  assert.doesNotMatch(rankingsSource, /Ranking source: unavailable/)
  assert.doesNotMatch(rankingsSource, /No official ranking metric is connected/)
  assert.doesNotMatch(rankingsSource, /Connect an official ranking metric or scoring table before showing a leaderboard\./)
  assert.match(rankingsSource, /badgeSrc/)
  assert.match(rankingsSource, /admin-shell-athletes-table-example/)
  assert.match(rankingsSource, /admin-shell-athletes-table-shell/)
  assert.match(rankingsSource, /admin-shell-athletes-table/)
  assert.match(rankingsSource, /admin-shell-athletes-row-even/)
  assert.match(rankingsSource, /admin-shell-athletes-row-odd/)
  assert.match(rankingsSource, /admin-shell-athletes-empty-state/)
  assert.match(rankingsSource, /admin-shell-athletes-pagination-bar/)
  assert.match(rankingsSource, /admin-shell-athletes-example-controls flex items-center justify-between gap-3/)
  assert.match(rankingsSource, /Rows per page/)
  assert.match(rankingsSource, /\{pageStart\} - \{pageEnd\} of \{totalRows\}/)
})
