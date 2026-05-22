export default function AdminCard({
  as: Tag = 'section',
  children,
  className = '',
  layout = 'default',
  padding = 'default',
  variant = 'default',
  ...props
}) {
  const variantClass = {
    default: '',
    interactive: 'admin-card-interactive',
    metric: 'admin-card-metric',
  }[variant] ?? ''

  const layoutClass = {
    default: '',
    auth: 'admin-card-auth',
  }[layout] ?? ''

  const paddingClass = {
    default: 'admin-card-padding-default',
    spacious: 'admin-card-padding-spacious',
    auth: 'admin-card-padding-auth',
  }[padding] ?? 'admin-card-padding-default'

  const classes = ['admin-card', variantClass, layoutClass, paddingClass, className].filter(Boolean).join(' ')

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  )
}
