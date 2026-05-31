# Admin Support Shadcn Chat Implementation Plan

> **For Hermes:** Do not implement UI from this plan until Anthony explicitly approves the phase. Use subagent-driven-development only after the reference target and first implementation slice are approved.

**Goal:** Build a PPLUS admin support page by first reproducing the `shadcn-chat` reference exactly in isolation, then wrapping it with a support inbox conversation list.

**Architecture:** Keep the imported chat reference isolated from PPLUS support/product logic. First create an untouched reference route under `/admin/support/reference`; then create the real `/admin/support` page using a left ticket/conversation list plus the imported chat detail pane. Backend persistence comes later after the static UI is approved.

**Tech Stack:** Next.js 15.3.1 app router, React 19, Tailwind v4, local shadcn-style primitives under `apps/web/components/ui`, Mesailor `shadcn-chat` registry JSON, lucide-react.

---

## Reference decision

Use this as the primary chat component reference:

- Demo/docs: `https://shadcn-chat.vercel.app/`
- GitHub: `https://github.com/Mesailor/shadcn-chat`
- Full example block: `https://shadcn-chat.vercel.app/r/chat-basic.json`
- Core chat components: `https://shadcn-chat.vercel.app/r/chat.json`

Important finding: the `chat-basic` block has a sidebar, but it is **not** a left conversation list. It is a right utility panel with only two views:

- `search`
- `profile`

So the final support inbox needs one custom left conversation/ticket list built around the reference chat pane.

## Hard guardrails

1. Do not build the final support UI before reproducing the reference route.
2. Do not introduce database tables in the first UI pass.
3. Do not restyle the chat during the reference reproduction phase.
4. Keep `/admin/support/reference` available as the untouched comparison surface while adapting `/admin/support`.
5. Do not pretend the shadcn-chat sidebar is a ticket/conversation list. It is Search/Profile only.
6. If registry code needs compatibility changes for this repo, keep those changes mechanical and document them.
7. No outbound support notifications/emails/invites from this work.

## Current branch

Created clean branch:

```bash
git switch -c admin-support-shadcn-chat
```

Base repo:

```text
/Users/anthonyfortugno/.openclaw.pre-migration/workspace/projects/pplus-training
```

---

## Reference inventory

### `chat-basic.json` dependencies

Registry dependencies:

```text
https://shadcn-chat.vercel.app/r/chat.json
separator
input-group
sidebar
badge
popover
button
dropdown-menu
skeleton
dialog
avatar
sheet
```

NPM dependencies from registry:

```text
@radix-ui/react-separator
@radix-ui/react-slot
class-variance-authority
emoji-picker-react
```

Repo already has many local primitives:

```text
apps/web/components/ui/avatar.jsx
apps/web/components/ui/badge.jsx
apps/web/components/ui/button.jsx
apps/web/components/ui/dialog.jsx
apps/web/components/ui/dropdown-menu.jsx
apps/web/components/ui/input-group.jsx
apps/web/components/ui/separator.jsx
apps/web/components/ui/sheet.jsx
apps/web/components/ui/sidebar.jsx
apps/web/components/ui/skeleton.jsx
apps/web/components/ui/textarea.jsx
```

Dependency gap to verify before implementation:

```text
emoji-picker-react
@radix-ui/react-separator
@radix-ui/react-slot
```

`class-variance-authority` already exists in `apps/web/package.json`.

### Primitive/component checklist

#### Support sidebar reuse guardrails

Anthony flagged two existing admin-sidebar issues that must be handled before using the pattern for support:

1. The top logo can visually double up if both the full logo and mark logo render together, or if a support shell adds its own logo on top of the existing brand area.
2. The collapsed menu can leak a caret/chevron from the original athlete/account dropdown sidebar controls.

Implementation rule: reuse the admin sidebar **pattern and primitives**, not the whole current `AdminDashboardSidebar` instance. The support sidebar must have its own stripped shell:

```text
SupportConversationSidebar
  Shared/AdminSidebarBrand: exactly one visible logo at any state
  SidebarTrigger: keep close/open behavior
  SupportConversationList: Item-based ticket rows
  No SidebarWorkspaceSwitcher / athlete dropdown
  No SidebarAccountSwitcher / bottom account dropdown
```

Source issue to avoid:

```text
apps/web/components/admin/admin-shell.jsx
  SidebarBrandLogo currently contains full logo + collapsed mark logo
  SidebarWorkspaceSwitcher contains ChevronsUpDown for athlete selector
  SidebarAccountSwitcher contains BadgeCheck + ChevronsUpDown for account selector
```

The support shell should not render `SidebarWorkspaceSwitcher` or `SidebarAccountSwitcher` at all, so their chevrons cannot leak in collapsed mode.

