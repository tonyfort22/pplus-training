import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_SUPPORT_OPEN_INBOX_SEEDED_CONVERSATION_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-support-open-inbox-seeded-conversation',
  route: '/admin/support',
  interaction: 'open-support-inbox-loads-seeded-conversation-and-messages',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_SUPPORT_SELECT_CONVERSATION_VIEW_MESSAGES_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-support-select-conversation-view-messages',
  route: '/admin/support',
  interaction: 'select-conversation-loads-its-message-thread',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_SUPPORT_DRAFT_REPLY_WITHOUT_SEND_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-support-draft-reply-without-send',
  route: '/admin/support',
  interaction: 'draft-reply-does-not-post-unless-explicit-test-send-mode',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededSupportConversations = Object.freeze([
  {
    id: 'support-conversation-1',
    supportRequestId: 'support-request-1',
    subject: 'Program access question',
    status: 'open',
    priority: 'high',
    requesterName: 'Ann Smith',
    requesterEmail: 'ann.smith@example.com',
    requesterRole: 'athlete',
    requesterAvatarUrl: '',
    lastMessagePreview: 'Can you confirm my next block is showing correctly?',
    lastMessageAt: '2026-06-22T13:42:00.000Z',
    createdAt: '2026-06-22T13:30:00.000Z',
    updatedAt: '2026-06-22T13:42:00.000Z',
  },
  {
    id: 'support-conversation-2',
    supportRequestId: 'support-request-2',
    subject: 'Invite email not received',
    status: 'pending',
    priority: 'medium',
    requesterName: 'Coach Miller',
    requesterEmail: 'coach.miller@example.com',
    requesterRole: 'coach',
    requesterAvatarUrl: '',
    lastMessagePreview: 'The athlete code worked, but the email never landed.',
    lastMessageAt: '2026-06-22T12:15:00.000Z',
    createdAt: '2026-06-22T12:05:00.000Z',
    updatedAt: '2026-06-22T12:15:00.000Z',
  },
])

const seededSupportMessagesByConversation = Object.freeze({
  'support-conversation-1': [
    {
      id: 'support-message-1',
      conversationId: 'support-conversation-1',
      senderType: 'requester',
      senderName: 'Ann Smith',
      senderAvatarUrl: '',
      body: 'Can you confirm my next block is showing correctly?',
      attachments: [],
      deliveredAt: null,
      deliveryStatus: null,
      deliveryError: null,
      createdAt: '2026-06-22T13:42:00.000Z',
      updatedAt: '2026-06-22T13:42:00.000Z',
    },
    {
      id: 'support-message-2',
      conversationId: 'support-conversation-1',
      senderType: 'admin',
      senderName: 'PPLUS Support',
      senderAvatarUrl: null,
      body: 'Support inbox shell is loading the seeded thread.',
      attachments: [],
      deliveredAt: null,
      deliveryStatus: 'sent',
      deliveryError: null,
      createdAt: '2026-06-22T13:45:00.000Z',
      updatedAt: '2026-06-22T13:45:00.000Z',
    },
  ],
  'support-conversation-2': [
    {
      id: 'coach-message-1',
      conversationId: 'support-conversation-2',
      senderType: 'requester',
      senderName: 'Coach Miller',
      senderAvatarUrl: '',
      body: 'The athlete code worked, but the email never landed.',
      attachments: [],
      deliveredAt: null,
      deliveryStatus: null,
      deliveryError: null,
      createdAt: '2026-06-22T12:15:00.000Z',
      updatedAt: '2026-06-22T12:15:00.000Z',
    },
    {
      id: 'coach-message-2',
      conversationId: 'support-conversation-2',
      senderType: 'admin',
      senderName: 'PPLUS Support',
      senderAvatarUrl: null,
      body: 'We will check the invite delivery trail from here.',
      attachments: [],
      deliveredAt: null,
      deliveryStatus: 'sent',
      deliveryError: null,
      createdAt: '2026-06-22T12:18:00.000Z',
      updatedAt: '2026-06-22T12:18:00.000Z',
    },
  ],
})

async function seedAdminBrowserSession(page) {
  const cookieUrl = resolveWebBaseUrl()
  await page.context().addCookies([
    {
      name: 'pplus_admin_access_token',
      value: 'browser-smoke-access-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'pplus_admin_refresh_token',
      value: 'browser-smoke-refresh-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

async function mockSupportInboxApis(page, { conversationRequests, messageRequests, postMessageRequests = [], explicitTestSendMode = false }) {
  await page.route('**/api/admin/support/conversations?**', async (route) => {
    conversationRequests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conversations: seededSupportConversations }),
    })
  })
  await page.route('**/api/admin/support/conversations/support-conversation-1/messages', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      postMessageRequests.push(await request.postDataJSON())
      if (!explicitTestSendMode) throw new Error('Unexpected admin support reply POST without explicit test send mode')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: { ...seededSupportMessagesByConversation['support-conversation-1'][1], id: 'explicit-test-send-message', body: postMessageRequests.at(-1)?.body || '' } }),
      })
      return
    }
    messageRequests.push('support-conversation-1')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: seededSupportMessagesByConversation['support-conversation-1'] }),
    })
  })
  await page.route('**/api/admin/support/conversations/support-conversation-2/messages', async (route) => {
    messageRequests.push('support-conversation-2')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: seededSupportMessagesByConversation['support-conversation-2'] }),
    })
  })
}

