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
        "flex items-center gap-4 rounded-[14px] border border-dashed border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] transition",
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#3BE0AF]/50 hover:bg-[#15233A]',
      ].join(' ')}
    >
      <Avatar alt={previewLabel || label} className="admin-shell-athletes-avatar" initials={previewLabel || label} />
      <div className="grid gap-1">
        <span className="text-sm font-medium text-[#EEF4FF]">{label}</span>
        <span className="text-xs text-[#8EA0BC]">{fileName || helperText}</span>
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
