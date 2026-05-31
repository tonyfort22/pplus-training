import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryPath = resolve(repoRoot, 'apps/web/lib/support-inbox-repository.js')
const routePath = resolve(repoRoot, 'apps/web/app/api/admin/support/conversations/route.js')
const messagesRoutePath = resolve(repoRoot, 'apps/web/app/api/admin/support/conversations/[conversationId]/messages/route.js')
const publicRequesterMessagesRoutePath = resolve(repoRoot, 'apps/web/app/api/support/conversations/[conversationId]/messages/route.js')
const shellPath = resolve(repoRoot, 'apps/web/components/admin/support/support-inbox-shell.jsx')
const threadPath = resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-thread.jsx')

test('support inbox repository lists conversations from Supabase REST', async () => {
  assert.ok(existsSync(repositoryPath), 'support inbox repository should exist')
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json([
        {
          id: 'conversation-1',
          support_request_id: 'support-request-1',
          subject: 'Program access question',
          status: 'open',
          priority: 'high',
          requester_name: 'Ann Smith',
          requester_email: 'ann@example.com',
          requester_role: 'athlete',
          requester_avatar_url: 'https://example.com/avatar.png',
          last_message_preview: 'Can you confirm my next block?',
          last_message_at: '2026-05-29T15:40:00.000Z',
          created_at: '2026-05-29T15:00:00.000Z',
          updated_at: '2026-05-29T15:40:00.000Z',
        },
      ])
    },
  })

  const conversations = await repository.listConversations()

  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /^https:\/\/example\.supabase\.co\/rest\/v1\/support_conversations\?select=/)
  assert.match(calls[0].url, /order=last_message_at\.desc\.nullslast,created_at\.desc/)
  assert.equal(calls[0].init.headers.apikey, 'service-role-key')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer service-role-key')
  assert.deepEqual(conversations, [
    {
      id: 'conversation-1',
      supportRequestId: 'support-request-1',
      subject: 'Program access question',
      status: 'open',
      priority: 'high',
      requesterName: 'Ann Smith',
      requesterEmail: 'ann@example.com',
      requesterRole: 'athlete',
      requesterAvatarUrl: 'https://example.com/avatar.png',
      lastMessagePreview: 'Can you confirm my next block?',
      lastMessageAt: '2026-05-29T15:40:00.000Z',
      createdAt: '2026-05-29T15:00:00.000Z',
      updatedAt: '2026-05-29T15:40:00.000Z',
    },
  ])
})

test('admin support conversations API route uses the support inbox repository', () => {
  assert.ok(existsSync(routePath), 'admin support conversations API route should exist')
  const source = readFileSync(routePath, 'utf8')

  assert.match(source, /import \{ createSupportInboxRepository \} from '@\/lib\/support-inbox-repository'/)
  assert.match(source, /export async function GET\(request\)/)
  assert.match(source, /repository\.listConversations\(\{ search: searchParams\.get\('search'\) \|\| '' \}\)/)
  assert.match(source, /conversations/)
})

test('support inbox repository lists messages for one conversation from Supabase REST', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json([
        {
          id: 'message-1',
          conversation_id: 'conversation-1',
          sender_type: 'requester',
          sender_name: 'Hermes Smoke',
          sender_avatar_url: null,
          body: 'Live inbox smoke test',
          attachments: [],
          created_at: '2026-05-29T22:14:45.809Z',
          updated_at: '2026-05-29T22:14:45.809Z',
        },
      ])
    },
  })

  const messages = await repository.listConversationMessages('conversation-1')

  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /^https:\/\/example\.supabase\.co\/rest\/v1\/support_messages\?select=/)
  assert.match(calls[0].url, /conversation_id=eq\.conversation-1/)
  assert.match(calls[0].url, /order=created_at\.asc/)
  assert.deepEqual(messages, [
    {
      id: 'message-1',
      conversationId: 'conversation-1',
      senderType: 'requester',
      senderName: 'Hermes Smoke',
      senderAvatarUrl: null,
      body: 'Live inbox smoke test',
      attachments: [],
      deliveredAt: undefined,
      deliveryStatus: undefined,
      deliveryError: undefined,
      createdAt: '2026-05-29T22:14:45.809Z',
      updatedAt: '2026-05-29T22:14:45.809Z',
    },
  ])
})

