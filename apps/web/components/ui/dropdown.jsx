export default function Dropdown({
  button,
  children = null,
  className = '',
  open = false,
}) {
  const classes = ['ui-dropdown', open ? 'ui-dropdown-open' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="ui-dropdown-trigger">{button}</div>
      {open ? <div className="ui-dropdown-menu">{children}</div> : null}
    </div>
  )
}