Add/extend tests before building support shell:

```text
Support sidebar renders one brand/logo target, not two.
Support sidebar source does not import/render SidebarWorkspaceSwitcher.
Support sidebar source does not import/render SidebarAccountSwitcher.
Support sidebar source does not include ChevronsUpDown/caret dropdown icons.
Support sidebar keeps SidebarTrigger/open-close behavior.
```

#### Left conversation/ticket list component choice

Use the local shadcn `Item` primitive as the actual row component for the left support conversation list.

Source already exists:

```text
apps/web/components/ui/item.jsx
```

Use these exports for each ticket row:

```text
ItemGroup        -> wraps the ticket rows
Item             -> clickable ticket/conversation row
ItemMedia        -> avatar/status dot area
ItemContent      -> customer name, subject, preview
ItemTitle        -> customer/subject title
ItemDescription  -> message preview
ItemActions      -> timestamp / unread count / overflow action
ItemHeader       -> title + timestamp line
ItemFooter       -> priority/status/role metadata line
```

This is a better fit than `Sidebar` for the inner conversation list because the app already has an admin sidebar. The support inbox left pane is a selectable list, not global navigation.

#### Primitives already present locally

These can be used without adding new shadcn registry components:

```text
apps/web/components/ui/avatar.jsx       -> customer/avatar initials
apps/web/components/ui/badge.jsx        -> status, priority, unread count
apps/web/components/ui/button.jsx       -> icon buttons, row actions
apps/web/components/ui/card.jsx         -> optional support panel shell
apps/web/components/ui/dialog.jsx       -> delete/block dialogs from chat-basic
apps/web/components/ui/dropdown-menu.jsx -> message/ticket overflow menus
apps/web/components/ui/input.jsx        -> ticket search input
apps/web/components/ui/input-group.jsx  -> shadcn-chat header/search input group
apps/web/components/ui/item.jsx         -> left ticket/conversation rows
apps/web/components/ui/scroll-area.jsx  -> scrollable ticket list
apps/web/components/ui/separator.jsx    -> list/header separators
apps/web/components/ui/sheet.jsx        -> mobile/right utility sidebar
apps/web/components/ui/sidebar.jsx      -> required by chat-basic right utility panel only
apps/web/components/ui/skeleton.jsx     -> loading rows/messages
apps/web/components/ui/tabs.jsx         -> Open/Pending/Resolved tabs
apps/web/components/ui/textarea.jsx     -> chat composer
apps/web/components/ui/tooltip.jsx      -> optional icon affordances
```

#### Shadcn primitives to add

```text
resizable
```

Anthony wants resizable panes for the support inbox. Add the shadcn `Resizable` primitive before building `/admin/support`, then use it for the left ticket list and chat detail split.

Expected local file after install/copy:

```text
apps/web/components/ui/resizable.jsx
```

Expected dependency to verify/add:

```text
react-resizable-panels
```

Use it in the support page shell like this conceptually:

```text
ResizablePanelGroup direction="horizontal"
  ResizablePanel defaultSize={32} minSize={24} maxSize={42} -> SupportConversationList
  ResizableHandle
  ResizablePanel defaultSize={68} minSize={58} -> shadcn-chat detail pane
```

Do not use `Resizable` inside `/admin/support/reference`; the reference route should stay as close to `chat-basic` as possible.

#### NPM/runtime dependencies to add or verify

From `chat-basic.json` and support shell primitives:

```text
emoji-picker-react        -> missing from apps/web/package.json, needed if keeping emoji picker
react-resizable-panels    -> missing from apps/web/package.json, needed for shadcn Resizable
@radix-ui/react-separator -> not listed directly, but repo uses radix-ui aggregate; verify build before adding
@radix-ui/react-slot      -> not listed directly, but repo uses radix-ui aggregate; verify build before adding
```

If the copied registry code imports from `radix-ui` aggregate instead of scoped Radix packages after JSX conversion, do not add redundant scoped packages.

### Files from `chat.json`

Target component paths should be adapted to JSX unless we decide to add TS support for these files:

```text
apps/web/components/chat/chat.jsx
apps/web/components/chat/chat-header.jsx
apps/web/components/chat/chat-messages.jsx
apps/web/components/chat/chat-toolbar.jsx
apps/web/components/chat/chat-event.jsx
```

Source registry paths:

```text
registry/new-york/chat/chat.tsx
registry/new-york/chat/chat-header.tsx
registry/new-york/chat/chat-messages.tsx
registry/new-york/chat/chat-toolbar.tsx
registry/new-york/chat/chat-event.tsx
```

### Files from `chat-basic.json`

Reference route/page:

