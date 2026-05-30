"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { SearchIcon, SendIcon } from "lucide-react"

import { SupportEmptyState } from "@/components/admin/support/support-empty-state"
import { Chat } from "@/components/chat/chat"
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderAvatar,
  ChatHeaderMain,
} from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { DateItem } from "@/components/chat/message-items/date-item"
import { PrimaryMessage } from "@/components/chat/message-items/primary-message"
import { PrimaryMessageSkeleton } from "@/components/chat/message-items/primary-message-skeleton"
import { ChatToolbar, ChatToolbarAddon, ChatToolbarButton, ChatToolbarTextarea } from "@/components/chat/chat-toolbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ADMIN_USER = {
  id: "pplus-support-admin",
  name: "PPLUS Support",
  avatarUrl: "/admin/logo_pplus_mark_green.svg",
  username: "@pplus-support",
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

function mapSupportMessageToChatMessage(message) {
  const isAdmin = message.senderType === "admin"
  const senderName = message.senderName || (isAdmin ? ADMIN_USER.name : "Support user")

  return {
    id: message.id,
    status: "sent",
    sender: isAdmin
      ? ADMIN_USER
      : {
          id: `requester-${message.conversationId}`,
          name: senderName,
          avatarUrl: message.senderAvatarUrl || "",
          username: `@${senderName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "support-user"}`,
        },
    timestamp: new Date(message.createdAt).getTime(),
    content: {
      type: "message",
      text: message.body,
    },
  }
}

