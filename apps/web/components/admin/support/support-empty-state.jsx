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
        "w-full border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,224,175,0.16),rgba(7,13,24,0)_44%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] text-white shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
        compact ? "min-h-[190px] gap-4 rounded-2xl px-3 py-5" : "max-w-lg",
        className,
      )}
    >
      <EmptyHeader className={compact ? "gap-2" : undefined}>
        <EmptyMedia
          variant="icon"
          className={cn(
            "border-white/10 bg-[#101826] text-[#3BE0AF] shadow-[0_12px_30px_rgba(59,224,175,0.12)]",
            compact && "size-10 [&_svg]:size-5",
          )}
        >
          <MessageCircleIcon />
        </EmptyMedia>
        <EmptyTitle className={compact ? "text-sm" : undefined}>{title}</EmptyTitle>
        <EmptyDescription className={cn("text-[#8EA0BC]", compact && "text-xs leading-5")}>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && onAction ? (
        <EmptyContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAction}
            className="border-white/10 bg-white/[0.04] text-[#D7E2F4] hover:bg-white/[0.08] hover:text-white"
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
