import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shellPath = resolve(repoRoot, 'apps/web/components/admin/support/support-inbox-shell.jsx')
const sidebarPath = resolve(repoRoot, 'apps/web/components/admin/support/support-conversation-sidebar.jsx')
const referencePagePath = resolve(repoRoot, 'apps/web/app/admin/support/reference/page.jsx')
const adminSupportPagePath = resolve(repoRoot, 'apps/web/app/admin/support/page.jsx')

test('support inbox shell uses a support-specific resizable sidebar around the chat reference', () => {
  assert.ok(existsSync(shellPath), 'expected support inbox shell component to exist')

  const source = readFileSync(shellPath, 'utf8')

  assert.match(source, /SupportConversationSidebar/, 'support shell should render the stripped support conversation sidebar')
  assert.match(source, /SupportInboxResizableLayout/, 'support shell should split provider state from the sidebar-owned resize layout')
  assert.match(source, /useSidebar/, 'support shell should read collapsed state to lock the sidebar rail width')
  assert.match(source, /const COLLAPSED_SIDEBAR_WIDTH = 64/, 'collapsed sidebar should be a fixed icon rail, not a percentage panel')
  assert.match(source, /const DEFAULT_SIDEBAR_WIDTH = 300/, 'expanded sidebar should own a pixel width that can be resized')
  assert.match(source, /style=\{\{ width: activeSidebarWidth, "--sidebar-width": `\$\{activeSidebarWidth\}px` \}\}/, 'sidebar wrapper should own the width and sidebar CSS variable')
  assert.match(source, /className="support-inbox-main min-w-0 flex-1"/, 'chat section should be pure flex-1 and fill remaining width through the theme-owned support inbox main surface')
  assert.doesNotMatch(source, /ResizablePanelGroup|ResizablePanel|defaultSize=\{isCollapsed \? 95 : 76\}/, 'support shell should not resize the chat as a percentage panel')
  assert.doesNotMatch(source, /AdminDashboardSidebar|SidebarWorkspaceSwitcher|SidebarAccountSwitcher/, 'support shell must not reuse the full admin sidebar or its dropdown switchers')
})

