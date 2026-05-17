export default function AdminEmptyState({ title, description, action = null, className = '' }) {
  const classes = ['admin-empty-state', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="admin-empty-state-icon" aria-hidden="true">+</div>
      <h3 className="admin-empty-state-title">{title}</h3>
      <p className="admin-empty-state-description">{description}</p>
      {action ? <div className="admin-empty-state-action">{action}</div> : null}
    </div>
  )
}
