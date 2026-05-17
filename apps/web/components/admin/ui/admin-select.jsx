export default function AdminSelect({ className = '', children, ...props }) {
  const classes = ['admin-select', className].filter(Boolean).join(' ')

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}
