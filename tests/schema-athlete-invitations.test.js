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

for (const [sqlName, sql] of Object.entries({
  'schema-v1.sql': schemaSql,
  '0001_initial_schema.sql': migrationSql,
})) {
  test(`${sqlName} includes an athlete_invitations table for hashed one-time invite codes`, () => {
    const normalized = normalize(sql)
    assert.ok(normalized.includes('create table if not exists athlete_invitations ('), 'missing athlete_invitations table')
    assert.match(normalized, /coach_id uuid not null references coach_profiles\(id\) on delete cascade/)
    assert.match(normalized, /invitee_email text not null/)
    assert.match(normalized, /code_hash text not null/)
    assert.match(normalized, /expires_at timestamptz not null/)
    assert.match(normalized, /used_at timestamptz/)
    assert.match(normalized, /revoked_at timestamptz/)
    assert.match(normalized, /sent_at timestamptz/)
    assert.match(normalized, /created_by_user_id uuid references auth\.users\(id\) on delete set null/)
    assert.ok(normalized.includes('constraint athlete_invitations_code_hash_key unique (code_hash)'), 'missing unique code_hash constraint')
  })

  test(`${sqlName} protects athlete_invitations with coach-owned RLS policies`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /alter table athlete_invitations enable row level security/)
    assert.match(normalized, /revoke all on table athlete_invitations from anon/)
    assert.match(normalized, /revoke all on table athlete_invitations from authenticated/)
    assert.match(normalized, /grant select, insert, update on table athlete_invitations to authenticated/)
    assert.match(normalized, /create policy athlete_invitations_select_coach_owned on athlete_invitations for select to authenticated using \([\s\S]*coach_profiles\.id = athlete_invitations\.coach_id[\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\)/)
    assert.match(normalized, /create policy athlete_invitations_insert_coach_owned on athlete_invitations for insert to authenticated with check \([\s\S]*coach_profiles\.id = athlete_invitations\.coach_id[\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\)/)
    assert.match(normalized, /create policy athlete_invitations_update_coach_owned on athlete_invitations for update to authenticated using \([\s\S]*coach_profiles\.id = athlete_invitations\.coach_id[\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\) with check \([\s\S]*coach_profiles\.id = athlete_invitations\.coach_id[\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\)/)
  })
}
