import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Extract query parameters
  const url = req.nextUrl
  const searchParams = url.searchParams

  // Check if the 'source' parameter is either 'patient' or 'external'
  const isSourceAllowed = searchParams.get('source') === 'patient' || searchParams.get('source') === 'external'

  // If source is allowed (patient or external), bypass authentication for /api routes
  if (url.pathname.startsWith('/api') && isSourceAllowed) {
    return res
  }

  // Check auth condition for non-API routes
  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/reset-password")

  // If user is not signed in and the route requires authentication, redirect to login
  if (!session && !isAuthRoute && url.pathname !== "/" && !url.pathname.startsWith("/patient-portal")) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access auth routes, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public).*)"],
}
