export default function AdminInput({ className = '', ...props }) {
  const classes = ['admin-input', className].filter(Boolean).join(' ')

  return <input className={classes} {...props} />
}
