"use client"

import { Download, Maximize2, PlayCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export function MediaPlayer({ className, children, ...props }) {
  return (
    <div
      data-slot="media-player"
      className={cn(
        'overflow-hidden rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-black shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function MediaPlayerVideo({ className, children, poster = '', ...props }) {
  return (
    <video
      data-slot="media-player-video"
      className={cn('aspect-video w-full bg-black object-contain', className)}
      controls
      preload="metadata"
      playsInline
      poster={poster || undefined}
      {...props}
    >
      {children}
    </video>
  )
}

export function MediaPlayerControls({ className, videoUrl = '' }) {
  return (
    <div
      data-slot="media-player-controls"
      className={cn(
        'flex items-center justify-between gap-3 border-t border-white/10 bg-neutral-950 px-4 py-3 text-xs text-white/80',
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <PlayCircle className="size-4 text-[#3BE0AF]" aria-hidden="true" />
        MP4 preview
      </span>
      <span className="inline-flex items-center gap-2">
        <Maximize2 className="size-4 text-white/55" aria-hidden="true" />
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 font-medium text-white transition hover:border-[#3BE0AF]/60 hover:text-[#3BE0AF]"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Open
          </a>
        ) : null}
      </span>
    </div>
  )
}
