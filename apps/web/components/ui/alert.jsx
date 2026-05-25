export default function Alert({ children = null, className = '', title = '', tone = 'info' }) {
  const toneClass = {
    info: '',
    success: 'ui-alert-success',
    warning: 'ui-alert-warning',
    danger: 'ui-alert-danger',
  }[tone] ?? ''

  const classes = ['ui-alert', toneClass, className].filter(Boolean).join(' ')

  return (
    <div className={classes} role="status">
      {title ? <strong className="ui-alert-title">{title}</strong> : null}
      {children ? <div className="ui-alert-body">{children}</div> : null}
    </div>
  )
}
