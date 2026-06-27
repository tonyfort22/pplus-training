"use client"

import Avatar from '@/components/ui/avatar'

export default function AvatarFileUpload({
  id,
  label = 'Upload',
  helperText = 'PNG, JPG, or WEBP',
  fileName = '',
  previewLabel = '',
  onFileChange = () => {},
  disabled = false,
}) {
  return (
    <label
      htmlFor={disabled ? undefined : id}
      className={[
        "flex min-w-0 items-center gap-4 rounded-[14px] border border-dashed border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] transition",
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[var(--admin-shell-accent)] hover:bg-[var(--admin-dashboard-control-hover-bg)]',
      ].join(' ')}
    >
      <Avatar alt={previewLabel || label} className="admin-shell-athletes-avatar" initials={previewLabel || label} />
      <div className="grid min-w-0 flex-1 gap-1">
        <span className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">{label}</span>
        <span className="truncate text-xs text-[var(--admin-dashboard-card-muted)]" title={fileName || helperText}>{fileName || helperText}</span>
      </div>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        disabled={disabled}
      />
    </label>
  )
}
