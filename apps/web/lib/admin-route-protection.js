import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from './admin-auth-cookies.js'

export const PUBLIC_ADMIN_PATHS = Object.freeze([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/support',
  '/admin/support/reference',
])

export const PUBLIC_ASSET_EXTENSIONS = Object.freeze([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.ico',
])

export function isPublicAssetPath(pathname) {
  return PUBLIC_ASSET_EXTENSIONS.some((extension) => pathname.endsWith(extension))
}

export function isPublicAdminPath(pathname) {
  return PUBLIC_ADMIN_PATHS.includes(pathname)
}

export function shouldBypassAdminAuth(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin') || pathname.startsWith('/api/') || isPublicAdminPath(pathname) || isPublicAssetPath(pathname)) {
    return true
  }

  return Boolean(request.cookies.get(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)?.value)
}

export function getAdminProtectedLoginRedirectUrl(request) {
  const { pathname, search } = request.nextUrl
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/admin/login'
  redirectUrl.search = ''
  redirectUrl.searchParams.set('next', pathname + search)
  return redirectUrl
}
