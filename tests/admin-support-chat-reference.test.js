import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const referencePagePath = resolve(repoRoot, 'apps/web/app/admin/support/reference/page.jsx')
const chatExamplePath = resolve(repoRoot, 'apps/web/app/admin/support/reference/chat-example.jsx')
const chatComponentPaths = [
  resolve(repoRoot, 'apps/web/components/chat/chat.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/chat-header.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/chat-messages.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/chat-toolbar.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/chat-event.jsx'),
]
const messageActionsDropdownPath = resolve(repoRoot, 'apps/web/components/chat/message-actions/message-actions-dropdown.jsx')

const requiredReferenceFiles = [
  referencePagePath,
  ...chatComponentPaths,
  resolve(repoRoot, 'apps/web/components/chat/chat-sidebar/chat-sidebar.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/message-search/search-sidebar-content.jsx'),
  resolve(repoRoot, 'apps/web/components/chat/profile/profile-sidebar-content.jsx'),
  resolve(repoRoot, 'apps/web/data/mock/support-chat/messages.js'),
  resolve(repoRoot, 'apps/web/data/mock/support-chat/users.js'),
  resolve(repoRoot, 'apps/web/data/mock/support-chat/mock-api.js'),
  resolve(repoRoot, 'apps/web/hooks/chat/use-chat-sidebar.js'),
  resolve(repoRoot, 'apps/web/hooks/chat/use-message-search.js'),
]

