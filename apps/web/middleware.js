import { NextResponse } from 'next/server'
import { PPLUS_ADMIN_ACCESS_TOKEN_COOKIE } from './lib/admin-auth-cookies.js'

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/support',
  '/admin/support/reference',
]

function isPublicAdminPath(pathname) {
  return PUBLIC_ADMIN_PATHS.includes(pathname)
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl

  if (!pathname.startsWith('/admin') || pathname.startsWith('/api/') || isPublicAdminPath(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)?.value
  if (accessToken) {
    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/admin/login'
  redirectUrl.search = ''
  redirectUrl.searchParams.set('next', pathname + search)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
