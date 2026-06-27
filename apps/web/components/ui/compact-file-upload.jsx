"use client"

import { UploadIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export default function CompactFileUpload({
  accept = "image/*",
  buttonLabel = "Choose File",
  helperText = "Drop files here or click to browse (max 3 files)",
  fileName = "",
  id,
  multiple = false,
  onFileChange = () => {},
  className,
  disabled = false,
}) {
  return (
    <label
      htmlFor={disabled ? undefined : id}
      className={cn(
        "flex min-w-0 items-center justify-between gap-4 rounded-[14px] border border-dashed border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] transition",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[var(--admin-shell-accent)] hover:bg-[var(--admin-dashboard-control-hover-bg)]",
        className,
      )}
    >
      <div className="grid min-w-0 flex-1 gap-1">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
          <UploadIcon className="h-4 w-4 text-[var(--admin-shell-accent)]" />
          {buttonLabel}
        </span>
        <span className="truncate text-xs text-[var(--admin-dashboard-card-muted)]" title={fileName || helperText}>{fileName || helperText}</span>
      </div>
      <span className="shrink-0 rounded-[10px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-shell-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--admin-dashboard-card-text)]">
        Browse
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => onFileChange(multiple ? Array.from(event.target.files ?? []) : (event.target.files?.[0] ?? null))}
        disabled={disabled}
      />
    </label>
  )
}
