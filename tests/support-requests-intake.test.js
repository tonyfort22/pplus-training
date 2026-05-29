import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supportFormPath = resolve(repoRoot, 'apps/web/components/ppht-support-fac5db68-f122.jsx')
const supportRepositoryPath = resolve(repoRoot, 'apps/web/lib/support-requests-repository.js')
const supportNotificationsPath = resolve(repoRoot, 'apps/web/lib/support-request-notifications.js')
const supportRoutePath = resolve(repoRoot, 'apps/web/app/api/support-requests/route.js')
const schemaPath = resolve(repoRoot, 'apps/web/lib/form-schema.js')
const schemaSqlPath = resolve(repoRoot, 'infra/supabase/schema-v1.sql')
const initialMigrationPath = resolve(repoRoot, 'infra/supabase/migrations/0001_initial_schema.sql')
const intakeMigrationPath = resolve(repoRoot, 'infra/supabase/migrations/20260527120000_support_requests_intake.sql')

function normalize(sql) {
  return sql.toLowerCase().replace(/\s+/g, ' ')
}

function tableBody(sql, tableName) {
  const normalized = normalize(sql)
  const tableStart = normalized.indexOf(`create table if not exists ${tableName} (`)
  assert.notEqual(tableStart, -1, `missing table ${tableName}`)
  const nextCreate = normalized.indexOf('create table if not exists ', tableStart + 1)
  return nextCreate === -1 ? normalized.slice(tableStart) : normalized.slice(tableStart, nextCreate)
}

test('support intake schema creates durable support_requests records', () => {
  for (const filePath of [schemaSqlPath, initialMigrationPath, intakeMigrationPath]) {
    assert.ok(existsSync(filePath), `expected support intake schema file to exist: ${filePath}`)
  }

  for (const [label, source] of [
    ['schema-v1.sql', readFileSync(schemaSqlPath, 'utf8')],
    ['0001_initial_schema.sql', readFileSync(initialMigrationPath, 'utf8')],
    ['support migration', readFileSync(intakeMigrationPath, 'utf8')],
  ]) {
    const body = tableBody(source, 'support_requests')
    for (const column of [
      'id uuid primary key default gen_random_uuid()',
      'first_name text not null',
      'last_name text not null',
      'email text not null',
      'category text not null',
      'description text not null',
      "status text not null default 'new'",
      "source text not null default 'support_page'",
      'notification_sent_at timestamptz',
      'notification_error text',
      'created_at timestamptz not null default now()',
      'updated_at timestamptz not null default now()',
    ]) {
      assert.ok(body.includes(column), `${label} missing support_requests column: ${column}`)
    }
    assert.match(normalize(source), /create index if not exists support_requests_status_created_at_idx on support_requests \(status, created_at desc\)/, `${label} should index support inbox status sorting`)
    assert.match(normalize(source), /alter table support_requests enable row level security/, `${label} should enable RLS for support requests`)
    assert.match(normalize(source), /revoke all on table support_requests from anon/, `${label} should not expose support requests directly to anon`)
    assert.match(normalize(source), /grant all on table support_requests to service_role/, `${label} should allow server-side service role writes`)
  }
})

test('support request repository validates, normalizes, and inserts via Supabase REST', async () => {
  assert.ok(existsSync(supportRepositoryPath), 'support request repository should exist')
  const { createSupportRequestsRepository } = await import(`${supportRepositoryPath}?cacheBust=${Date.now()}`)

  const calls = []
  const repository = createSupportRequestsRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      if (init.method === 'PATCH') {
        return Response.json([
          {
            id: 'support-request-1',
            notification_sent_at: '2026-05-27T15:05:00.000Z',
            notification_error: null,
          },
        ])
      }

      return Response.json([
        {
          id: 'support-request-1',
          first_name: 'Jane',
          last_name: 'Hockey',
          email: 'jane@example.com',
          category: 'technical',
          description: 'Video will not load',
          status: 'new',
          source: 'support_page',
          notification_sent_at: null,
          notification_error: null,
          created_at: '2026-05-27T15:00:00.000Z',
          updated_at: '2026-05-27T15:00:00.000Z',
        },
      ], { status: 201 })
    },
  })

  const supportRequest = await repository.createSupportRequest({
    firstName: ' Jane ',
    lastName: ' Hockey ',
    email: ' JANE@EXAMPLE.COM ',
    category: 'technical',
    description: ' Video will not load ',
  })

  assert.equal(supportRequest.id, 'support-request-1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/support_requests?select=*')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers.apikey, 'service-role-key')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer service-role-key')
  assert.equal(calls[0].init.headers.Prefer, 'return=representation')
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    first_name: 'Jane',
    last_name: 'Hockey',
    email: 'jane@example.com',
    category: 'technical',
    description: 'Video will not load',
    status: 'new',
    source: 'support_page',
  })

  await assert.rejects(
    () => repository.createSupportRequest({ firstName: '', lastName: 'Hockey', email: 'bad', category: '', description: '' }),
    /This field is required|Please enter a valid email|Please select an item/,
  )

  await repository.markNotificationSent('support-request-1', '2026-05-27T15:05:00.000Z')
  await repository.markNotificationFailed('support-request-1', 'Resend rejected the message')

  assert.equal(calls[1].url, 'https://example.supabase.co/rest/v1/support_requests?id=eq.support-request-1&select=*')
  assert.equal(calls[1].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    notification_sent_at: '2026-05-27T15:05:00.000Z',
    notification_error: null,
  })
  assert.equal(calls[2].url, 'https://example.supabase.co/rest/v1/support_requests?id=eq.support-request-1&select=*')
  assert.equal(calls[2].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[2].init.body), {
    notification_error: 'Resend rejected the message',
  })
})

