export default function Textarea({ className = '', ...props }) {
  const classes = ['ui-textarea', className].filter(Boolean).join(' ')

  return <textarea className={classes} {...props} />
}
