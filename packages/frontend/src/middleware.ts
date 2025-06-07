import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login'

  // Get the token from the cookies
  const hasWallet = request.cookies.has('wallet_connected')

  // Redirect logic
  if (isPublicPath && hasWallet) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isPublicPath && !hasWallet) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configure the paths that should be protected
export const config = {
  matcher: ['/', '/login']
} 