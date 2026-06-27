import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  WEB_BROWSER_SMOKE_HARNESS,
  WEB_TEST_LAYERS,
} from '../apps/web/testing/page-test-manifest.js'

const repoRoot = process.cwd()
const supportWorkflowSpecPath = 'apps/web/e2e/admin-support-workflows.spec.js'
const supportWorkflowSpecFullPath = join(repoRoot, supportWorkflowSpecPath)

test('admin Support workflow manifest includes seeded inbox, select-conversation, and safe draft workflows', () => {
  assert.equal(WEB_BROWSER_SMOKE_HARNESS.adminSupportSafeWorkflowSpecFile, supportWorkflowSpecPath)
  assert.deepEqual(WEB_BROWSER_SMOKE_HARNESS.adminSupportSafeWorkflowChecks, [
    {
      id: 'admin-support-open-inbox-seeded-conversation',
      route: '/admin/support',
      interaction: 'open-support-inbox-loads-seeded-conversation-and-messages',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-support-select-conversation-view-messages',
      route: '/admin/support',
      interaction: 'select-conversation-loads-its-message-thread',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-support-draft-reply-without-send',
      route: '/admin/support',
      interaction: 'draft-reply-does-not-post-unless-explicit-test-send-mode',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
})

test('admin Support inbox seeded conversation workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(supportWorkflowSpecFullPath), true, `missing Support workflow spec: ${supportWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(supportWorkflowSpecFullPath, 'utf8')
  const shellSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-inbox-shell.jsx'), 'utf8')
  const sidebarSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx'), 'utf8')
  const threadSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-conversation-thread.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_SUPPORT_OPEN_INBOX_SEEDED_CONVERSATION_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-support-open-inbox-seeded-conversation/)
  assert.match(workflowSpecSource, /Open support inbox with seeded conversation/)
  assert.match(workflowSpecSource, /open-support-inbox-loads-seeded-conversation-and-messages/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /seedAdminBrowserSession\(page\)/)
  assert.match(workflowSpecSource, /pplus_admin_access_token/)
  assert.match(workflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/support\/conversations\?\*\*['"]/)
  assert.match(workflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/support\/conversations\/support-conversation-1\/messages['"]/)
  assert.match(workflowSpecSource, /seededSupportConversations/)
  assert.match(workflowSpecSource, /seededSupportMessages/)
  assert.match(workflowSpecSource, /Program access question/)
  assert.match(workflowSpecSource, /Ann Smith/)
  assert.match(workflowSpecSource, /Can you confirm my next block is showing correctly\?/)
  assert.match(workflowSpecSource, /Support inbox shell/)
  assert.match(workflowSpecSource, /expect\(conversationRequests\)\.toHaveLength\(1\)/)
  assert.match(workflowSpecSource, /expect\(messageRequests\)\.toEqual\(\['support-conversation-1'\]\)/)

  assert.match(shellSource, /targetConversationId=\{deepLinkedConversationId\}/)
  assert.match(sidebarSource, /targetConversationId/)
  assert.match(sidebarSource, /onSelectConversation\?\.\(\(current\) =>/)
  assert.match(sidebarSource, /nextConversations\[0\] \|\| null/)
  assert.match(threadSource, /fetch\(`\/api\/admin\/support\/conversations\/\$\{conversation\.id\}\/messages`\)/)
  assert.match(threadSource, /mapSupportMessageToChatMessage/)
})

test('admin Support select conversation workflow loads the selected thread messages', () => {
  assert.equal(existsSync(supportWorkflowSpecFullPath), true, `missing Support workflow spec: ${supportWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(supportWorkflowSpecFullPath, 'utf8')
  const shellSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-inbox-shell.jsx'), 'utf8')
  const sidebarSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx'), 'utf8')
  const threadSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-conversation-thread.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_SUPPORT_SELECT_CONVERSATION_VIEW_MESSAGES_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-support-select-conversation-view-messages/)
  assert.match(workflowSpecSource, /Select conversation and view messages/)
  assert.match(workflowSpecSource, /select-conversation-loads-its-message-thread/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /seededSupportConversations[\s\S]*support-conversation-2/)
  assert.match(workflowSpecSource, /Coach Miller/)
  assert.match(workflowSpecSource, /Invite email not received/)
  assert.match(workflowSpecSource, /seededSupportMessagesByConversation/)
  assert.match(workflowSpecSource, /coach-message-1/)
  assert.match(workflowSpecSource, /The athlete code worked, but the email never landed\./)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Open conversation with Coach Miller' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /locator\(['"]#message-coach-message-1['"]\)/)
  assert.match(workflowSpecSource, /expect\(messageRequests\)\.toEqual\(\['support-conversation-1', 'support-conversation-2'\]\)/)
  assert.match(workflowSpecSource, /expect\(page\.locator\(['"]#message-support-message-1['"]\)\)\.toHaveCount\(0\)/)

  assert.match(shellSource, /const \[selectedConversation, setSelectedConversation\] = useState\(null\)/)
  assert.match(shellSource, /onSelectConversation=\{setSelectedConversation\}/)
  assert.match(sidebarSource, /aria-label=\{`Open conversation with \$\{conversation\.name\}`\}/)
  assert.match(sidebarSource, /onClick=\{\(\) => onSelectConversation\?\.\(conversation\)\}/)
  assert.match(threadSource, /useEffect\(\(\) => \{[\s\S]*fetch\(`\/api\/admin\/support\/conversations\/\$\{conversation\.id\}\/messages`\)[\s\S]*\}, \[conversation\?\.id\]\)/)
})

test('admin Support draft reply workflow keeps typed text local and does not post without explicit test send mode', () => {
  assert.equal(existsSync(supportWorkflowSpecFullPath), true, `missing Support workflow spec: ${supportWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(supportWorkflowSpecFullPath, 'utf8')
  const threadSource = readFileSync(join(repoRoot, 'apps/web/components/admin/support/support-conversation-thread.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_SUPPORT_DRAFT_REPLY_WITHOUT_SEND_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-support-draft-reply-without-send/)
  assert.match(workflowSpecSource, /Draft reply without accidental send unless test mode is explicit/)
  assert.match(workflowSpecSource, /draft-reply-does-not-post-unless-explicit-test-send-mode/)
  assert.match(workflowSpecSource, /draftReplyText\s*=\s*'Draft only: checking invite delivery before replying\.'/)
  assert.match(workflowSpecSource, /postMessageRequests\s*=\s*\[\]/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(workflowSpecSource, /throw new Error\('Unexpected admin support reply POST without explicit test send mode'\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]textbox['"], \{ name: 'Message composer' \}\)\.fill\(draftReplyText\)/)
  assert.match(workflowSpecSource, /keyboard\.press\(['"]Enter['"]\)/)
  assert.match(workflowSpecSource, /expect\(page\.getByRole\(['"]textbox['"], \{ name: 'Message composer' \}\)\)\.toHaveValue\(draftReplyText\)/)
  assert.match(workflowSpecSource, /expect\(postMessageRequests\)\.toEqual\(\[\]\)/)
  assert.match(workflowSpecSource, /toHaveCount\(0\)/)

  assert.match(threadSource, /aria-label="Message composer"/)
  assert.doesNotMatch(threadSource, /onSubmit=\{handleSubmitReply\}/, 'Enter in the Support composer should not send a reply')
  assert.match(threadSource, /onClick=\{handleSubmitReply\}/, 'the explicit Send button should remain the only send path')
  assert.match(threadSource, /disabled=\{!replyText\.trim\(\) \|\| isSendingReply\}/, 'empty drafts should keep Send disabled')
})
