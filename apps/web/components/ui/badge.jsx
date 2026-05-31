export default function Badge({ children, className = '', tone = 'neutral', variant, ...props }) {
  const resolvedTone = variant === 'destructive' ? 'danger' : tone
  const toneClass = {
    neutral: '',
    success: 'ui-badge-success',
    warning: 'ui-badge-warning',
    danger: 'ui-badge-danger',
  }[resolvedTone] ?? ''

  const classes = ['ui-badge', toneClass, className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export { Badge }
