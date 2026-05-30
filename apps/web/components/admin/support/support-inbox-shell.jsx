"use client"

import { Suspense, useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"

import { SupportConversationSidebar } from "@/components/admin/support/support-conversation-sidebar"
import { SupportConversationThread } from "@/components/admin/support/support-conversation-thread"
import {
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

const COLLAPSED_SIDEBAR_WIDTH = 64
const DEFAULT_SIDEBAR_WIDTH = 300
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 430

function SupportInboxShell() {
  return (
    <SidebarProvider className="min-h-svh bg-[#050B15] text-white">
      <Suspense fallback={<SupportInboxLoadingFallback />}>
        <SupportInboxResizableLayout />
      </Suspense>
    </SidebarProvider>
  )
}

function SupportInboxLoadingFallback() {
  return <div className="min-h-svh flex-1 bg-[#070D18]" />
}

function SupportInboxResizableLayout() {
  const searchParams = useSearchParams()
  const deepLinkedConversationId = searchParams.get("conversationId")
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const activeSidebarWidth = isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth

  const handleSidebarResizeStart = useCallback((event) => {
    if (isCollapsed) return

    event.preventDefault()
    const startX = event.clientX
    const startWidth = sidebarWidth

    const handlePointerMove = (moveEvent) => {
      const nextWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + moveEvent.clientX - startX))
      setSidebarWidth(nextWidth)
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }, [isCollapsed, sidebarWidth])

  return (
    <div className="flex min-h-svh w-full overflow-hidden">
      <aside
        className="relative shrink-0 bg-[#0B1120]"
        style={{ width: activeSidebarWidth, "--sidebar-width": `${activeSidebarWidth}px` }}
      >
        <SupportConversationSidebar
          selectedConversationId={selectedConversation?.id}
          targetConversationId={deepLinkedConversationId}
          onSelectConversation={setSelectedConversation}
        />
        <button
          type="button"
          aria-label="Resize conversation sidebar"
          aria-orientation="vertical"
          className="absolute inset-y-0 -right-1 z-30 hidden w-2 cursor-col-resize items-center justify-center bg-transparent after:h-8 after:w-1 after:rounded-full after:bg-white/15 hover:after:bg-[#3BE0AF]/70 md:flex disabled:cursor-default disabled:after:bg-transparent"
          disabled={isCollapsed}
          onPointerDown={handleSidebarResizeStart}
        />
      </aside>
      <section className="min-w-0 flex-1 bg-[#070D18]">
        <SupportConversationThread conversation={selectedConversation} />
      </section>
    </div>
  )
}

export { SupportInboxShell }
