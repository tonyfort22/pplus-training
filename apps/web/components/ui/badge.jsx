export default function Badge({ children, className = '', tone = 'neutral', ...props }) {
  const toneClass = {
    neutral: '',
    success: 'ui-badge-success',
    warning: 'ui-badge-warning',
    danger: 'ui-badge-danger',
  }[tone] ?? ''

  const classes = ['ui-badge', toneClass, className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
