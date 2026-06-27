# Admin Support Chat Visual Plan

Linked implementation plan: [[2026-05-29-admin-support-shadcn-chat]]

## Target shape

```mermaid
flowchart LR
  AdminShell[Admin shell] --> SupportPage[/admin/support]
  SupportPage --> Resizable[ResizablePanelGroup\nleft/right adjustable split]
  Resizable --> TicketList[Left pane\nTicket / conversation list]
  Resizable --> ChatPane[Center pane\nshadcn-chat detail]
  ChatPane --> ChatHeader[Chat header\nCustomer + actions]
  ChatPane --> Messages[Message timeline\nBubbles, dates, reactions]
  ChatPane --> Composer[Composer\nText, emoji, attachments]
  ChatPane --> UtilitySidebar[Right utility panel\nSearch / Profile]

  Reference[/admin/support/reference] --> ExactClone[Exact shadcn-chat reference clone]
  ExactClone -. kept untouched .-> ChatPane
```

## Page layout sketch

```text
/admin/support
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin shell                                                                  │
│ ┌──────────────────────────┬──────────────────────────────────────────────┐ │
│ │ Support inbox             │ Chat detail                                  │ │
│ │ ┌──────────────────────┐  │ ┌────────────────────────────────────────┐  │ │
│ │ │ Search tickets        │  │ │ Sarah Miller   Athlete   Open   ⋯     │  │ │
│ │ └──────────────────────┘  │ └────────────────────────────────────────┘  │ │
│ │ Open  Pending  Resolved   │ ┌────────────────────────────────────────┐  │ │
│ │                          │ │ Today                                  │  │ │
│ │ ● Sarah Miller      2m   │ │ Sarah: I can't see my workout...       │  │ │
│ │   Calendar issue         │ │ Coach/Admin: Let me check that.        │  │ │
│ │   High · Athlete         │ │                                        │  │ │
│ │                          │ │ Yesterday                              │  │ │
│ │ ○ Mike Roberts     15m   │ │ ...                                    │  │ │
│ │   Login problem          │ └────────────────────────────────────────┘  │ │
│ │                          │ ┌────────────────────────────────────────┐  │ │
│ │ ○ Jenna Lee        1h    │ │ Type your message...              Send │  │ │
│ │   Billing question       │ └────────────────────────────────────────┘  │ │
│ └──────────────────────────┴──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation phases

```mermaid
flowchart TD
  A[Phase 0\nLock reference] --> B[Phase 1\nAudit registry + dependencies]
  B --> C[Phase 2\nImport core chat components]
  C --> D[Phase 3\nBuild /admin/support/reference\nExact shadcn-chat clone]
  D --> E[Phase 4\nBuild /admin/support\nStatic left ticket list + chat pane]
  E --> F[Phase 5\nPPLUS styling pass]
  F --> G[Phase 6\nBackend tickets/messages later]
```

## Reference truth

```mermaid
flowchart LR
  ShadcnChat[Mesailor shadcn-chat] --> Core[Core chat components]
  ShadcnChat --> Basic[chat-basic block]
  Basic --> RightSidebar[Right sidebar]
  RightSidebar --> Search[Search]
  RightSidebar --> Profile[Profile]
  Basic -. does not include .-> ConversationList[Left conversation list]
  ConversationList --> CustomPPLUS[Custom PPLUS support ticket list]
```

## Guardrails

- First reproduce `shadcn-chat` exactly at `/admin/support/reference`.
- Do not style it into PPLUS before parity is proven.
- Do not wire DB or emails in the first UI pass.
- Keep the reference page untouched while adapting `/admin/support`.
- Build the left conversation/ticket list ourselves because the reference does not provide it.

## Left conversation list component

Use the existing local shadcn `Item` primitive for the left ticket/conversation rows:

```text
apps/web/components/ui/item.jsx
```

Row composition:

```text
ItemGroup        -> wraps ticket rows
Item             -> clickable conversation row
ItemMedia        -> avatar/status dot
ItemContent      -> customer, subject, preview
ItemTitle        -> customer/subject title
ItemDescription  -> latest message preview
ItemActions      -> timestamp/unread/action
ItemHeader       -> title + timestamp line
ItemFooter       -> priority/status/role metadata
```

Supporting primitives already present:

```text
Avatar, Badge, Button, Input, Item, ScrollArea, Separator, Tabs, DropdownMenu
```

Primitive to add:

```text
Resizable -> apps/web/components/ui/resizable.jsx
```

Expected dependency:

```text
react-resizable-panels
```

Use `ResizablePanelGroup` for the `/admin/support` left conversation list / chat detail split. Do not add it to `/admin/support/reference`.

Likely missing dependency if keeping the exact shadcn-chat emoji picker:

```text
emoji-picker-react
```

Do not add `Resizable` for v1 unless we decide the panes need to be user-resizable.

## File map

```mermaid
flowchart TD
  RefRoute[apps/web/app/admin/support/reference/page.jsx]
  SupportRoute[apps/web/app/admin/support/page.jsx]
  ChatComponents[apps/web/components/chat/*]
  SupportComponents[apps/web/components/admin/support/*]
  TicketList[SupportConversationList\nuses ui/item.jsx]
  MockData[apps/web/data/mock/support-chat/*]
  Hooks[apps/web/hooks/chat/*]
  Tests[tests/admin-support-chat-reference.test.js\ntests/admin-support-inbox-page.test.js]

  RefRoute --> ChatComponents
  RefRoute --> MockData
  RefRoute --> Hooks
  SupportRoute --> SupportComponents
  SupportComponents --> TicketList
  SupportComponents --> ResizablePrimitive[apps/web/components/ui/resizable.jsx]
  ResizablePrimitive --> ResizableDependency[react-resizable-panels]
  TicketList --> ItemPrimitive[apps/web/components/ui/item.jsx]
  SupportComponents --> ChatComponents
  Tests --> RefRoute
  Tests --> SupportRoute
```