function SupportConversationThread({ conversation }) {
  const chatMessagesRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState("")
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [status, setStatus] = useState(conversation?.status || "open")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setStatus(conversation?.status || "open")
    setMessageSearchQuery("")
  }, [conversation?.id, conversation?.status])

  useEffect(() => {
    if (!conversation?.id) {
      setMessages([])
      return
    }

    let isMounted = true

    async function loadMessages() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/support/conversations/${conversation.id}/messages`)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || "Failed to load support messages")

        if (isMounted) {
          setMessages(Array.isArray(payload?.messages) ? payload.messages.map(mapSupportMessageToChatMessage).reverse() : [])
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError?.message || "Failed to load support messages")
          setMessages([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [conversation?.id])

  async function handleStatusChange(nextStatus) {
    if (!conversation?.id || nextStatus === status || isUpdatingStatus) return

    const previousStatus = status
    setStatus(nextStatus)
    setIsUpdatingStatus(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/support/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Failed to update support status")

      window.dispatchEvent(new CustomEvent("support-conversation-status-updated", {
        detail: {
          conversationId: conversation.id,
          status: payload.conversation?.status || nextStatus,
        },
      }))
    } catch (nextError) {
      setStatus(previousStatus)
      setError(nextError?.message || "Failed to update support status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleSubmitReply() {
    const trimmedReply = replyText.trim()
    if (!conversation?.id || !trimmedReply || isSendingReply) return

    setIsSendingReply(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/support/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: trimmedReply }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Failed to send support reply")

      setMessages((currentMessages) => [mapSupportMessageToChatMessage(payload.message), ...currentMessages])
      window.dispatchEvent(new CustomEvent("support-conversation-updated", {
        detail: {
          conversationId: conversation.id,
          preview: payload.message?.body || trimmedReply,
          lastMessageAt: payload.message?.createdAt || new Date().toISOString(),
        },
      }))
      setReplyText("")
      setTimeout(() => {
        chatMessagesRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      })
    } catch (nextError) {
      setError(nextError?.message || "Failed to send support reply")
    } finally {
      setIsSendingReply(false)
    }
  }

  const headerInitials = useMemo(() => getInitials(conversation?.name || conversation?.requesterName || ""), [conversation])
  const headerName = conversation?.name || conversation?.requesterName || "Support conversation"
  const subtitle = conversation?.subject || conversation?.requesterEmail || "Support request"
  const filteredMessages = useMemo(() => {
    const normalizedMessageSearch = messageSearchQuery.trim().toLowerCase()
    if (!normalizedMessageSearch) return messages

    return messages.filter((msg) => msg.content?.text?.toLowerCase().includes(normalizedMessageSearch))
  }, [messageSearchQuery, messages])

  if (!conversation) {
    return <SupportConversationEmptyState title="No conversation selected" description="Select a support conversation from the sidebar." />
  }

  return (
    <Chat className="h-svh">
      <ChatHeader className="border-b border-white/10">
        <ChatHeaderAddon>
          <ChatHeaderAvatar src={conversation.avatar || conversation.requesterAvatarUrl || ""} alt={headerName} fallback={headerInitials} />
        </ChatHeaderAddon>
        <ChatHeaderMain>
          <span className="font-medium">{headerName}</span>
          <span className="flex-1 grid">
            <span className="text-sm font-medium truncate text-[#8EA0BC]">{subtitle}</span>
          </span>
        </ChatHeaderMain>
        <ChatHeaderAddon>
          <div className="relative hidden w-[240px] items-center md:flex">
            <input
              aria-label="Search messages"
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(event) => setMessageSearchQuery(event.target.value)}
              className="h-8 w-full rounded-full border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white outline-none placeholder:text-[#6F819D] focus:border-[#3BE0AF]/40 focus:ring-2 focus:ring-[#3BE0AF]/15"
            />
            <SearchIcon className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#6F819D]" />
          </div>
        </ChatHeaderAddon>
        <ChatHeaderAddon>
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger aria-label="Conversation status" className="h-8 w-[132px] rounded-full border-white/10 bg-white/[0.04] text-xs capitalize">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </ChatHeaderAddon>
      </ChatHeader>

      <ChatMessages ref={chatMessagesRef} className="scrollbar-hidden">
        {loading && Array.from({ length: 4 }).map((_, index) => <PrimaryMessageSkeleton key={index} className="mt-4 w-full" />)}
        {!loading && error ? <SupportConversationEmptyState title="Messages unavailable" description={error} /> : null}
        {!loading && !error && messages.length === 0 ? <SupportConversationEmptyState title="No messages yet" description="This support conversation has no saved messages." /> : null}
        {!loading && !error && messages.length > 0 && filteredMessages.length === 0 ? (
          <SupportConversationEmptyState
            title="No matching messages"
            description="Try another search term in this conversation."
            actionLabel="Clear search"
            onAction={() => setMessageSearchQuery("")}
          />
        ) : null}
        {!loading && !error && filteredMessages.map((msg, index, allMessages) => {
          const nextMessage = allMessages[index + 1]
          const showDate = new Date(msg.timestamp).toDateString() !== new Date(nextMessage?.timestamp).toDateString()

          return (
            <Fragment key={msg.id}>
              <PrimaryMessage
                id={`message-${msg.id}`}
                avatarSrc={msg.sender.avatarUrl}
                avatarAlt={msg.sender.username}
                avatarFallback={getInitials(msg.sender.name)}
                senderName={msg.sender.name}
                content={msg.content}
                timestamp={msg.timestamp}
                status={msg.status}
              />
              {showDate ? <DateItem timestamp={msg.timestamp} className="my-4" /> : null}
            </Fragment>
          )
        })}
      </ChatMessages>

      <ChatToolbar>
        <div className="w-full min-w-0 pb-1">
          <ChatToolbarTextarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            onSubmit={handleSubmitReply}
            placeholder="Type your message..."
          />
        </div>
        <ChatToolbarAddon align="inline-end">
          <ChatToolbarButton variant="default" disabled={!replyText.trim() || isSendingReply} onClick={handleSubmitReply}>
            <SendIcon />
          </ChatToolbarButton>
        </ChatToolbarAddon>
      </ChatToolbar>
    </Chat>
  )
}

function SupportConversationEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-10">
      <SupportEmptyState title={title} description={description} actionLabel={actionLabel} onAction={onAction} />
    </div>
  )
}

export { SupportConversationThread }
