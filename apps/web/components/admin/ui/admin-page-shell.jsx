export default function AdminPageShell({ children, className = '' }) {
  const classes = ['admin-page-shell', className].filter(Boolean).join(' ')

  return <main className={classes}>{children}</main>
}
