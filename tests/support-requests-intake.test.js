import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supportFormPath = resolve(repoRoot, 'apps/web/components/ppht-support-fac5db68-f122.jsx')
const supportRepositoryPath = resolve(repoRoot, 'apps/web/lib/support-requests-repository.js')
const supportRouteHandlersPath = resolve(repoRoot, 'apps/web/lib/support-request-route-handlers.js')
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
  assert.equal(calls.length, 3)
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

  assert.equal(calls[3].url, 'https://example.supabase.co/rest/v1/support_requests?id=eq.support-request-1&select=*')
  assert.equal(calls[3].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[3].init.body), {
    notification_sent_at: '2026-05-27T15:05:00.000Z',
    notification_error: null,
  })
  assert.equal(calls[4].url, 'https://example.supabase.co/rest/v1/support_requests?id=eq.support-request-1&select=*')
  assert.equal(calls[4].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[4].init.body), {
    notification_error: 'Resend rejected the message',
  })
})

test('support request repository creates an inbox conversation and first requester message', async () => {
  assert.ok(existsSync(supportRepositoryPath), 'support request repository should exist')
  const { createSupportRequestsRepository } = await import(`${supportRepositoryPath}?cacheBust=${Date.now()}`)

  const calls = []
  const repository = createSupportRequestsRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T18:30:00.000Z',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('/support_requests')) {
        return Response.json([{
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
          created_at: '2026-05-29T18:30:00.000Z',
          updated_at: '2026-05-29T18:30:00.000Z',
        }], { status: 201 })
      }
      if (String(url).includes('/support_conversations')) {
        return Response.json([{
          id: 'conversation-1',
          support_request_id: 'support-request-1',
          subject: 'technical',
          status: 'open',
          priority: 'normal',
          requester_name: 'Jane Hockey',
          requester_email: 'jane@example.com',
          requester_role: null,
          requester_avatar_url: null,
          last_message_preview: 'Video will not load',
          last_message_at: '2026-05-29T18:30:00.000Z',
          created_at: '2026-05-29T18:30:00.000Z',
          updated_at: '2026-05-29T18:30:00.000Z',
        }], { status: 201 })
      }
      if (String(url).includes('/support_messages')) {
        return Response.json([{ id: 'message-1' }], { status: 201 })
      }
      throw new Error(`unexpected URL ${url}`)
    },
  })

  const supportRequest = await repository.createSupportRequest({
    firstName: 'Jane',
    lastName: 'Hockey',
    email: 'jane@example.com',
    category: 'technical',
    description: 'Video will not load',
  })

  assert.equal(supportRequest.id, 'support-request-1')
  assert.equal(supportRequest.supportConversationId, 'conversation-1')
  assert.equal(calls.length, 3)
  assert.equal(calls[1].url, 'https://example.supabase.co/rest/v1/support_conversations?select=*')
  assert.equal(calls[1].init.method, 'POST')
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    support_request_id: 'support-request-1',
    subject: 'technical',
    status: 'open',
    priority: 'normal',
    requester_name: 'Jane Hockey',
    requester_email: 'jane@example.com',
    requester_role: null,
    requester_avatar_url: null,
    last_message_preview: 'Video will not load',
    last_message_at: '2026-05-29T18:30:00.000Z',
  })
  assert.equal(calls[2].url, 'https://example.supabase.co/rest/v1/support_messages?select=*')
  assert.equal(calls[2].init.method, 'POST')
  assert.deepEqual(JSON.parse(calls[2].init.body), {
    conversation_id: 'conversation-1',
    sender_type: 'requester',
    sender_name: 'Jane Hockey',
    sender_avatar_url: null,
    body: 'Video will not load',
    attachments: [],
    created_at: '2026-05-29T18:30:00.000Z',
  })
})

