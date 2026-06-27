"use client"

import { useEffect, useState } from "react"
import { SupportEmptyState } from "@/components/admin/support/support-empty-state"
import Avatar from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const supportConversations = [
  {
    id: "conv-ann-smith",
    name: "Ann Smith",
    initials: "AS",
    role: "Athlete",
    subject: "Program access question",
    preview: "Can you confirm my next block is showing correctly?",
    time: "9:42 AM",
    status: "Open",
    priority: "High",
    unread: 3,
    active: true,
    avatar: "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png",
  },
  {
    id: "conv-coach-miller",
    name: "Coach Miller",
    initials: "CM",
    role: "Coach",
    subject: "Invite email not received",
    preview: "The athlete code worked, but the email never landed.",
    time: "8:15 AM",
    status: "Pending",
    priority: "Medium",
    unread: 1,
    avatar: "https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_7.png",
  },
  {
    id: "conv-jack-lee",
    name: "Jack Lee",
    initials: "JL",
    role: "Athlete",
    subject: "Workout video missing",
    preview: "The sled push video opens blank on mobile.",
    time: "Yesterday",
    status: "Open",
    priority: "Low",
    unread: 0,
    avatar: "https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_21.png",
  },
]

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

function formatConversationTime(value) {
  if (!value) return "Now"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Now"

  const now = new Date()
  const isSameDay = date.toDateString() === now.toDateString()
  if (isSameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function mapApiConversationToSidebarConversation(conversation, index) {
  const name = conversation.requesterName || conversation.requesterEmail || "Support user"

  return {
    id: conversation.id,
    name,
    initials: getInitials(name),
    role: conversation.requesterRole || "User",
    subject: conversation.subject || "Support conversation",
    preview: conversation.lastMessagePreview || "No messages yet.",
    time: formatConversationTime(conversation.lastMessageAt || conversation.createdAt),
    status: conversation.status || "Open",
    priority: conversation.priority || "Normal",
    unread: 0,
    active: index === 0,
    avatar: conversation.requesterAvatarUrl || "",
  }
}

function SupportConversationSidebar({ selectedConversationId, targetConversationId, onSelectConversation }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const shouldUseDemoConversations = process.env.NODE_ENV !== "production"
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState(shouldUseDemoConversations ? supportConversations : [])

  useEffect(() => {
    let isMounted = true

    async function loadConversations() {
      try {
        const response = await fetch(`/api/admin/support/conversations?search=${encodeURIComponent(searchQuery.trim())}`)
        if (!response.ok) return

        const payload = await response.json()
        const mappedConversations = Array.isArray(payload?.conversations)
          ? payload.conversations.map(mapApiConversationToSidebarConversation)
          : []

        if (isMounted) {
          const nextConversations = mappedConversations.length ? mappedConversations : (shouldUseDemoConversations && !searchQuery.trim() ? supportConversations : [])
          setConversations(nextConversations)
          onSelectConversation?.((current) => {
            if (searchQuery.trim()) {
              return current
            }
            const targetConversation = targetConversationId ? nextConversations.find((conversation) => conversation.id === targetConversationId) : null
            if (targetConversation) return targetConversation
            return current && nextConversations.some((conversation) => conversation.id === current.id) ? current : nextConversations[0] || null
          })
        }
      } catch {
        if (isMounted) {
          const fallbackConversations = shouldUseDemoConversations && !searchQuery.trim() ? supportConversations : []
          setConversations(fallbackConversations)
          onSelectConversation?.((current) => {
            if (searchQuery.trim()) {
              return current
            }
            return current || fallbackConversations[0] || null
          })
        }
      }
    }

    loadConversations()

    return () => {
      isMounted = false
    }
  }, [onSelectConversation, searchQuery, shouldUseDemoConversations, targetConversationId])

  useEffect(() => {
    function handleConversationUpdated(event) {
      const { conversationId, preview, lastMessageAt } = event.detail || {}
      if (!conversationId) return

      setConversations((currentConversations) => currentConversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation
        return {
          ...conversation,
          preview: preview || conversation.preview,
          time: formatConversationTime(lastMessageAt),
        }
      }))
    }

    function handleConversationStatusUpdated(event) {
      const { conversationId, status } = event.detail || {}
      if (!conversationId || !status) return

      setConversations((currentConversations) => currentConversations.map((conversation) => (
        conversation.id === conversationId ? { ...conversation, status } : conversation
      )))
    }

    window.addEventListener("support-conversation-updated", handleConversationUpdated)
    window.addEventListener("support-conversation-status-updated", handleConversationStatusUpdated)
    return () => {
      window.removeEventListener("support-conversation-updated", handleConversationUpdated)
      window.removeEventListener("support-conversation-status-updated", handleConversationStatusUpdated)
    }
  }, [])

  return (
    <Sidebar collapsible="icon" className="support-inbox-sidebar border-r">
      <SidebarHeader className="support-inbox-sidebar-header gap-3 p-0 group-data-[collapsible=icon]:px-0">
        <div className="support-inbox-sidebar-brand-row flex min-h-[70px] items-center gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          {!isCollapsed ? (
            <>
              <img className="support-inbox-sidebar-logo-dark h-5 w-auto" src="/admin/logo_pplus_training.svg" alt="PPLUS Training" />
              <img className="support-inbox-sidebar-logo-light h-5 w-auto" src="/admin/logo_ppht_light_mode.svg" alt="PPLUS Training" />
            </>
          ) : null}
          <SidebarTrigger className="support-inbox-sidebar-trigger ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
        <div className="flex w-full items-center px-3 pb-4 group-data-[collapsible=icon]:hidden">
          <SidebarInput
            aria-label="Search conversations"
            placeholder="Search support..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="support-inbox-sidebar-search-input h-[40px] min-h-[40px] w-full rounded-[12px] px-4 text-sm focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <ItemGroup className="gap-2 group-data-[collapsible=icon]:gap-2">
              {conversations.length === 0 && searchQuery.trim() ? (
                <div className="group-data-[collapsible=icon]:hidden">
                  <SupportEmptyState
                    compact
                    title="No conversations found"
                    description="Try another conversation search."
                    actionLabel="Clear search"
                    onAction={() => setSearchQuery("")}
                  />
                </div>
              ) : null}
              {conversations.map((conversation) => (
                <SupportConversationRow
                  key={conversation.id}
                  conversation={{ ...conversation, active: conversation.id === selectedConversationId }}
                  onSelectConversation={onSelectConversation}
                />
              ))}
            </ItemGroup>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function SupportConversationRow({ conversation, onSelectConversation }) {
  return (
    <Item
      asChild
      variant="default"
      className={
        conversation.active
          ? "support-inbox-conversation-row support-inbox-conversation-row-active px-3 py-2.5 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-1"
          : "support-inbox-conversation-row support-inbox-conversation-row-idle px-3 py-2.5 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-1"
      }
    >
      <button
        type="button"
        aria-label={`Open conversation with ${conversation.name}`}
        className="flex w-full min-w-0 items-start gap-3 text-left group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
        onClick={() => onSelectConversation?.(conversation)}
      >
        <ItemMedia className="pt-0.5 group-data-[collapsible=icon]:pt-0">
          <Avatar
            alt={conversation.name}
            className="support-inbox-conversation-avatar"
            initials={conversation.initials}
            src={conversation.avatar || undefined}
          />
        </ItemMedia>
        <ItemContent className="min-w-0 flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
          <ItemHeader className="min-w-0 gap-2">
            <span className="support-inbox-conversation-name min-w-0 flex-1 truncate text-xs font-medium">{conversation.name}</span>
            <span className="support-inbox-conversation-time shrink-0 text-[11px]">{conversation.time}</span>
          </ItemHeader>
          <ItemTitle className="support-inbox-conversation-subject min-w-0 w-full overflow-hidden text-[13px]">
            <span className="block min-w-0 overflow-hidden truncate whitespace-nowrap">{conversation.subject}</span>
          </ItemTitle>
          <ItemDescription className="support-inbox-conversation-preview truncate text-xs">{conversation.preview}</ItemDescription>
        </ItemContent>
        {conversation.unread ? (
          <ItemActions className="shrink-0 self-start group-data-[collapsible=icon]:hidden">
            <Badge className="h-5 rounded-full bg-[#3BE0AF] px-1.5 text-[11px] font-semibold text-[#05110D] hover:bg-[#3BE0AF]">
              {conversation.unread}
            </Badge>
          </ItemActions>
        ) : null}
      </button>
    </Item>
  )
}

export { SupportConversationSidebar, SupportConversationRow }
