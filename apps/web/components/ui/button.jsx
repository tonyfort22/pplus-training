export default function Button({
  children,
  className = '',
  size = 'default',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const variantClass = {
    primary: '',
    secondary: 'ui-button-secondary',
    ghost: 'ui-button-ghost',
    danger: 'ui-button-danger',
  }[variant] ?? ''

  const sizeClass = {
    compact: 'ui-button-compact',
    default: 'ui-button-default',
    prominent: 'ui-button-prominent',
    auth: 'ui-button-auth',
  }[size] ?? 'ui-button-default'

  const classes = ['ui-button', variantClass, sizeClass, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
