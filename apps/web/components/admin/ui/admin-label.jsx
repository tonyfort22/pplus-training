export default function AdminLabel({ children, className = '', ...props }) {
  const classes = ['admin-label', className].filter(Boolean).join(' ')

  return (
    <label className={classes} {...props}>
      {children}
    </label>
  )
}
