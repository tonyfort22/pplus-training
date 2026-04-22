import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const schemaSql = fs.readFileSync(path.join(repoRoot, 'infra/supabase/schema-v1.sql'), 'utf8')
const migrationSql = fs.readFileSync(path.join(repoRoot, 'infra/supabase/migrations/0001_initial_schema.sql'), 'utf8')

function normalize(sql) {
  return sql.toLowerCase().replace(/\s+/g, ' ')
}

function expectTable(sql, tableName) {
  assert.match(normalize(sql), new RegExp(`create table if not exists ${tableName}\\s*\\(`), `missing table ${tableName}`)
}

function expectColumn(sql, tableName, columnName) {
  const normalized = normalize(sql)
  const tableStart = normalized.indexOf(`create table if not exists ${tableName} (`)
  assert.notEqual(tableStart, -1, `missing table ${tableName}`)
  const nextCreate = normalized.indexOf('create table if not exists ', tableStart + 1)
  const tableBody = nextCreate === -1 ? normalized.slice(tableStart) : normalized.slice(tableStart, nextCreate)
  assert.ok(tableBody.includes(` ${columnName} `), `missing column ${tableName}.${columnName}`)
}

const requiredTables = [
  'program_workout_exercises',
  'program_workout_sets',
  'rest_timer_states',
  'exercise_performance_snapshots',
  'body_metric_logs',
  'recovery_snapshots',
]

for (const sqlName of ['schema-v1.sql', '0001_initial_schema.sql']) {
  const sql = sqlName === 'schema-v1.sql' ? schemaSql : migrationSql

  test(`${sqlName} includes required MVP and deferred foundation tables`, () => {
    for (const tableName of requiredTables) expectTable(sql, tableName)
  })

  test(`${sqlName} preserves plan lineage in execution tables`, () => {
    expectColumn(sql, 'workout_session_exercises', 'program_workout_exercise_id')
    expectColumn(sql, 'workout_session_sets', 'program_workout_set_id')
  })
}
