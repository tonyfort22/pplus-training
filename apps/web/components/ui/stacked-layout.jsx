export default function StackedLayout({ children, navbar = null }) {
  return (
    <div className="ui-stacked-layout">
      {navbar ? <div className="ui-stacked-layout-navbar">{navbar}</div> : null}
      <div className="ui-stacked-layout-content">{children}</div>
    </div>
  )
}
