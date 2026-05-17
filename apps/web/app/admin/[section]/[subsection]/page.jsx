import { notFound, redirect } from 'next/navigation'

import AdminShell from '../../../../components/admin/admin-shell'
import { buildAdminPath, findAdminRoute } from '../../../../components/admin/admin-navigation'

export default async function AdminSubsectionPage({ params }) {
  const { section, subsection } = await params
  const currentPath = buildAdminPath(section, subsection)

  if (section === 'dashboard') {
    redirect('/admin/dashboard')
  }

  if (!findAdminRoute(currentPath)) {
    notFound()
  }

  return <AdminShell currentPath={currentPath} />
}