```text
apps/web/app/admin/support/reference/page.jsx
```

Mock data:

```text
apps/web/data/mock/support-chat/messages.js
apps/web/data/mock/support-chat/users.js
apps/web/data/mock/support-chat/mock-api.js
```

Hooks:

```text
apps/web/hooks/chat/use-messages.js
apps/web/hooks/chat/use-message-reactions.js
apps/web/hooks/chat/use-message-search.js
apps/web/hooks/chat/use-message-actions.js
apps/web/hooks/chat/use-profile.js
apps/web/hooks/chat/use-chat-sidebar.js
apps/web/hooks/use-is-wider.js
```

Block components:

```text
apps/web/components/chat/message-items/primary-message.jsx
apps/web/components/chat/message-items/additional-message.jsx
apps/web/components/chat/message-items/date-item.jsx
apps/web/components/chat/message-items/message-content.jsx
apps/web/components/chat/message-items/primary-message-skeleton.jsx
apps/web/components/chat/message-items/date-item-skeleton.jsx
apps/web/components/chat/message-items/message-preview.jsx
apps/web/components/chat/message-reactions/reactions-popover.jsx
apps/web/components/chat/message-actions/message-actions-dropdown.jsx
apps/web/components/chat/message-actions/delete-dialog.jsx
apps/web/components/chat/message-search/search-sidebar-content.jsx
apps/web/components/chat/profile/profile-sidebar-content.jsx
apps/web/components/chat/profile/block-dialog.jsx
apps/web/components/chat/chat-sidebar/chat-sidebar.jsx
```

---

## Phase 1: Reference audit and compatibility check

**Objective:** Confirm exactly what will be imported and what needs mechanical adaptation.

**Files:**
- Read: `apps/web/package.json`
- Read: `apps/web/components/ui/*`
- Read: remote registry JSON URLs above
- Test: create/update `tests/admin-support-chat-reference.test.js`

**Steps:**

1. Fetch both registry JSON files with Python or curl and save temporary copies outside the repo, or inspect them directly without writing.
2. Compare registry dependencies against existing `apps/web/components/ui` primitives.
3. Confirm whether `emoji-picker-react` is absent from `apps/web/package.json`.
4. Confirm local import helper path is `apps/web/lib/utils` or equivalent. The registry uses `@/lib/utils`; this repo may use relative imports or local alias support. Do not guess.
5. Write `tests/admin-support-chat-reference.test.js` with source-level assertions for the planned reference route and imported component seams. It should fail before implementation.
6. Run:

```bash
node --test tests/admin-support-chat-reference.test.js
```

Expected before implementation: fail because `/admin/support/reference` and `components/chat` do not exist.

**Acceptance:** We have a failing focused test that locks the reference route and required seams.

---

## Phase 2: Import core chat components only

**Objective:** Add the reusable `components/chat` core from `chat.json` with only mechanical JSX/path changes.

**Files:**
- Create: `apps/web/components/chat/chat.jsx`
- Create: `apps/web/components/chat/chat-header.jsx`
- Create: `apps/web/components/chat/chat-messages.jsx`
- Create: `apps/web/components/chat/chat-toolbar.jsx`
- Create: `apps/web/components/chat/chat-event.jsx`
- Modify only if required: package dependencies

**Steps:**

1. Copy the five files from `https://shadcn-chat.vercel.app/r/chat.json`.
2. Convert TypeScript syntax to JSX only if the app does not compile TS in component files.
3. Fix imports to this repo's real utility and UI paths.
4. Do not change visual classes unless the build requires a class incompatibility fix.
5. Run focused source test. It may still fail because the reference page is not added yet.
6. Run:

```bash
pnpm --dir apps/web build
```

**Acceptance:** Core chat components compile in this repo.

---

## Phase 3: Import `chat-basic` reference route

**Objective:** Render the reference chat example at `/admin/support/reference` with original sample data and behavior.

**Files:**
- Create: `apps/web/app/admin/support/reference/page.jsx`
- Create all mock data/hooks/block components listed above
- Modify: `apps/web/package.json` only for missing dependencies

**Steps:**

1. Copy `chat-basic` files from `chat-basic.json` into the planned target paths.
2. Convert TypeScript to JSX mechanically.
3. Preserve sample data: `Ann Smith`, `John Doe`, original messages, search/profile flows.
4. Keep the right utility sidebar as Search/Profile. Do not turn it into tickets.
5. Ensure the reference page is full-height and isolated. It does not need to be in admin nav yet.
6. Run:

```bash
node --test tests/admin-support-chat-reference.test.js
pnpm --dir apps/web build
```

7. Start/restart preview on port 3005 and verify:

