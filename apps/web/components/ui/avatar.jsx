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