test('support inbox repository creates admin replies and updates conversation preview', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T22:30:00.000Z',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('/support_messages')) {
        return Response.json([{
          id: 'message-admin-1',
          conversation_id: 'conversation-1',
          sender_type: 'admin',
          sender_name: 'PPLUS Support',
          sender_avatar_url: null,
          body: 'Thanks, we are checking this now.',
          attachments: [],
          created_at: '2026-05-29T22:30:00.000Z',
          updated_at: '2026-05-29T22:30:00.000Z',
        }], { status: 201 })
      }
      return Response.json([{ id: 'conversation-1' }])
    },
  })

  const message = await repository.createAdminReply('conversation-1', ' Thanks, we are checking this now. ')

  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/support_messages?select=*')
  assert.equal(calls[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    conversation_id: 'conversation-1',
    sender_type: 'admin',
    sender_name: 'PPLUS Support',
    sender_avatar_url: null,
    body: 'Thanks, we are checking this now.',
    attachments: [],
    delivery_status: 'pending',
    delivery_error: null,
    delivered_at: null,
    created_at: '2026-05-29T22:30:00.000Z',
  })
  assert.equal(calls[1].url, 'https://example.supabase.co/rest/v1/support_conversations?id=eq.conversation-1&select=*')
  assert.equal(calls[1].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    last_message_preview: 'Thanks, we are checking this now.',
    last_message_at: '2026-05-29T22:30:00.000Z',
    updated_at: '2026-05-29T22:30:00.000Z',
  })
  assert.equal(message.id, 'message-admin-1')
  assert.equal(message.senderType, 'admin')
  await assert.rejects(() => repository.createAdminReply('conversation-1', '   '), /Reply body is required/)
})

test('admin support messages API route creates admin replies for a selected conversation', () => {
  assert.ok(existsSync(messagesRoutePath), 'admin support messages API route should exist')
  const source = readFileSync(messagesRoutePath, 'utf8')

  assert.match(source, /export async function POST\(request, \{ params \}\)/)
  assert.match(source, /const requestOrigin = new URL\(request\.url\)\.origin/)
  assert.match(source, /createSupportInboxRepository\(\{ appBaseUrl: requestOrigin \}\)/)
  assert.match(source, /repository\.createAdminReply\(conversationId, body\?\.body\)/)
  assert.match(source, /\{ message \}/)
  assert.match(source, /\{ status: 201 \}/)
})

