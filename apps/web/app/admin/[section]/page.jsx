import { notFound } from 'next/navigation'

import AdminShell from '../../../components/admin/admin-shell'
import { buildAdminPath, findAdminRoute } from '../../../components/admin/admin-navigation'

export default async function AdminSectionPage({ params }) {
  const { section } = await params
  const currentPath = buildAdminPath(section)

  if (!findAdminRoute(currentPath)) {
    notFound()
  }

  return <AdminShell currentPath={currentPath} />
}
