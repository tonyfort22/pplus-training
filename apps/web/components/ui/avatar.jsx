import * as React from 'react'

import { cn } from '@/lib/utils'

function getInitials(initials, alt) {
  if (initials) return initials
  if (!alt) return 'PP'

  return alt
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function AvatarRoot({ className = '', ...props }) {
  return <span className={cn('ui-avatar relative inline-flex shrink-0 overflow-hidden rounded-full', className)} {...props} />
}

function AvatarImage({ alt = '', className = '', src = '', ...props }) {
  if (!src) return null
  return <img alt={alt} className={cn('aspect-square size-full object-cover', className)} src={src} {...props} />
}

function AvatarFallback({ children, className = '', ...props }) {
  return (
    <span className={cn('flex size-full items-center justify-center rounded-full', className)} {...props}>
      {children}
    </span>
  )
}

export default function Avatar({ alt = '', className = '', initials = '', src = '', square = false, ...props }) {
  const classes = ['ui-avatar', square ? 'ui-avatar-square' : '', className].filter(Boolean).join(' ')

  if (src) {
    return <img alt={alt} className={classes} src={src} {...props} />
  }

  return (
    <span className={classes} aria-label={alt || initials} {...props}>
      {getInitials(initials, alt)}
    </span>
  )
}

export { AvatarRoot as Avatar, AvatarFallback, AvatarImage }