test.describe('Admin Support workflows', () => {
  test('Open support inbox with seeded conversation', async ({ page }) => {
    const conversationRequests = []
    const messageRequests = []

    await seedAdminBrowserSession(page)
    await mockSupportInboxApis(page, { conversationRequests, messageRequests })

    await page.goto(`${ADMIN_SUPPORT_OPEN_INBOX_SEEDED_CONVERSATION_WORKFLOW_CHECK.route}?conversationId=support-conversation-1`, { waitUntil: 'load' })
    await assertCssLoaded(page, { route: ADMIN_SUPPORT_OPEN_INBOX_SEEDED_CONVERSATION_WORKFLOW_CHECK.route })
    await expect.poll(() => conversationRequests.length).toBe(1)

    await expect(page.locator('.support-inbox-shell')).toBeVisible()
    await expect(page.locator('.support-inbox-sidebar')).toBeVisible()
    await page.getByRole('button', { name: 'Open conversation with Ann Smith' }).click()
    await expect(page.locator('.support-inbox-topbar')).toBeVisible()
    await expect(page.locator('.support-inbox-composer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open conversation with Ann Smith' })).toBeVisible()
    await expect(page.locator('.support-inbox-conversation-row-active')).toContainText('Program access question')
    await expect(page.locator('.support-inbox-topbar-title')).toHaveText('Ann Smith')
    await expect(page.locator('.support-inbox-topbar-subtitle')).toHaveText('Program access question')
    await expect(page.locator('#message-support-message-1')).toContainText('Can you confirm my next block is showing correctly?')
    await expect(page.locator('#message-support-message-2')).toContainText('Support inbox shell is loading the seeded thread.')
    await expect(page.getByRole('textbox', { name: 'Search messages' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled()
    expect(conversationRequests).toHaveLength(1)
    expect(conversationRequests[0]).toContain('search=')
    expect(messageRequests).toEqual(['support-conversation-1'])
  })

  test('Select conversation and view messages', async ({ page }) => {
    const conversationRequests = []
    const messageRequests = []

    await seedAdminBrowserSession(page)
    await mockSupportInboxApis(page, { conversationRequests, messageRequests })

    await page.goto(`${ADMIN_SUPPORT_SELECT_CONVERSATION_VIEW_MESSAGES_WORKFLOW_CHECK.route}?conversationId=support-conversation-1`, { waitUntil: 'load' })
    await assertCssLoaded(page, { route: ADMIN_SUPPORT_SELECT_CONVERSATION_VIEW_MESSAGES_WORKFLOW_CHECK.route })
    await expect.poll(() => conversationRequests.length).toBe(1)

    await expect(page.locator('.support-inbox-conversation-row-active')).toContainText('Program access question')
    await expect(page.locator('#message-support-message-1')).toContainText('Can you confirm my next block is showing correctly?')

    await page.getByRole('button', { name: 'Open conversation with Coach Miller' }).click()

    await expect(page.locator('.support-inbox-conversation-row-active')).toContainText('Invite email not received')
    await expect(page.locator('.support-inbox-topbar-title')).toHaveText('Coach Miller')
    await expect(page.locator('.support-inbox-topbar-subtitle')).toHaveText('Invite email not received')
    await expect(page.locator('#message-coach-message-1')).toContainText('The athlete code worked, but the email never landed.')
    await expect(page.locator('#message-coach-message-2')).toContainText('We will check the invite delivery trail from here.')
    await expect(page.locator('#message-support-message-1')).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: 'Search messages' })).toHaveValue('')
    expect(conversationRequests).toHaveLength(1)
    expect(messageRequests).toEqual(['support-conversation-1', 'support-conversation-2'])
  })

  test('Draft reply without accidental send unless test mode is explicit', async ({ page }) => {
    const conversationRequests = []
    const messageRequests = []
    const postMessageRequests = []
    const draftReplyText = 'Draft only: checking invite delivery before replying.'

    await seedAdminBrowserSession(page)
    await mockSupportInboxApis(page, { conversationRequests, messageRequests, postMessageRequests })

    await page.goto(`${ADMIN_SUPPORT_DRAFT_REPLY_WITHOUT_SEND_WORKFLOW_CHECK.route}?conversationId=support-conversation-1`, { waitUntil: 'load' })
    await assertCssLoaded(page, { route: ADMIN_SUPPORT_DRAFT_REPLY_WITHOUT_SEND_WORKFLOW_CHECK.route })
    await expect.poll(() => conversationRequests.length).toBe(1)

    await page.getByRole('button', { name: 'Open conversation with Ann Smith' }).click()
    await expect(page.locator('#message-support-message-1')).toContainText('Can you confirm my next block is showing correctly?')
    await page.getByRole('textbox', { name: 'Message composer' }).fill(draftReplyText)
    await page.keyboard.press('Enter')

    await expect(page.getByRole('textbox', { name: 'Message composer' })).toHaveValue(draftReplyText)
    await expect(page.locator('#message-explicit-test-send-message')).toHaveCount(0)
    await expect(page.locator('.support-inbox-conversation-row-active')).toContainText('Program access question')
    expect(postMessageRequests).toEqual([])
    expect(messageRequests).toEqual(['support-conversation-1'])
  })
})