test('support conversation thread enables composer and posts admin replies to the messages API', () => {
  assert.ok(existsSync(threadPath), 'support conversation thread should exist')
  const source = readFileSync(threadPath, 'utf8')

  assert.match(source, /const \[replyText, setReplyText\] = useState\(""\)/)
  assert.match(source, /async function handleSubmitReply\(\)/)
  assert.match(source, /method: "POST"/)
  assert.match(source, /body: JSON\.stringify\(\{ body: trimmedReply \}\)/)
  assert.match(source, /setMessages\(\(currentMessages\) => \[mapSupportMessageToChatMessage\(payload\.message\), \.\.\.currentMessages\]\)/)
  assert.match(source, /window\.dispatchEvent\(new CustomEvent\("support-conversation-updated"/, 'thread should notify the sidebar when a reply changes the latest preview')
  assert.doesNotMatch(source, /placeholder="Reply persistence is next"|disabled \/>/, 'real support reply composer should not be disabled')
})

test('admin support messages API route loads messages for a selected conversation', () => {
  assert.ok(existsSync(messagesRoutePath), 'admin support messages API route should exist')
  const source = readFileSync(messagesRoutePath, 'utf8')

  assert.match(source, /export async function GET\([^,]+, \{ params \}\)/)
  assert.match(source, /repository\.listConversationMessages\(conversationId\)/)
  assert.match(source, /messages/)
})

test('public support messages API route saves requester replies and notifies admin', () => {
  assert.ok(existsSync(publicRequesterMessagesRoutePath), 'public requester support reply API route should exist')
  const source = readFileSync(publicRequesterMessagesRoutePath, 'utf8')

  assert.match(source, /import \{ createSupportInboxRepository \} from '@\/lib\/support-inbox-repository'/)
  assert.match(source, /export async function POST\(request, \{ params \}\)/)
  assert.match(source, /const requestOrigin = new URL\(request\.url\)\.origin/)
  assert.match(source, /createSupportInboxRepository\(\{ appBaseUrl: requestOrigin \}\)/)
  assert.match(source, /repository\.createRequesterReply\(conversationId, body\?\.body\)/)
  assert.match(source, /\{ message \}/)
  assert.match(source, /\{ status: 201 \}/)
})

test('support inbox repository saves requester replies and sends admin follow-up notification', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const sentAdminNotifications = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-30T00:10:00.000Z',
    requesterReplyNotificationSender: {
      async sendRequesterReplyNotification(payload) {
        sentAdminNotifications.push(payload)
        return { sent: true, providerMessageId: 'loops-requester-reply-1' }
      },
    },
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init })
      const urlText = String(url)
      if (urlText.includes('/support_messages') && init.method === 'POST') {
        return Response.json([{
          id: 'message-requester-1',
          conversation_id: 'conversation-1',
          sender_type: 'requester',
          sender_name: 'Ann Smith',
          sender_avatar_url: null,
          body: 'I tried that and it still fails.',
          attachments: [],
          created_at: '2026-05-30T00:10:00.000Z',
          updated_at: '2026-05-30T00:10:00.000Z',
        }], { status: 201 })
      }
      if (urlText.includes('/support_conversations') && init.method === 'PATCH') {
        const body = JSON.parse(init.body)
        return Response.json([{ id: 'conversation-1', last_message_preview: body.last_message_preview, last_message_at: body.last_message_at }])
      }
      if (urlText.includes('/support_conversations')) {
        return Response.json([{
          id: 'conversation-1',
          support_request_id: 'support-request-1',
          subject: 'technical',
          status: 'open',
          priority: 'normal',
          requester_name: 'Ann Smith',
          requester_email: 'ann@example.com',
          requester_role: null,
          requester_avatar_url: null,
          last_message_preview: 'Old message',
          last_message_at: '2026-05-29T23:00:00.000Z',
          created_at: '2026-05-29T22:00:00.000Z',
          updated_at: '2026-05-29T23:00:00.000Z',
        }])
      }
      throw new Error(`unexpected URL ${url}`)
    },
  })

  const message = await repository.createRequesterReply('conversation-1', ' I tried that and it still fails. ')

  assert.equal(message.id, 'message-requester-1')
  assert.equal(message.senderType, 'requester')
  assert.equal(sentAdminNotifications.length, 1)
  assert.equal(sentAdminNotifications[0].conversation.requesterEmail, 'ann@example.com')
  assert.equal(sentAdminNotifications[0].conversation.supportRequestId, 'support-request-1')
  assert.equal(sentAdminNotifications[0].message.body, 'I tried that and it still fails.')
  const insertBody = JSON.parse(calls.find((call) => call.url.includes('/support_messages?select=*')).init.body)
  assert.deepEqual(insertBody, {
    conversation_id: 'conversation-1',
    sender_type: 'requester',
    sender_name: 'Ann Smith',
    sender_avatar_url: null,
    body: 'I tried that and it still fails.',
    attachments: [],
    created_at: '2026-05-30T00:10:00.000Z',
  })
  const previewPatch = JSON.parse(calls.find((call) => call.url.includes('/support_conversations?id=eq.conversation-1') && call.init.method === 'PATCH').init.body)
  assert.deepEqual(previewPatch, {
    last_message_preview: 'I tried that and it still fails.',
    last_message_at: '2026-05-30T00:10:00.000Z',
    updated_at: '2026-05-30T00:10:00.000Z',
  })
  await assert.rejects(() => repository.createRequesterReply('conversation-1', '   '), /Reply body is required/)
})

test('requester follow-up notification sender posts admin email through Loops', async () => {
  const notificationsPath = resolve(repoRoot, 'apps/web/lib/support-request-notifications.js')
  const { createRequesterReplyNotificationSender } = await import(`${notificationsPath}?cacheBust=${Date.now()}`)
  const calls = []
  const sender = createRequesterReplyNotificationSender({
    loopsApiKey: 'loops-key',
    transactionalId: 'loops-requester-reply-template-id',
    toEmail: 'tonyfortugno22@gmail.com',
    appBaseUrl: 'http://127.0.0.1:3005',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json({ success: true })
    },
  })

  const result = await sender.sendRequesterReplyNotification({
    conversation: {
      id: 'conversation-1',
      supportRequestId: 'support-request-1',
      requesterName: 'Ann Smith',
      requesterEmail: 'ann@example.com',
      subject: 'technical',
    },
    message: {
      body: 'I tried that and it still fails.',
      createdAt: '2026-05-30T00:10:00.000Z',
    },
  })

  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  const body = JSON.parse(calls[0].init.body)
  assert.equal(body.transactionalId, 'loops-requester-reply-template-id')
  assert.equal(body.email, 'tonyfortugno22@gmail.com')
  assert.deepEqual(body.dataVariables, {
    conversationId: 'conversation-1',
    supportRequestId: 'support-request-1',
    requesterName: 'Ann Smith',
    requesterEmail: 'ann@example.com',
    subject: 'technical',
    replyBody: 'I tried that and it still fails.',
    repliedAt: 'May 29, 2026, 8:10 p.m.',
    adminUrl: 'http://127.0.0.1:3005/admin/support?conversationId=conversation-1',
  })
})

