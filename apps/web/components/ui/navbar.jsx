export default function Navbar({ actions = null, children = null, title = '' }) {
  return (
    <header className="ui-navbar">
      <div className="ui-navbar-title">{title}</div>
      <div className="ui-navbar-body">{children}</div>
      {actions ? <div className="ui-navbar-actions">{actions}</div> : null}
    </header>
  )
}
