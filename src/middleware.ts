import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads JWT from cookie — no network call, no timeout risk.
  // Individual route handlers call getUser() for server-side auth verification.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/onboarding', '/jobs', '/applications', '/resume', '/auto-apply', '/settings', '/cover-letters', '/network', '/profile', '/notifications', '/saved-jobs', '/interview-coach', '/extension', '/admin']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Keep the query string: deep links like /network?import=linkedin must survive sign-in.
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  /* Only the signed-in app and the sign-in pages need the session. Public
     pages (the site, job pages, tools, guides, sitemaps) are served straight
     from the cache: running this on them made every crawler request on the
     17,000 job pages an extra middleware run. Keep in step with protectedPaths. */
  matcher: [
    '/dashboard/:path*', '/onboarding/:path*', '/jobs/:path*', '/applications/:path*', '/resume/:path*', '/auto-apply/:path*',
    '/settings/:path*', '/cover-letters/:path*', '/network/:path*', '/profile/:path*', '/notifications/:path*', '/saved-jobs/:path*',
    '/interview-coach/:path*', '/extension/:path*', '/admin/:path*', '/login', '/signup',
  ],
}