test('support inbox shell passes selected real conversation into real message thread and honors email deep links', () => {
  assert.ok(existsSync(shellPath), 'support inbox shell should exist')
  assert.ok(existsSync(threadPath), 'support conversation thread should exist')
  const shellSource = readFileSync(shellPath, 'utf8')
  const threadSource = readFileSync(threadPath, 'utf8')

  assert.match(shellSource, /selectedConversation/)
  assert.match(shellSource, /useSearchParams/, 'support inbox should read conversationId from email deep links')
  assert.match(shellSource, /<Suspense fallback=\{<SupportInboxLoadingFallback \/>\}>/, 'support inbox should wrap useSearchParams in a Suspense boundary for production builds')
  assert.match(shellSource, /const deepLinkedConversationId = searchParams\.get\("conversationId"\)/, 'support inbox should use the conversationId query param as the initial target')
  assert.match(shellSource, /targetConversationId=\{deepLinkedConversationId\}/, 'support inbox should pass the deep-linked id into the sidebar loader')
  assert.match(shellSource, /onSelectConversation=\{setSelectedConversation\}/)
  assert.match(shellSource, /SupportConversationThread/)
  assert.doesNotMatch(shellSource, /ChatExampleComponent/, 'real support shell should not render the static reference chat demo')
  assert.match(threadSource, /fetch\(`\/api\/admin\/support\/conversations\/\$\{conversation\.id\}\/messages`\)/)
  assert.doesNotMatch(threadSource, /mockAPI\.getEvents|mockAPI\.postEvent/, 'real support thread should not use mock chat events for visible messages')
})

test('support inbox repository sends admin replies by email and records delivery status', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const sentEmails = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T23:00:00.000Z',
    replyEmailSender: {
      async sendSupportReplyEmail(payload) {
        sentEmails.push(payload)
        return { sent: true, providerMessageId: 'loops-message-1' }
      },
    },
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      const urlText = String(url)
      if (urlText.includes('/support_conversations') && init?.method !== 'PATCH') {
        return Response.json([{
          id: 'conversation-1',
          subject: 'Program access question',
          requester_name: 'Ann Smith',
          requester_email: 'ann@example.com',
          status: 'open',
        }])
      }
      if (urlText.includes('/support_messages') && init?.method === 'POST') {
        return Response.json([{
          id: 'message-admin-1',
          conversation_id: 'conversation-1',
          sender_type: 'admin',
          sender_name: 'PPLUS Support',
          sender_avatar_url: null,
          body: 'Thanks, we are checking this now.',
          attachments: [],
          delivery_status: 'pending',
          delivery_error: null,
          delivered_at: null,
          created_at: '2026-05-29T23:00:00.000Z',
          updated_at: '2026-05-29T23:00:00.000Z',
        }], { status: 201 })
      }
      if (urlText.includes('/support_messages') && init?.method === 'PATCH') {
        const body = JSON.parse(init.body)
        return Response.json([{
          id: 'message-admin-1',
          conversation_id: 'conversation-1',
          sender_type: 'admin',
          sender_name: 'PPLUS Support',
          sender_avatar_url: null,
          body: 'Thanks, we are checking this now.',
          attachments: [],
          delivery_status: body.delivery_status,
          delivery_error: body.delivery_error ?? null,
          delivered_at: body.delivered_at ?? null,
          created_at: '2026-05-29T23:00:00.000Z',
          updated_at: '2026-05-29T23:00:00.000Z',
        }])
      }
      return Response.json([{ id: 'conversation-1' }])
    },
  })

  const message = await repository.createAdminReply('conversation-1', ' Thanks, we are checking this now. ')

  assert.equal(sentEmails.length, 1)
  assert.equal(sentEmails[0].conversation.requesterEmail, 'ann@example.com')
  assert.equal(sentEmails[0].message.body, 'Thanks, we are checking this now.')
  assert.equal(message.deliveryStatus, 'sent')
  assert.equal(message.deliveryError, null)
  assert.equal(message.deliveredAt, '2026-05-29T23:00:00.000Z')
  const insertBody = JSON.parse(calls.find((call) => call.url.includes('/support_messages?select=*') && call.init.method === 'POST').init.body)
  assert.equal(insertBody.delivery_status, 'pending')
  const deliveryPatchBody = JSON.parse(calls.find((call) => call.url.includes('/support_messages?id=eq.message-admin-1')).init.body)
  assert.equal(deliveryPatchBody.delivery_status, 'sent')
  assert.equal(deliveryPatchBody.delivery_error, null)
})

