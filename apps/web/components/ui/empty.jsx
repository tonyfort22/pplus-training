import { cn } from "@/lib/utils"

function Empty({ className, ...props }) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-h-[320px] flex-1 flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-6 text-center",
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-3", className)}
      {...props}
    />
  )
}

function EmptyMedia({ className, variant = "default", ...props }) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(
        "flex items-center justify-center rounded-full border",
        variant === "icon" ? "size-12 [&_svg]:size-6" : "size-16 [&_svg]:size-8",
        className,
      )}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
