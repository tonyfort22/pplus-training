import { redirect } from 'next/navigation'

import { getAdminIndexRedirectPath } from '../../lib/admin-route-redirects.js'

export default function AdminIndexPage() {
  redirect(getAdminIndexRedirectPath())
}
