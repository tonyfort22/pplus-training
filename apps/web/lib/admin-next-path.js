export function normalizeAdminNextPath(value) {
  const nextPath = String(value || '').trim()

  if (!nextPath || nextPath.startsWith('//')) {
    return '/admin'
  }

  try {
    const parsed = new URL(nextPath, 'https://pplus.local')
    if (parsed.origin !== 'https://pplus.local') {
      return '/admin'
    }
    if (parsed.pathname !== '/admin' && !parsed.pathname.startsWith('/admin/')) {
      return '/admin'
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/admin'
  }
}
