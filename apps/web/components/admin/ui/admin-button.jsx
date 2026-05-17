export default function AdminButton({
  children,
  className = '',
  size = 'default',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const variantClass = {
    primary: '',
    secondary: 'admin-button-secondary',
    ghost: 'admin-button-ghost',
    danger: 'admin-button-danger',
  }[variant] ?? ''

  const sizeClass = {
    compact: 'admin-button-compact',
    default: 'admin-button-default',
    prominent: 'admin-button-prominent',
    auth: 'admin-button-auth',
  }[size] ?? 'admin-button-default'

  const classes = ['admin-button', variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
