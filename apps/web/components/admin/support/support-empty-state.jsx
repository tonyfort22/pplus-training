import { MessageCircleIcon, RefreshCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

function SupportEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}) {
  return (
    <Empty
      className={cn(
        "support-inbox-empty-state w-full",
        compact ? "support-inbox-empty-state-compact min-h-[190px] gap-4 rounded-2xl px-3 py-5" : "max-w-lg",
        className,
      )}
    >
      <EmptyHeader className={compact ? "gap-2" : undefined}>
        <EmptyMedia
          variant="icon"
          className={cn(
            "support-inbox-empty-media",
            compact && "size-10 [&_svg]:size-5",
          )}
        >
          <MessageCircleIcon />
        </EmptyMedia>
        <EmptyTitle className={cn("support-inbox-empty-title", compact && "text-sm")}>{title}</EmptyTitle>
        <EmptyDescription className={cn("support-inbox-empty-description", compact && "text-xs leading-5")}>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && onAction ? (
        <EmptyContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAction}
            className="support-inbox-empty-action"
          >
            <RefreshCcwIcon />
            {actionLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

export { SupportEmptyState }
