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
  'support_conversations',
  'support_messages',
  'workout_template_blocks',
  'program_workout_blocks',
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

  test(`${sqlName} aligns identity ownership to auth.users instead of a duplicate public users table`, () => {
    const normalized = normalize(sql)
    assert.doesNotMatch(normalized, /create table if not exists users\s*\(/)
    assert.match(normalized, /user_id uuid not null unique references auth\.users\(id\) on delete cascade/)
    assert.match(normalized, /created_by uuid references auth\.users\(id\) on delete set null/)
  })

  test(`${sqlName} provisions coach_profiles or athlete_profiles automatically from auth.users based on role metadata`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /create or replace function public\.handle_new_auth_user\(\)/)
    assert.match(normalized, /coalesce\(new\.raw_user_meta_data ->> 'role', 'athlete'\)/)
    assert.match(normalized, /if .* = 'coach' then insert into public\.coach_profiles \(user_id, display_name, first_name, last_name\)/)
    assert.match(normalized, /new\.raw_user_meta_data ->> 'display_name'/)
    assert.match(normalized, /new\.raw_user_meta_data ->> 'first_name'/)
    assert.match(normalized, /new\.raw_user_meta_data ->> 'last_name'/)
    assert.match(normalized, /else[\s\S]*insert into public\.athlete_profiles \(user_id, coach_id, first_name, last_name\)/)
    assert.match(normalized, /new\.raw_user_meta_data ->> 'coach_email'/)
    assert.match(normalized, /select coach_profiles\.id into linked_coach_id from public\.coach_profiles join auth\.users coach_users on coach_users\.id = coach_profiles\.user_id where lower\(coach_users\.email\) = lower\(signup_coach_email\) limit 1/)
    assert.match(normalized, /create trigger on_auth_user_created after insert on auth\.users/)
    assert.match(normalized, /execute function public\.handle_new_auth_user\(\)/)
  })

  test(`${sqlName} locks coach_profiles behind authenticated self-service RLS instead of open public grants`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /alter table coach_profiles enable row level security/)
    assert.match(normalized, /revoke all on table coach_profiles from anon/)
    assert.match(normalized, /revoke all on table coach_profiles from authenticated/)
    assert.match(normalized, /grant select, update on table coach_profiles to authenticated/)
    assert.match(normalized, /create policy coach_profiles_select_own on coach_profiles for select to authenticated using \(user_id = auth\.uid\(\)\)/)
    assert.match(normalized, /create policy coach_profiles_update_own on coach_profiles for update to authenticated using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/)
    assert.doesNotMatch(normalized, /grant\s+insert\s+on table coach_profiles to authenticated/)
    assert.doesNotMatch(normalized, /grant\s+select\s+on table coach_profiles to anon/)
  })

  test(`${sqlName} locks athlete_profiles behind authenticated self-service RLS without open public grants`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /alter table athlete_profiles enable row level security/)
    assert.match(normalized, /revoke all on table athlete_profiles from anon/)
    assert.match(normalized, /revoke all on table athlete_profiles from authenticated/)
    assert.match(normalized, /grant select, update on table athlete_profiles to authenticated/)
    assert.match(normalized, /create policy athlete_profiles_select_own on athlete_profiles for select to authenticated using \(user_id = auth\.uid\(\)\)/)
    assert.match(normalized, /create policy athlete_profiles_select_coach_linked on athlete_profiles for select to authenticated using \([\s\S]*coach_profiles\.id = athlete_profiles\.coach_id[\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\)/)
    assert.match(normalized, /create policy athlete_profiles_update_own on athlete_profiles for update to authenticated using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/)
    assert.doesNotMatch(normalized, /grant\s+insert\s+on table athlete_profiles to authenticated/)
    assert.doesNotMatch(normalized, /grant\s+select\s+on table athlete_profiles to anon/)
  })

  test(`${sqlName} preserves coach profile fields needed by coach auth and profile surfaces`, () => {
    expectColumn(sql, 'coach_profiles', 'display_name')
    expectColumn(sql, 'coach_profiles', 'first_name')
    expectColumn(sql, 'coach_profiles', 'last_name')
    expectColumn(sql, 'coach_profiles', 'organization_name')
    expectColumn(sql, 'coach_profiles', 'bio')
    expectColumn(sql, 'coach_profiles', 'phone_number')
    expectColumn(sql, 'coach_profiles', 'avatar_url')
  })

  test(`${sqlName} preserves athlete profile preference fields needed by units and theme surfaces`, () => {
    expectColumn(sql, 'athlete_profiles', 'units_preference')
    expectColumn(sql, 'athlete_profiles', 'weight_unit_preference')
    expectColumn(sql, 'athlete_profiles', 'distance_unit_preference')
    expectColumn(sql, 'athlete_profiles', 'theme_preference')
  })

  test(`${sqlName} preserves coach profile preference fields needed by units and theme surfaces`, () => {
    expectColumn(sql, 'coach_profiles', 'weight_unit_preference')
    expectColumn(sql, 'coach_profiles', 'distance_unit_preference')
    expectColumn(sql, 'coach_profiles', 'theme_preference')
  })

  test(`${sqlName} includes analytics columns expected by the mobile persistence adapters`, () => {
    expectColumn(sql, 'exercise_performance_snapshots', 'body_region')
  })

  test(`${sqlName} stores workout block structure for both templates and scheduled program workouts`, () => {
    expectColumn(sql, 'workout_template_blocks', 'block_code')
    expectColumn(sql, 'workout_template_blocks', 'title')
    expectColumn(sql, 'workout_template_blocks', 'instructions')
    expectColumn(sql, 'workout_template_exercises', 'workout_template_block_id')
    expectColumn(sql, 'program_workout_blocks', 'block_code')
    expectColumn(sql, 'program_workout_blocks', 'title')
    expectColumn(sql, 'program_workout_blocks', 'instructions')
    expectColumn(sql, 'program_workout_exercises', 'program_workout_block_id')
  })

  test(`${sqlName} preserves planned workout notes needed by workout edit save`, () => {
    expectColumn(sql, 'program_workouts', 'notes')
  })

  test(`${sqlName} stores workout card colors on both templates and scheduled program workouts`, () => {
    expectColumn(sql, 'workout_templates', 'bg_color')
    expectColumn(sql, 'workout_templates', 'text_color')
    expectColumn(sql, 'program_workouts', 'bg_color')
    expectColumn(sql, 'program_workouts', 'text_color')
  })

  test(`${sqlName} allows coach-authored programs to start unassigned`, () => {
    const normalized = normalize(sql)
    const tableStart = normalized.indexOf('create table if not exists programs (')
    assert.notEqual(tableStart, -1, 'missing table programs')
    const nextCreate = normalized.indexOf('create table if not exists ', tableStart + 1)
    const tableBody = nextCreate === -1 ? normalized.slice(tableStart) : normalized.slice(tableStart, nextCreate)
    assert.match(tableBody, / athlete_id uuid references athlete_profiles\(id\) on delete set null/)
    assert.doesNotMatch(tableBody, / athlete_id uuid not null references athlete_profiles\(id\) on delete cascade/)
  })

  test(`${sqlName} provisions support inbox conversations and messages`, () => {
    expectColumn(sql, 'support_conversations', 'support_request_id')
    expectColumn(sql, 'support_conversations', 'subject')
    expectColumn(sql, 'support_conversations', 'status')
    expectColumn(sql, 'support_conversations', 'priority')
    expectColumn(sql, 'support_conversations', 'requester_name')
    expectColumn(sql, 'support_conversations', 'requester_email')
    expectColumn(sql, 'support_conversations', 'requester_role')
    expectColumn(sql, 'support_conversations', 'requester_avatar_url')
    expectColumn(sql, 'support_conversations', 'last_message_preview')
    expectColumn(sql, 'support_conversations', 'last_message_at')
    expectColumn(sql, 'support_messages', 'conversation_id')
    expectColumn(sql, 'support_messages', 'sender_type')
    expectColumn(sql, 'support_messages', 'sender_name')
    expectColumn(sql, 'support_messages', 'sender_avatar_url')
    expectColumn(sql, 'support_messages', 'body')
    expectColumn(sql, 'support_messages', 'attachments')
    const normalized = normalize(sql)
    assert.match(normalized, /alter table support_conversations enable row level security/)
    assert.match(normalized, /alter table support_messages enable row level security/)
    assert.match(normalized, /grant all on table support_conversations to service_role/)
    assert.match(normalized, /grant all on table support_messages to service_role/)
  })

  test(`${sqlName} provisions public coach avatar storage with coach-owned write policies`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\) values \('coach-avatars', 'coach-avatars', true, 5242880, array\['image\/jpeg', 'image\/png', 'image\/webp'\]\)/)
    assert.match(normalized, /create policy coach_avatars_select_public on storage\.objects for select to public using \(bucket_id = 'coach-avatars'\)/)
    assert.match(normalized, /create policy coach_avatars_insert_own on storage\.objects for insert to authenticated with check \([\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*coach_profiles\.id::text = split_part\(name, '\/', 1\)[\s\S]*\)/)
    assert.match(normalized, /create policy coach_avatars_update_own on storage\.objects for update to authenticated using \([\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*\) with check \([\s\S]*coach_profiles\.id::text = split_part\(name, '\/', 1\)[\s\S]*\)/)
    assert.match(normalized, /create policy coach_avatars_delete_own on storage\.objects for delete to authenticated using \([\s\S]*coach_profiles\.user_id = auth\.uid\(\)[\s\S]*coach_profiles\.id::text = split_part\(name, '\/', 1\)[\s\S]*\)/)
  })

  test(`${sqlName} provisions public exercise media storage for thumbnail delivery`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\) values \('exercise-media', 'exercise-media', true, 5242880, array\['image\/jpeg', 'image\/png', 'image\/webp'\]\)/)
    assert.match(normalized, /create policy exercise_media_select_public on storage\.objects for select to public using \(bucket_id = 'exercise-media'\)/)
  })

  test(`${sqlName} preserves plan lineage in execution tables`, () => {
    expectColumn(sql, 'workout_session_exercises', 'program_workout_exercise_id')
    expectColumn(sql, 'workout_session_sets', 'program_workout_set_id')
  })

  test(`${sqlName} defines a canonical program_workout_display_states view for completed, missed, and upcoming workout checkboxes`, () => {
    const normalized = normalize(sql)
    assert.match(normalized, /create or replace view program_workout_display_states as/)
    assert.match(normalized, /with latest_session as \(/)
    assert.match(normalized, /from workout_sessions ws/)
    assert.match(normalized, /join program_days pd on pd\.id = pw\.program_day_id/)
    assert.match(normalized, /left join latest_session on latest_session\.program_workout_id = pw\.id/)
    assert.match(normalized, /when coalesce\(latest_session\.status, ''\) = 'completed' then 'completed'/)
    assert.match(normalized, /when pd\.date < current_date then 'missed'/)
    assert.match(normalized, /else 'upcoming'/)
  })
}
