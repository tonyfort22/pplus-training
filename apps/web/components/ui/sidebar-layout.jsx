export default function SidebarLayout({ children, navbar = null, sidebar = null }) {
  return (
    <div className="ui-sidebar-layout">
      <div className="ui-sidebar-layout-sidebar">{sidebar}</div>
      <div className="ui-sidebar-layout-main">
        {navbar ? <div className="ui-sidebar-layout-navbar">{navbar}</div> : null}
        <div className="ui-sidebar-layout-content">{children}</div>
      </div>
    </div>
  )
}
