export default function AdminTopbar({
  eyebrow = 'Admin UI Reference',
  title = 'Shell overview',
  subtitle = 'Desktop shell preview',
  meta = null,
  actions = null,
}) {
  return (
    <header className="admin-topbar flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="grid gap-1.5">
        <span className="admin-topbar-eyebrow">{eyebrow}</span>
        <h2 className="admin-topbar-title">{title}</h2>
        <p className="admin-topbar-subtitle">{subtitle}</p>
        {meta ? <div className="admin-topbar-meta flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="admin-topbar-actions flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}
