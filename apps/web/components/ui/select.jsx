export default function Select({ children, className = '', ...props }) {
  const classes = ['ui-select', className].filter(Boolean).join(' ')

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}
