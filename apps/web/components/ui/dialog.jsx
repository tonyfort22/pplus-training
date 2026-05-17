export default function Dialog({
  actions = null,
  children = null,
  open = false,
  title = '',
}) {
  if (!open) return null

  return (
    <div className="ui-dialog-backdrop" role="presentation">
      <div className="ui-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ui-dialog-header">
          <h2 className="ui-dialog-title">{title}</h2>
        </div>
        <div className="ui-dialog-body">{children}</div>
        {actions ? <div className="ui-dialog-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