test('support inbox repository falls back when live support_messages lacks delivery columns', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const sentEmails = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T23:05:00.000Z',
    replyEmailSender: {
      async sendSupportReplyEmail(payload) {
        sentEmails.push(payload)
        return { sent: true, providerMessageId: 'loops-message-legacy' }
      },
    },
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init })
      const urlText = String(url)
      if (urlText.includes('/support_messages') && !init.method && urlText.includes('delivered_at')) {
        return Response.json({ message: 'column support_messages.delivered_at does not exist' }, { status: 400 })
      }
      if (urlText.includes('/support_messages') && !init.method) {
        return Response.json([{ id: 'message-1', conversation_id: 'conversation-1', sender_type: 'requester', sender_name: 'Hermes Smoke', sender_avatar_url: null, body: 'Live legacy inbox smoke test', attachments: [], created_at: '2026-05-29T23:04:00.000Z', updated_at: '2026-05-29T23:04:00.000Z' }])
      }
      if (urlText.includes('/support_messages') && init.method === 'POST' && JSON.parse(init.body).delivery_status) {
        return Response.json({ message: "Could not find the 'delivered_at' column of 'support_messages' in the schema cache" }, { status: 400 })
      }
      if (urlText.includes('/support_messages') && init.method === 'POST') {
        return Response.json([{ id: 'message-admin-legacy', conversation_id: 'conversation-1', sender_type: 'admin', sender_name: 'PPLUS Support', sender_avatar_url: null, body: 'Legacy reply.', attachments: [], created_at: '2026-05-29T23:05:00.000Z', updated_at: '2026-05-29T23:05:00.000Z' }], { status: 201 })
      }
      return Response.json([{ id: 'conversation-1', subject: 'Legacy support', requester_name: 'Hermes Smoke', requester_email: 'smoke@example.com' }])
    },
  })

  const messages = await repository.listConversationMessages('conversation-1')
  const reply = await repository.createAdminReply('conversation-1', 'Legacy reply.')

  assert.equal(messages[0].body, 'Live legacy inbox smoke test')
  assert.equal(reply.id, 'message-admin-legacy')
  assert.equal(sentEmails.length, 1)
  assert.equal(sentEmails[0].conversation.requesterEmail, 'smoke@example.com')
  assert.equal(sentEmails[0].message.body, 'Legacy reply.')
  assert.equal(reply.deliveryStatus, 'sent')
  assert.equal(reply.deliveryError, null)
  assert.ok(calls.some((call) => call.url.includes('/support_messages?select=') && call.url.includes('delivered_at')))
  assert.ok(calls.some((call) => call.url.includes('/support_messages?select=') && !call.url.includes('delivered_at')))
  assert.ok(calls.some((call) => call.init?.method === 'POST' && !JSON.parse(call.init.body).delivery_status))
  assert.ok(!calls.some((call) => call.init?.method === 'PATCH' && call.url.includes('/support_messages?id=')))
})