test('support conversation sidebar keeps one brand logo, trigger behavior, and no leaked admin dropdown carets', () => {
  assert.ok(existsSync(sidebarPath), 'expected support conversation sidebar component to exist')

  const source = readFileSync(sidebarPath, 'utf8')
  const logoAssetMatches = source.match(/logo_pplus_training\.svg/g) ?? []
  const imageTagMatches = source.match(/<img\b/g) ?? []

  assert.equal(logoAssetMatches.length, 1, 'support sidebar should use exactly one dark-mode PPLUS training logo asset')
  assert.equal(imageTagMatches.length, 2, 'support sidebar should render one dark and one light logo source for theme parity, not collapsed duplicates')
  assert.match(source, /useSidebar/, 'support sidebar should read sidebar state for collapsed-safe logo rendering')
  assert.match(source, /!isCollapsed \? \([\s\S]*<img className="support-inbox-sidebar-logo-dark/, 'support sidebar should unmount the full logo while collapsed instead of clipping it')
  assert.match(source, /SidebarTrigger/, 'support sidebar should keep the shadcn sidebar open-close trigger')
  assert.match(source, /aria-label="Search conversations"/, 'support sidebar should keep the search input')
  assert.match(source, /className="support-inbox-sidebar-search-input h-\[40px\] min-h-\[40px\] w-full rounded-\[12px\] px-4 text-sm focus-visible:border-\[#3BE0AF\] focus-visible:ring-\[#3BE0AF\]\/20"/, 'support sidebar search should use the current admin input model')
  assert.doesNotMatch(source, /<Search className="pointer-events-none absolute left-3/, 'support sidebar search should not keep an embedded icon')
  assert.doesNotMatch(source, /Filter|Filter conversations|Button variant="ghost" size="icon-sm"/, 'support sidebar should not render a filter button beside search')
  assert.match(source, /SidebarRail/, 'support sidebar should keep desktop rail/collapse behavior')
  assert.match(source, /collapsible="icon"/, 'support sidebar should use real icon collapse behavior')
  assert.match(source, /ItemGroup/, 'support sidebar should build conversation rows with Item primitives')
  assert.match(source, /SupportConversationRow/, 'support sidebar should expose a real conversation-row seam')
  assert.doesNotMatch(source, /SidebarWorkspaceSwitcher|SidebarAccountSwitcher|ChevronsUpDown|logo_pplus_mark_green\.svg/, 'support sidebar must not leak admin dropdown switchers, caret icons, or a second collapsed logo mark')
})

test('support conversation sidebar fetches real conversations while preserving static visual fallback', () => {
  assert.ok(existsSync(sidebarPath), 'expected support conversation sidebar component to exist')

  const source = readFileSync(sidebarPath, 'utf8')

  assert.match(source, /useEffect/, 'support sidebar should fetch real conversations on mount')
  assert.match(source, /fetch\(`\/api\/admin\/support\/conversations\?search=\$\{encodeURIComponent\(searchQuery\.trim\(\)\)\}`\)/, 'support sidebar should read the real admin support conversations API with search')
  assert.match(source, /const nextConversations = mappedConversations\.length \? mappedConversations : \(shouldUseDemoConversations && !searchQuery\.trim\(\) \? supportConversations : \[\]\)/, 'empty live data should only keep the polished visual fallback in non-production unsearched states')
  assert.match(source, /if \(searchQuery\.trim\(\)\) \{\s*return current\s*\}/, 'support sidebar search should preserve the open chat thread instead of clearing the selected conversation')
  assert.match(source, /mapApiConversationToSidebarConversation/, 'support sidebar should adapt API rows to the existing visual row shape')
})

test('support conversation rows use a clean non-wrapping responsive card layout', () => {
  assert.ok(existsSync(sidebarPath), 'expected support conversation sidebar component to exist')

  const source = readFileSync(sidebarPath, 'utf8')

  assert.match(source, /<button[\s\S]*className="flex w-full min-w-0 items-start gap-3 text-left/, 'conversation row button should own a min-width-safe horizontal layout')
  assert.match(source, /ItemContent className="min-w-0 flex-1 overflow-hidden/, 'conversation content should be allowed to shrink instead of forcing wraps')
  assert.match(source, /ItemHeader className="min-w-0 gap-2"/, 'conversation header should keep name and time in one row')
  assert.match(source, /className="support-inbox-conversation-name min-w-0 flex-1 truncate/, 'conversation name should truncate cleanly')
  assert.match(source, /ItemTitle className="support-inbox-conversation-subject min-w-0 w-full overflow-hidden text-\[13px\]"/, 'conversation subject row should own the constrained width')
  assert.match(source, /<span className="block min-w-0 overflow-hidden truncate whitespace-nowrap"/, 'conversation subject text should use a hard inner block truncate rule like the preview')
  assert.match(source, /ItemDescription className="support-inbox-conversation-preview truncate/, 'conversation preview should be one-line truncated')
  assert.match(source, /ItemActions className="shrink-0 self-start/, 'unread badge should be fixed-width and not squeeze text')
  const rowSource = source.slice(source.indexOf('function SupportConversationRow'))
  assert.doesNotMatch(rowSource, /ItemFooter|conversation\.role|conversation\.priority|CircleDot|Circle className=/, 'conversation cards should not render footer role/priority/status noise')
  assert.doesNotMatch(source, /line-clamp-2/, 'conversation card preview should not wrap to a second line')
})

test('collapsed support conversation rows keep tappable avatar icons visible', () => {
  assert.ok(existsSync(sidebarPath), 'expected support conversation sidebar component to exist')

  const source = readFileSync(sidebarPath, 'utf8')
  const rowSource = source.slice(source.indexOf('function SupportConversationRow'))

  assert.doesNotMatch(rowSource, /<Item[\s\S]*group-data-\[collapsible=icon\]:hidden[\s\S]*<button/, 'collapsed support rows should not hide the whole conversation card')
  assert.match(source, /group-data-\[collapsible=icon\]:h-10 group-data-\[collapsible=icon\]:w-10/, 'collapsed support rows should become compact icon-size buttons')
  assert.match(source, /<Avatar\s+alt=\{conversation\.name\}\s+className="support-inbox-conversation-avatar"\s+initials=\{conversation\.initials\}\s+src=\{conversation\.avatar \|\| undefined\}/, 'collapsed support rows should keep the conversation avatar visible through the shared support avatar class')
  assert.match(source, /ItemContent className="[^"]*group-data-\[collapsible=icon\]:hidden/, 'collapsed support rows should hide only the text content')
  assert.match(source, /ItemActions className="[^"]*group-data-\[collapsible=icon\]:hidden/, 'collapsed support rows should hide unread badge text while preserving the avatar')
})

test('real admin support page renders the polished support inbox shell', () => {
  assert.ok(existsSync(adminSupportPagePath), 'expected real /admin/support page to exist')

  const source = readFileSync(adminSupportPagePath, 'utf8')

  assert.match(source, /SupportInboxShell/, 'real support route should render the polished support inbox shell')
  assert.doesNotMatch(source, /ChatExampleComponent|reference\/chat-example/, 'real support route should not expose the bare reference chat component directly')
})

test('support reference page renders the support inbox shell instead of the bare chat demo', () => {
  const source = readFileSync(referencePagePath, 'utf8')

  assert.match(source, /SupportInboxShell/, 'support reference route should render the support inbox shell')
  assert.doesNotMatch(source, /export \{\s*ChatExampleComponent as default\s*\}/, 'support reference route should no longer export the bare chat demo directly')
})