test('support API route creates support requests through the repository seam and attempts notification safely', () => {
  assert.ok(existsSync(supportRoutePath), 'support API route should exist')
  const routeSource = readFileSync(supportRoutePath, 'utf8')
  assert.match(routeSource, /import \{ createSupportRequestsRepository \} from '@\/lib\/support-requests-repository'/)
  assert.match(routeSource, /import \{ createSupportRequestNotificationSender \} from '@\/lib\/support-request-notifications'/)
  assert.match(routeSource, /export async function POST\(request\)/)
  assert.match(routeSource, /const body = await request\.json\(\)/)
  assert.match(routeSource, /repository\.createSupportRequest\(body \?\? \{\}\)/)
  assert.match(routeSource, /notificationSender\.sendSupportRequestNotification\(supportRequest\)/)
  assert.match(routeSource, /repository\.markNotificationSent\(supportRequest\.id/)
  assert.match(routeSource, /repository\.markNotificationFailed\(supportRequest\.id/)
  assert.match(routeSource, /catch \(notificationError\)/)
  assert.match(routeSource, /supportRequestId: supportRequest\.id/)
  assert.match(routeSource, /\{ status: 201 \}/)
})

test('support notification sender posts internal email through Loops transactional API', async () => {
  assert.ok(existsSync(supportNotificationsPath), 'support notification sender should exist')
  const { createSupportRequestNotificationSender } = await import(`${supportNotificationsPath}?cacheBust=${Date.now()}`)
  const calls = []
  const sender = createSupportRequestNotificationSender({
    loopsApiKey: 'loops-key',
    transactionalId: 'loops-support-template-id',
    toEmail: 'tonyfortugno22@gmail.com',
    appBaseUrl: 'https://pplus.example.com',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json({ success: true })
    },
  })

  const result = await sender.sendSupportRequestNotification({
    id: 'support-request-1',
    firstName: 'Jane',
    lastName: 'Hockey',
    email: 'jane@example.com',
    category: 'technical',
    description: 'Video will not load',
    createdAt: '2026-05-27T15:00:00.000Z',
    source: 'support_page',
  })

  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://app.loops.so/api/v1/transactional')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer loops-key')
  const body = JSON.parse(calls[0].init.body)
  assert.equal(body.transactionalId, 'loops-support-template-id')
  assert.equal(body.email, 'tonyfortugno22@gmail.com')
  assert.deepEqual(body.dataVariables, {
    supportRequestId: 'support-request-1',
    firstName: 'Jane',
    lastName: 'Hockey',
    fullName: 'Jane Hockey',
    fullname: 'Jane Hockey',
    email: 'jane@example.com',
    category: 'technical',
    description: 'Video will not load',
    submittedAt: 'May 27, 2026, 11:00 a.m.',
    source: 'support_page',
    adminUrl: 'https://pplus.example.com/admin/support/support-request-1',
  })

  const disabledSender = createSupportRequestNotificationSender({
    loopsApiKey: '',
    transactionalId: '',
    toEmail: '',
    fetchImpl: async () => { throw new Error('should not send') },
  })
  const disabledResult = await disabledSender.sendSupportRequestNotification({ id: 'support-request-2' })
  assert.equal(disabledResult.skipped, true)
  assert.equal(disabledResult.reason, 'missing_email_config')
})

test('support form posts validated submissions to the support intake API', () => {
  const formSource = readFileSync(supportFormPath, 'utf8')
  const schemaSource = readFileSync(schemaPath, 'utf8')

  assert.match(schemaSource, /export const formSchema = z\.object/)
  assert.match(formSource, /const handleSubmit = form\.handleSubmit\(async \(data\) => \{/)
  assert.match(formSource, /fetch\('\/api\/support-requests'/)
  assert.match(formSource, /method: 'POST'/)
  assert.match(formSource, /'Content-Type': 'application\/json'/)
  assert.match(formSource, /body: JSON\.stringify\(data\)/)
  assert.match(formSource, /setSubmitError\(null\)/)
  assert.match(formSource, /setSubmitError\(/)
  assert.match(formSource, /form\.reset\(\)/)
  assert.doesNotMatch(formSource, /console\.log\(data\)/, 'support form should not drop submissions into console.log')
})
