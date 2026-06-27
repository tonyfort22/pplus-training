"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

const ResizableContext = React.createContext(null)

function ResizablePanelGroup({ className, direction = "horizontal", children, ...props }) {
  const groupRef = React.useRef(null)
  const childArray = React.Children.toArray(children)
  const panelDefaults = childArray
    .filter((child) => React.isValidElement(child) && child.type === ResizablePanel)
    .map((child) => child.props.defaultSize ?? 100)
  const [sizes, setSizes] = React.useState(panelDefaults)

  React.useEffect(() => {
    setSizes(panelDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelDefaults.join("|")])

  const beginResize = React.useCallback(
    (panelIndex, event) => {
      if (direction !== "horizontal") return
      const group = groupRef.current
      if (!group) return

      event.preventDefault()
      const rect = group.getBoundingClientRect()
      const startX = event.clientX
      const startSizes = [...sizes]
      const leftStart = startSizes[panelIndex] ?? 0
      const rightStart = startSizes[panelIndex + 1] ?? 0
      const totalPair = leftStart + rightStart
      const panels = childArray.filter((child) => React.isValidElement(child) && child.type === ResizablePanel)
      const leftPanel = panels[panelIndex]
      const rightPanel = panels[panelIndex + 1]
      const leftMin = leftPanel?.props.minSize ?? 0
      const leftMax = leftPanel?.props.maxSize ?? 100
      const rightMin = rightPanel?.props.minSize ?? 0
      const rightMax = rightPanel?.props.maxSize ?? 100

      const handlePointerMove = (moveEvent) => {
        const deltaPercent = ((moveEvent.clientX - startX) / rect.width) * 100
        const unclampedLeft = leftStart + deltaPercent
        const nextLeft = Math.min(leftMax, Math.max(leftMin, unclampedLeft))
        const nextRight = Math.min(rightMax, Math.max(rightMin, totalPair - nextLeft))
        const adjustedLeft = totalPair - nextRight

        setSizes((current) => {
          const next = [...current]
          next[panelIndex] = adjustedLeft
          next[panelIndex + 1] = nextRight
          return next
        })
      }

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [childArray, direction, sizes],
  )

  let panelIndex = 0
  const renderedChildren = childArray.map((child) => {
    if (!React.isValidElement(child)) return child

    if (child.type === ResizablePanel) {
      const currentIndex = panelIndex
      panelIndex += 1
      return React.cloneElement(child, {
        panelIndex: currentIndex,
        size: sizes[currentIndex],
      })
    }

    if (child.type === ResizableHandle) {
      return React.cloneElement(child, {
        panelIndex: Math.max(0, panelIndex - 1),
      })
    }

    return child
  })

  return (
    <ResizableContext.Provider value={{ beginResize }}>
      <div
        ref={groupRef}
        data-slot="resizable-panel-group"
        data-direction={direction}
        className={cn(
          "flex h-full w-full overflow-hidden",
          direction === "vertical" ? "flex-col" : "flex-row",
          className,
        )}
        {...props}
      >
        {renderedChildren}
      </div>
    </ResizableContext.Provider>
  )
}

function ResizablePanel({ className, defaultSize, minSize, maxSize, panelIndex, size, children, style, ...props }) {
  const basis = size ?? defaultSize

  return (
    <div
      data-slot="resizable-panel"
      data-panel-index={panelIndex}
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      className={cn("min-w-0", className)}
      style={{ flexBasis: basis ? `${basis}%` : undefined, flexGrow: 0, flexShrink: 0, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

function ResizableHandle({ className, withHandle = true, panelIndex = 0, ...props }) {
  const context = React.useContext(ResizableContext)

  return (
    <div
      data-slot="resizable-handle"
      role="separator"
      aria-orientation="vertical"
      className={cn(
        "group flex w-px shrink-0 cursor-col-resize items-center justify-center bg-white/10 transition-colors hover:bg-[#3BE0AF]/60",
        className,
      )}
      onPointerDown={(event) => context?.beginResize(panelIndex, event)}
      {...props}
    >
      {withHandle ? (
        <div className="flex h-8 w-3 items-center justify-center rounded-full border border-white/10 bg-[#101826] text-[#8EA0BC] shadow-sm group-hover:text-[#3BE0AF]">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