test('admin support chat reference route imports the shadcn-chat reference seams', () => {
  for (const filePath of requiredReferenceFiles) {
    assert.ok(existsSync(filePath), `expected shadcn-chat reference file to exist: ${filePath}`)
  }

  const pageSource = readFileSync(referencePagePath, 'utf8')
  const chatExampleSource = readFileSync(chatExamplePath, 'utf8')
  const usersSource = readFileSync(resolve(repoRoot, 'apps/web/data/mock/support-chat/users.js'), 'utf8')

  assert.match(pageSource, /SupportInboxShell/, 'reference route should render the PPLUS support inbox shell')
  assert.match(chatExampleSource, /ChatReferencePage|ChatExampleComponent/, 'reference chat example should render the imported shadcn-chat component')
  assert.match(chatExampleSource, /Ann Smith/, 'reference chat example should preserve the upstream Ann Smith sample contact')
  assert.match(usersSource, /John Doe/, 'reference mock data should preserve the upstream John Doe sample user')
  assert.match(readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-toolbar.jsx'), 'utf8'), /Type your message\.\.\./, 'reference chat toolbar should preserve the upstream composer placeholder')
  assert.match(chatExampleSource, /SearchSidebarContent/, 'reference chat example should keep the upstream search sidebar seam')
  assert.match(chatExampleSource, /ProfileSidebarContent/, 'reference chat example should keep the upstream profile sidebar seam')
  assert.doesNotMatch(chatExampleSource, /<ChatHeaderButton className="@2xl\/chat:inline-flex hidden">\s*<PhoneIcon \/>\s*<\/ChatHeaderButton>/, 'chat top bar should not render the phone action button')
  assert.doesNotMatch(chatExampleSource, /<ChatHeaderButton className="@2xl\/chat:inline-flex hidden">\s*<VideoIcon \/>\s*<\/ChatHeaderButton>/, 'chat top bar should not render the video action button')
  assert.match(chatExampleSource, /<ChatHeaderAddon className="min-w-0 flex-1 justify-end">/, 'chat top bar action area should stretch the search input toward the menu button')
  assert.match(chatExampleSource, /<InputGroup className="@2xl\/chat:flex hidden min-w-0 flex-1">/, 'chat top bar search input should take all available width before the three-dot menu')
  assert.match(chatExampleSource, /DropdownMenu/, 'chat top bar should keep the three-dot menu')
  assert.match(chatExampleSource, /<SearchIcon className="size-3\.5" \/>/, 'chat top bar dropdown search icon should be smaller than the trigger icon')
  assert.match(chatExampleSource, /<UserIcon className="size-3\.5" \/>/, 'chat top bar dropdown profile icon should be smaller than the trigger icon')
  assert.match(chatExampleSource, /<BanIcon className="size-3\.5" \/>/, 'chat top bar dropdown block icons should be smaller than the trigger icon')
  assert.match(chatExampleSource, /SidebarProvider[\s\S]*className="flex-1 min-h-0 w-full min-w-0"/, 'chat body provider should fill the available center width')
  assert.match(chatExampleSource, /messages\.length === 0/, 'main chat should explicitly render an empty state when there are no messages')
  assert.match(chatExampleSource, /<ChatEmptyState \/>/, 'empty message branch should render the dedicated chat empty-state block')
  assert.match(chatExampleSource, /No messages yet/, 'chat empty state should use the shadcn Empty pattern for no-message conversations')
  assert.match(chatExampleSource, /bg-\[radial-gradient/, 'chat empty state should use the shadcn Empty background treatment')
  assert.match(chatExampleSource, /SidebarInset className="min-h-0 w-full min-w-0 overflow-hidden"/, 'chat inset should stretch full width to the right utility sidebar')
  assert.doesNotMatch(chatExampleSource, /SupportConversationList|supportTickets|support_ticket|ResizablePanelGroup/, 'reference chat example must not become the PPLUS support inbox shell')
})

test('admin support chat core components expose the expected composable API', () => {
  for (const filePath of chatComponentPaths) {
    assert.ok(existsSync(filePath), `expected core chat component to exist: ${filePath}`)
  }

  const chatSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat.jsx'), 'utf8')
  const headerSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-header.jsx'), 'utf8')
  const messagesSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-messages.jsx'), 'utf8')
  const toolbarSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-toolbar.jsx'), 'utf8')
  const eventSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-event.jsx'), 'utf8')

  assert.match(chatSource, /function Chat\(/, 'core chat component should export Chat')
  assert.match(headerSource, /ChatHeader|ChatHeaderMain|ChatHeaderAvatar|ChatHeaderButton/, 'chat header component should expose header subcomponents')
  assert.match(messagesSource, /function ChatMessages\(/, 'chat messages component should expose ChatMessages')
  assert.match(toolbarSource, /ChatToolbar|ChatToolbarTextarea|ChatToolbarAttachment/, 'chat toolbar should expose composer subcomponents')
  assert.match(eventSource, /ChatEvent|ChatEventContent|ChatEventMessage/, 'chat event should expose message/event subcomponents')
})

test('admin support message action dropdown uses smaller menu icons', () => {
  const source = readFileSync(messageActionsDropdownPath, 'utf8')

  assert.match(source, /<PencilIcon className="size-3\.5" \/>/, 'message edit menu icon should be smaller')
  assert.match(source, /<Trash2Icon className="size-3\.5" \/>/, 'message delete menu icon should be smaller')
})

test('admin support chat reference borders use subtle white ten percent lines', () => {
  const filesToCheck = [
    chatExamplePath,
    resolve(repoRoot, 'apps/web/components/chat/chat-toolbar.jsx'),
    resolve(repoRoot, 'apps/web/components/chat/chat-sidebar/chat-sidebar.jsx'),
    resolve(repoRoot, 'apps/web/components/chat/message-search/search-sidebar-content.jsx'),
    resolve(repoRoot, 'apps/web/components/chat/message-items/message-content.jsx'),
  ]

  for (const filePath of filesToCheck) {
    const source = readFileSync(filePath, 'utf8')
    assert.match(source, /border-white\/10/, `expected subtle 10% white border in ${filePath}`)
  }

  const pageSource = readFileSync(chatExamplePath, 'utf8')
  const sidebarSource = readFileSync(resolve(repoRoot, 'apps/web/components/chat/chat-sidebar/chat-sidebar.jsx'), 'utf8')

  assert.doesNotMatch(pageSource, /className="border-b"/, 'reference header border should not use the default full-strength border token')
  assert.doesNotMatch(sidebarSource, /className="border-b flex-row|flex flex-col border-l bg-sidebar/, 'utility sidebar borders should not use default full-strength border tokens')
})
