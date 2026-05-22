export default function AdminTextarea({ className = '', ...props }) {
  const classes = ['admin-textarea', className].filter(Boolean).join(' ')

  return <textarea className={classes} {...props} />
}
