export default function AdminBadge({ children, variant = 'neutral', className = '' }) {
  const variantClass = {
    neutral: 'admin-badge',
    success: 'admin-badge admin-badge-success',
    warning: 'admin-badge admin-badge-warning',
    danger: 'admin-badge admin-badge-danger',
  }[variant] ?? 'admin-badge'

  const classes = [variantClass, className].filter(Boolean).join(' ')

  return <span className={classes}>{children}</span>
}