test('public support request intake route handler creates request and marks successful notification', async () => {
  assert.ok(existsSync(supportRouteHandlersPath), 'support request route handler seam should exist')
  const { createSupportRequestRouteHandlers } = await import(`${supportRouteHandlersPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = {
    async createSupportRequest(payload) {
      calls.push(['createSupportRequest', payload])
      return {
        id: 'support-request-1',
        supportConversationId: 'conversation-1',
        firstName: 'Jane',
        lastName: 'Hockey',
        email: 'jane@example.com',
        category: 'technical',
        description: 'Video will not load',
      }
    },
    async markNotificationSent(supportRequestId) {
      calls.push(['markNotificationSent', supportRequestId])
      return { id: supportRequestId }
    },
    async markNotificationFailed(supportRequestId, message) {
      calls.push(['markNotificationFailed', supportRequestId, message])
      return { id: supportRequestId }
    },
  }
  const notificationSender = {
    async sendSupportRequestNotification(supportRequest) {
      calls.push(['sendSupportRequestNotification', supportRequest.id])
      return { success: true }
    },
  }
  const handlers = createSupportRequestRouteHandlers({
    createRepository: () => repository,
    createNotificationSender: (config) => {
      calls.push(['createNotificationSender', config.appBaseUrl])
      return notificationSender
    },
  })

  const response = await handlers.POST(new Request('https://pplus.example.com/api/support-requests', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Jane',
      lastName: 'Hockey',
      email: 'jane@example.com',
      category: 'technical',
      description: 'Video will not load',
    }),
  }))
  const payload = await response.json()

  assert.equal(response.status, 201)
  assert.deepEqual(payload, { ok: true, supportRequestId: 'support-request-1', supportConversationId: 'conversation-1' })
  assert.deepEqual(calls, [
    ['createNotificationSender', 'https://pplus.example.com'],
    ['createSupportRequest', {
      firstName: 'Jane',
      lastName: 'Hockey',
      email: 'jane@example.com',
      category: 'technical',
      description: 'Video will not load',
    }],
    ['sendSupportRequestNotification', 'support-request-1'],
    ['markNotificationSent', 'support-request-1'],
  ])
})

test('public support request intake route handler preserves validation errors and records notification failures without failing intake', async () => {
  assert.ok(existsSync(supportRouteHandlersPath), 'support request route handler seam should exist')
  const { createSupportRequestRouteHandlers } = await import(`${supportRouteHandlersPath}?cacheBust=${Date.now()}`)

  const validationError = new Error('Please enter a valid email')
  validationError.status = 400
  const failingHandlers = createSupportRequestRouteHandlers({
    createRepository: () => ({
      async createSupportRequest() {
        throw validationError
      },
    }),
    createNotificationSender: () => ({
      async sendSupportRequestNotification() {
        throw new Error('should not notify invalid requests')
      },
    }),
  })
  const failedResponse = await failingHandlers.POST(new Request('https://pplus.example.com/api/support-requests', {
    method: 'POST',
    body: JSON.stringify({ email: 'bad' }),
  }))
  assert.equal(failedResponse.status, 400)
  assert.deepEqual(await failedResponse.json(), { error: 'Please enter a valid email' })

  const calls = []
  const successfulHandlers = createSupportRequestRouteHandlers({
    createRepository: () => ({
      async createSupportRequest() {
        calls.push(['createSupportRequest'])
        return { id: 'support-request-2', supportConversationId: 'conversation-2' }
      },
      async markNotificationSent() {
        calls.push(['markNotificationSent'])
      },
      async markNotificationFailed(supportRequestId, message) {
        calls.push(['markNotificationFailed', supportRequestId, message])
      },
    }),
    createNotificationSender: () => ({
      async sendSupportRequestNotification() {
        calls.push(['sendSupportRequestNotification'])
        throw new Error('Loops rejected the message')
      },
    }),
  })
  const response = await successfulHandlers.POST(new Request('https://pplus.example.com/api/support-requests', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Alex',
      lastName: 'Goalie',
      email: 'alex@example.com',
      category: 'billing',
      description: 'Invoice question',
    }),
  }))

  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { ok: true, supportRequestId: 'support-request-2', supportConversationId: 'conversation-2' })
  assert.deepEqual(calls, [
    ['createSupportRequest'],
    ['sendSupportRequestNotification'],
    ['markNotificationFailed', 'support-request-2', 'Loops rejected the message'],
  ])
})

test('support API route creates support requests through the repository seam and attempts notification safely', () => {
  assert.ok(existsSync(supportRoutePath), 'support API route should exist')
  const routeSource = readFileSync(supportRoutePath, 'utf8')
  assert.match(routeSource, /import \{ postSupportRequest \} from '@\/lib\/support-request-route-handlers'/)
  assert.match(routeSource, /export \{ postSupportRequest as POST \}/)
  assert.doesNotMatch(routeSource, /createSupportRequestsRepository/, 'route file should delegate instead of owning repository construction')
  assert.doesNotMatch(routeSource, /createSupportRequestNotificationSender/, 'route file should delegate instead of owning notification construction')
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
    adminUrl: 'https://pplus.example.com/admin/support',
  })

  await sender.sendSupportRequestNotification({
    id: 'support-request-2',
    supportConversationId: 'conversation-2',
    firstName: 'Alex',
    lastName: 'Goalie',
    email: 'alex@example.com',
    category: 'billing',
    description: 'Invoice question',
    createdAt: '2026-05-27T15:00:00.000Z',
    source: 'support_page',
  })
  const deepLinkBody = JSON.parse(calls[1].init.body)
  assert.equal(deepLinkBody.dataVariables.adminUrl, 'https://pplus.example.com/admin/support?conversationId=conversation-2')

  const disabledSender = createSupportRequestNotificationSender({
    loopsApiKey: '',
    transactionalId: '',
    toEmail: '',
    fetchImpl: async () => { throw new Error('should not send') },
  })
  const disabledResult = await disabledSender.sendSupportRequestNotification({ id: 'support-request-3' })
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
