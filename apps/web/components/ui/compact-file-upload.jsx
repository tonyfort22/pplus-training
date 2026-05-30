"use client"

import { UploadIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export default function CompactFileUpload({
  accept = "image/*",
  buttonLabel = "Choose File",
  helperText = "Drop files here or click to browse (max 3 files)",
  fileName = "",
  id,
  onFileChange = () => {},
  className,
  disabled = false,
}) {
  return (
    <label
      htmlFor={disabled ? undefined : id}
      className={cn(
        "flex items-center justify-between gap-4 rounded-[14px] border border-dashed border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] transition",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#3BE0AF]/50 hover:bg-[#15233A]",
        className,
      )}
    >
      <div className="grid gap-1">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#EEF4FF]">
          <UploadIcon className="h-4 w-4 text-[#3BE0AF]" />
          {buttonLabel}
        </span>
        <span className="text-xs text-[#8EA0BC]">{fileName || helperText}</span>
      </div>
      <span className="rounded-[10px] border border-[#24334A] bg-[#0F1728] px-3 py-2 text-xs font-medium text-[#DCE6F8]">
        Browse
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        disabled={disabled}
      />
    </label>
  )
}
