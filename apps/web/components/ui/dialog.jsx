export default function Dialog({
  actions = null,
  bodyClassName = '',
  children = null,
  className = '',
  description = '',
  headerActions = null,
  open = false,
  title = '',
}) {
  if (!open) return null

  return (
    <div className="ui-dialog-backdrop" role="presentation">
      <div className={['ui-dialog', className].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ui-dialog-header">
          <div className="ui-dialog-title-group">
            <h2 className="ui-dialog-title">{title}</h2>
            {description ? <p className="ui-dialog-description">{description}</p> : null}
          </div>
          {headerActions}
        </div>
        <div className={['ui-dialog-body', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
        {actions ? <div className="ui-dialog-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
