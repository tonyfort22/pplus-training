const defaultItems = [
  { id: 'overview', label: 'Overview', active: true },
  { id: 'athletes', label: 'Athletes' },
  { id: 'programs', label: 'Programs' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'analytics', label: 'Analytics' },
]

export default function AdminSidebar({ items = defaultItems, title = 'PPLUS Admin' }) {
  return (
    <aside className="admin-sidebar w-full lg:w-[240px] lg:shrink-0" aria-label="Admin sidebar">
      <div className="flex items-center gap-3">
        <span className="admin-sidebar-brand-mark">P+</span>
        <div className="grid gap-2 admin-sidebar-brand-copy">
          <strong>{title}</strong>
          <span>Desktop control layer</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-sidebar-nav-item flex min-h-10 items-center gap-3 rounded-[16px] px-3 ${item.active ? ' admin-sidebar-nav-item-active' : ''}`}
          >
            <span className="admin-sidebar-nav-item-dot" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <span>Toronto desktop</span>
      </div>
    </aside>
  )
}
