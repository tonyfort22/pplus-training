export default function Input({ className = '', ...props }) {
  const classes = ['ui-input', className].filter(Boolean).join(' ')

  return <input className={classes} {...props} />
}
