import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isAuthRoute = nextUrl.pathname.startsWith('/login')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isTesterRoute = nextUrl.pathname.startsWith('/tester')

  if (isApiAuthRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', nextUrl))
      }
      return NextResponse.redirect(new URL('/tester', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && (isAdminRoute || isTesterRoute || nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL(userRole === 'TESTER' ? '/tester' : '/login', nextUrl))
  }

  if (isTesterRoute && userRole !== 'TESTER') {
    return NextResponse.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/login', nextUrl))
  }

  if (nextUrl.pathname === '/') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', nextUrl))
    }
    if (userRole === 'TESTER') {
      return NextResponse.redirect(new URL('/tester', nextUrl))
    }
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
}
