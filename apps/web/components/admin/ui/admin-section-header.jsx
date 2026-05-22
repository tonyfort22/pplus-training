export default function AdminSectionHeader({
  title,
  description,
  actions = null,
  className = '',
}) {
  const classes = ['admin-section-header', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="admin-section-header-copy">
        <h1 className="admin-section-header-title">{title}</h1>
        {description ? <p className="admin-section-header-description">{description}</p> : null}
      </div>
      {actions ? <div className="admin-section-header-actions">{actions}</div> : null}
    </div>
  )
}
