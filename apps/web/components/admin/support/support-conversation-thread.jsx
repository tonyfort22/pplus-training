"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { PlusIcon, SendIcon, SmileIcon } from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"

import { SupportEmptyState } from "@/components/admin/support/support-empty-state"
import AdminThemeToggle from "@/components/admin/admin-theme-toggle"
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
import { ChatToolbar, ChatToolbarAddon, ChatToolbarAttachment, ChatToolbarAttachmentButton, ChatToolbarButton, ChatToolbarTextarea } from "@/components/chat/chat-toolbar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const [composerFiles, setComposerFiles] = useState([])
  const [emojiOpen, setEmojiOpen] = useState(false)
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
      setComposerFiles([])
      setTimeout(() => {
        chatMessagesRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      })
    } catch (nextError) {
      setError(nextError?.message || "Failed to send support reply")
    } finally {
      setIsSendingReply(false)
    }
  }

  function handleComposerFilesSelected(files) {
    setComposerFiles((currentFiles) => [...currentFiles, ...files])
  }

  function handleRemoveComposerFile(indexToRemove) {
    setComposerFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove))
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
      <ChatHeader className="support-inbox-topbar min-h-[70px]">
        <ChatHeaderAddon>
          <ChatHeaderAvatar
            className="support-inbox-conversation-avatar"
            src={conversation.avatar || conversation.requesterAvatarUrl || ""}
            alt={headerName}
            fallback={headerInitials}
          />
        </ChatHeaderAddon>
        <ChatHeaderMain>
          <span className="support-inbox-topbar-title font-medium">{headerName}</span>
          <span className="flex-1 grid">
            <span className="support-inbox-topbar-subtitle text-sm font-medium truncate">{subtitle}</span>
          </span>
        </ChatHeaderMain>
        <ChatHeaderAddon>
          <div className="hidden w-[240px] items-center md:flex">
            <input
              aria-label="Search messages"
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(event) => setMessageSearchQuery(event.target.value)}
              className="support-inbox-topbar-search-input h-[40px] min-h-[40px] w-full rounded-[12px] px-4 text-sm outline-none focus:border-[#3BE0AF]/40 focus:ring-2 focus:ring-[#3BE0AF]/15"
            />
          </div>
        </ChatHeaderAddon>
        <ChatHeaderAddon>
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger aria-label="Conversation status" className="support-inbox-status-trigger h-[40px] min-h-[40px] w-[132px] justify-between rounded-[12px] px-[14px] text-[0.8rem] font-medium capitalize">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="support-inbox-status-content">
              <SelectItem className="support-inbox-status-item" value="open">Open</SelectItem>
              <SelectItem className="support-inbox-status-item" value="pending">Pending</SelectItem>
              <SelectItem className="support-inbox-status-item" value="closed">Closed</SelectItem>
              <SelectItem className="support-inbox-status-item" value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </ChatHeaderAddon>
        <ChatHeaderAddon>
          <AdminThemeToggle />
        </ChatHeaderAddon>
      </ChatHeader>

      <ChatMessages ref={chatMessagesRef} className="support-inbox-message-list scrollbar-hidden">
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
                avatarClassName="support-inbox-conversation-avatar"
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

      {composerFiles.length > 0 ? (
        <div className="support-inbox-composer-attachment-row">
          {composerFiles.map((file, index) => (
            <ChatToolbarAttachment
              key={`${file.name}-${index}`}
              fileName={file.name}
              onRemove={() => handleRemoveComposerFile(index)}
            />
          ))}
        </div>
      ) : null}

      <ChatToolbar className="support-inbox-composer">
        <ChatToolbarAddon align="inline-start" className="support-inbox-composer-leading-actions">
          <ChatToolbarAttachmentButton
            aria-label="Add attachment"
            className="support-inbox-composer-icon-button"
            onFilesSelected={handleComposerFilesSelected}
          >
            <PlusIcon />
          </ChatToolbarAttachmentButton>
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <ChatToolbarButton aria-label="Add emoji" className="support-inbox-composer-icon-button" type="button">
                <SmileIcon />
              </ChatToolbarButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="top">
              <EmojiPicker
                theme={Theme.AUTO}
                onEmojiClick={(emojiData) => {
                  setReplyText((currentText) => currentText + emojiData.emoji)
                  setEmojiOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </ChatToolbarAddon>
        <ChatToolbarTextarea
          aria-label="Message composer"
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          className="support-inbox-composer-input"
          placeholder="Type your message..."
        />
        <ChatToolbarAddon align="inline-end" className="support-inbox-composer-send-action">
          <ChatToolbarButton
            aria-label="Send message"
            className="support-inbox-composer-send-button"
            disabled={!replyText.trim() || isSendingReply}
            onClick={handleSubmitReply}
            type="button"
          >
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