test('support inbox repository keeps saved replies and marks delivery failed when email send fails', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T23:10:00.000Z',
    replyEmailSender: {
      async sendSupportReplyEmail() {
        throw new Error('Loops rejected the template')
      },
    },
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      const urlText = String(url)
      if (urlText.includes('/support_conversations') && init?.method !== 'PATCH') {
        return Response.json([{ id: 'conversation-1', subject: 'Invite email', requester_name: 'Coach Miller', requester_email: 'coach@example.com' }])
      }
      if (urlText.includes('/support_messages') && init?.method === 'POST') {
        return Response.json([{ id: 'message-admin-1', conversation_id: 'conversation-1', sender_type: 'admin', sender_name: 'PPLUS Support', body: 'Trying again.', attachments: [], delivery_status: 'pending', delivery_error: null, delivered_at: null, created_at: '2026-05-29T23:10:00.000Z', updated_at: '2026-05-29T23:10:00.000Z' }], { status: 201 })
      }
      if (urlText.includes('/support_messages') && init?.method === 'PATCH') {
        const body = JSON.parse(init.body)
        return Response.json([{ id: 'message-admin-1', conversation_id: 'conversation-1', sender_type: 'admin', sender_name: 'PPLUS Support', body: 'Trying again.', attachments: [], delivery_status: body.delivery_status, delivery_error: body.delivery_error, delivered_at: body.delivered_at ?? null, created_at: '2026-05-29T23:10:00.000Z', updated_at: '2026-05-29T23:10:00.000Z' }])
      }
      return Response.json([{ id: 'conversation-1' }])
    },
  })

  const message = await repository.createAdminReply('conversation-1', 'Trying again.')

  assert.equal(message.deliveryStatus, 'failed')
  assert.match(message.deliveryError, /Loops rejected the template/)
  const deliveryPatchBody = JSON.parse(calls.find((call) => call.url.includes('/support_messages?id=eq.message-admin-1')).init.body)
  assert.equal(deliveryPatchBody.delivery_status, 'failed')
  assert.match(deliveryPatchBody.delivery_error, /Loops rejected the template/)
})

test('support inbox repository updates conversation status with the approved support states', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    now: () => '2026-05-29T23:20:00.000Z',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json([{
        id: 'conversation-1',
        support_request_id: 'support-request-1',
        subject: 'Program access question',
        status: JSON.parse(init.body).status,
        priority: 'normal',
        requester_name: 'Ann Smith',
        requester_email: 'ann@example.com',
        requester_role: 'athlete',
        requester_avatar_url: null,
        last_message_preview: 'Thanks.',
        last_message_at: '2026-05-29T23:00:00.000Z',
        created_at: '2026-05-29T22:00:00.000Z',
        updated_at: '2026-05-29T23:20:00.000Z',
      }])
    },
  })

  const conversation = await repository.updateConversationStatus('conversation-1', 'closed')

  assert.equal(conversation.status, 'closed')
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/support_conversations?id=eq.conversation-1&select=*')
  assert.equal(calls[0].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    status: 'closed',
    updated_at: '2026-05-29T23:20:00.000Z',
  })
  await assert.rejects(() => repository.updateConversationStatus('conversation-1', 'deleted'), /Unsupported support conversation status/)
})

test('support inbox repository searches conversations by requester, email, or subject only', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json([])
    },
  })

  await repository.listConversations({ search: 'ann@example.com' })

  const decodedUrl = decodeURIComponent(calls[0].url)
  assert.match(decodedUrl, /or=\(/)
  assert.match(decodedUrl, /requester_name\.ilike\.\*ann@example.com\*/)
  assert.match(decodedUrl, /requester_email\.ilike\.\*ann@example.com\*/)
  assert.match(decodedUrl, /subject\.ilike\.\*ann@example.com\*/)
  assert.doesNotMatch(decodedUrl, /last_message_preview\.ilike|body\.ilike|support_messages/)
})