```bash
PORT=3005 NODE_OPTIONS="--no-experimental-webstorage" pnpm --dir apps/web start
```

8. Browser-verify:

```text
http://127.0.0.1:3005/admin/support/reference
```

Check that these exist visually/DOM-wise:

- Ann Smith header
- message list
- composer placeholder `Type your message...`
- search button/sidebar
- profile sidebar path
- no 500s in console

**Acceptance:** `/admin/support/reference` reproduces the upstream `chat-basic` block in PPLUS without product customization.

---

## Phase 4: Create static support inbox page shell

**Objective:** Add the missing left ticket/conversation list around the imported chat pane, using static data first.

**Files:**
- Create: `apps/web/app/admin/support/page.jsx` or use route config if direct app route conflicts
- Create: `apps/web/components/admin/support/support-inbox-page.jsx`
- Create: `apps/web/components/admin/support/support-conversation-list.jsx`
- Create: `apps/web/components/admin/support/support-ticket-data.js`
- Modify: `apps/web/components/admin/admin-navigation.js` only after Anthony approves showing it in nav
- Test: extend `tests/admin-support-chat-reference.test.js` or create `tests/admin-support-inbox-page.test.js`

**Layout target:**

```text
/admin/support
┌──────────────────────────────────────────────────────────────┐
│ Admin shell                                                   │
│ ┌───────────────┬───────────────────────────────────────────┐ │
│ │ Ticket list   │ Chat detail pane using shadcn-chat         │ │
│ │ Search/tabs   │ Header/message list/composer              │ │
│ │ Open/Pending  │ Right utility sidebar remains Search/Profile│ │
│ └───────────────┴───────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Static support ticket fields for v1:

```js
{
  id: 'ticket_001',
  customerName: 'Sarah Miller',
  customerEmail: 'sarah@example.com',
  role: 'Athlete',
  subject: 'Workout calendar question',
  preview: 'I cannot see my assigned lower body day...',
  status: 'open',
  priority: 'high',
  lastMessageAt: '2m ago',
  unreadCount: 2,
}
```

**Steps:**

1. Write failing source test for `/admin/support` support inbox seams:
   - `SupportInboxPage`
   - `SupportConversationList`
   - visible labels `Open`, `Pending`, `Resolved`
   - static ticket seed data
   - imported chat pane usage
2. Build the static support inbox layout.
3. Use existing local shadcn primitives: `Avatar`, `Badge`, `Button`, `Input`, `Tabs`, `ScrollArea` if available.
4. Do not wire backend.
5. Run focused tests and build.
6. Live verify `/admin/support`.

**Acceptance:** `/admin/support` displays a real support-inbox shell with a left ticket list and a chat detail pane, but still uses static data.

---

## Phase 5: PPLUS styling pass

**Objective:** Adapt the approved static support page to PPLUS admin styling without losing reference structure.

**Files:**
- Modify: `apps/web/components/admin/support/*`
- Modify: relevant CSS only if needed
- Test: source-level admin support UI regression

**Rules:**

1. Keep the reference page untouched.
2. Apply PPLUS admin surface tokens and density only to `/admin/support`.
3. Keep shadcn-chat message layout recognizable.
4. Do not change behavior while styling.

**Acceptance:** Anthony approves the visual direction against screenshots/live preview.

---

## Phase 6: Backend/persistence later

**Objective:** Only after UI approval, design database-backed support tickets/messages.

Potential tables, not for first pass:

```text
support_tickets
support_ticket_messages
support_ticket_events
support_ticket_assignments
```

Likely API routes, not for first pass:

```text
/api/admin/support/tickets
/api/admin/support/tickets/[ticketId]
/api/admin/support/tickets/[ticketId]/messages
```

**Acceptance:** Not started until static UI is approved.

---

## Verification checklist before calling Phase 1-3 done

Run:

```bash
node --test tests/admin-support-chat-reference.test.js
pnpm --dir apps/web build
```

Live checks:

```text
/admin/support/reference returns 200
No browser console 500/import errors
Ann Smith / John Doe sample thread visible
Search sidebar opens
Profile sidebar opens
Composer visible
```

## Verification checklist before calling Phase 4 done

Run:

```bash
node --test tests/admin-support-chat-reference.test.js tests/admin-support-inbox-page.test.js
pnpm --dir apps/web build
```

Live checks:

```text
/admin/support returns 200
Left ticket/conversation list visible
Chat detail pane visible
Static ticket selection works if implemented
No backend/network dependency required
```

## Out of scope for the first branch slice

- Real support DB schema
- Real reply sending
- Emails/notifications
- AI bot behavior
- Coach/athlete auth-specific support routing
- Full responsive mobile polish beyond not breaking the reference behavior
