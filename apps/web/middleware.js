import { NextResponse } from 'next/server'
import {
  getAdminProtectedLoginRedirectUrl,
  shouldBypassAdminAuth,
} from './lib/admin-route-protection.js'

export function middleware(request) {
  if (shouldBypassAdminAuth(request)) {
    return NextResponse.next()
  }

  return NextResponse.redirect(getAdminProtectedLoginRedirectUrl(request))
}

export const config = {
  matcher: ['/admin/:path*'],
}