test('support sidebar gates demo fallback to non-production empty states and sends real search to the API', () => {
  assert.ok(existsSync(resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx')), 'support sidebar should exist')
  const source = readFileSync(resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx'), 'utf8')

  assert.match(source, /shouldUseDemoConversations = process\.env\.NODE_ENV !== "production"/)
  assert.match(source, /searchQuery/)
  assert.match(source, /\/api\/admin\/support\/conversations\?search=/)
  assert.match(source, /mappedConversations\.length \? mappedConversations : \(shouldUseDemoConversations && !searchQuery\.trim\(\) \? supportConversations : \[\]\)/)
  assert.doesNotMatch(source, /mappedConversations\.length \? mappedConversations : supportConversations/, 'production empty support inbox must not show Ann Smith style demo fallback')
})

test('support conversation thread exposes admin status controls and PATCHes approved states', () => {
  const source = readFileSync(threadPath, 'utf8')

  for (const status of ['open', 'pending', 'closed', 'archived']) {
    assert.match(source, new RegExp(`value="${status}"`), `missing ${status} status option`)
  }
  assert.match(source, /async function handleStatusChange\(nextStatus\)/)
  assert.match(source, /method: "PATCH"/)
  assert.match(source, /body: JSON\.stringify\(\{ status: nextStatus \}\)/)
  assert.match(source, /support-conversation-status-updated/)
})

test('support sidebar search stays scoped to conversation metadata instead of message bodies or previews', async () => {
  const { createSupportInboxRepository } = await import(`${repositoryPath}?cacheBust=${Date.now()}`)
  const calls = []
  const repository = createSupportInboxRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      return Response.json([])
    },
  })

  await repository.listConversations({ search: 'missing video' })

  const decodedUrl = decodeURIComponent(calls[0].url).replace(/\+/g, ' ')
  assert.match(decodedUrl, /support_conversations\?select=/)
  assert.match(decodedUrl, /requester_name\.ilike\.\*missing video\*/)
  assert.match(decodedUrl, /requester_email\.ilike\.\*missing video\*/)
  assert.match(decodedUrl, /subject\.ilike\.\*missing video\*/)
  assert.doesNotMatch(decodedUrl, /last_message_preview\.ilike|support_messages|body\.ilike|message\.ilike/, 'sidebar search must not search support message bodies or latest message preview')
})

test('support conversation thread has a header search input scoped to messages in the selected conversation', () => {
  const source = readFileSync(threadPath, 'utf8')

  assert.match(source, /const \[messageSearchQuery, setMessageSearchQuery\] = useState\(""\)/)
  assert.match(source, /aria-label="Search messages"/)
  assert.match(source, /placeholder="Search messages\.\.\."/)
  assert.match(source, /const filteredMessages = useMemo\(\(\) =>/)
  assert.match(source, /msg\.content\?\.text\?\.toLowerCase\(\)\.includes\(normalizedMessageSearch\)/)
  assert.match(source, /filteredMessages\.map\(\(msg, index, allMessages\) =>/)
  assert.doesNotMatch(source, /\/messages\?search=|searchParams\.get\('messageSearch'\)/, 'message search should be scoped inside the selected thread, not wired to sidebar conversation search')
})

test('support sidebar filtering does not clear the currently open chat thread when no conversations match', () => {
  const source = readFileSync(resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx'), 'utf8')
  const emptyStateSource = readFileSync(resolve(repoRoot, 'apps/web/components/admin/support/support-empty-state.jsx'), 'utf8')
  const threadSource = readFileSync(threadPath, 'utf8')

  assert.match(source, /onSelectConversation\?\.\(\(current\) => \{\s*if \(searchQuery\.trim\(\)\) \{\s*return current\s*\}/, 'sidebar search should preserve the currently selected conversation while filtering the list')
  assert.match(source, /targetConversationId \? nextConversations\.find\(\(conversation\) => conversation\.id === targetConversationId\) : null/, 'sidebar should select the deep-linked conversation after loading the inbox list')
  assert.match(source, /SupportEmptyState/, 'sidebar should use the shared support empty-state component instead of a one-off blank div')
  assert.match(threadSource, /SupportEmptyState/, 'chat thread should use the same shared support empty-state component for visual consistency')
  assert.match(emptyStateSource, /EmptyContent/, 'shared support empty-state should support actions like clearing a search')
  assert.match(source, /actionLabel="Clear search"/, 'empty sidebar search should offer a clear-search action styled like the shadcn empty refresh action')
  assert.match(source, /onAction=\{\(\) => setSearchQuery\(""\)\}/, 'sidebar empty-state action should empty the sidebar search input')
  assert.match(threadSource, /actionLabel="Clear search"/, 'empty message search should use the same clear-search action pattern')
  assert.match(threadSource, /onAction=\{\(\) => setMessageSearchQuery\(""\)\}/, 'message empty-state action should empty the message search input')
  assert.match(source, /No conversations found/, 'sidebar should explain an empty search result instead of looking broken')
  assert.match(source, /Try another conversation search\./, 'sidebar empty state should clarify that only the sidebar search is empty')
  assert.doesNotMatch(source, /if \(searchQuery\.trim\(\)\) \{\s*return nextConversations\[0\] \|\| null\s*\}/, 'search filtering must not select null or the first filtered row into the chat panel')
})
