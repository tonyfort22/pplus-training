export default function AuthLayout({ children, description = '', title = '' }) {
  return (
    <main className="ui-auth-layout">
      <div className="ui-auth-layout-shell">
        <div className="ui-auth-layout-copy">
          <h1 className="ui-auth-layout-title">{title}</h1>
          {description ? <p className="ui-auth-layout-description">{description}</p> : null}
        </div>
        <div className="ui-auth-layout-card">{children}</div>
      </div>
    </main>
  )
}
