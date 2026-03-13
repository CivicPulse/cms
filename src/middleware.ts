import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract subdomain from hostname.
 *
 * - localhost: jones.localhost:3000 -> "jones"
 * - production: jones.campaigns.civpulse.com -> "jones" (when SITE_DOMAIN = "campaigns.civpulse.com")
 */
function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(':')[0]

  // Localhost development: {slug}.localhost
  if (host.endsWith('.localhost')) {
    const parts = host.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }

  // Production: check against SITE_DOMAIN env var
  // Edge Runtime cannot import Zod validation from env.ts
  const siteDomain = process.env.SITE_DOMAIN
  if (siteDomain && host.endsWith(`.${siteDomain}`)) {
    const subdomain = host.slice(0, -(siteDomain.length + 1))
    if (subdomain && subdomain !== 'www') {
      return subdomain
    }
  }

  return null
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const subdomain = extractSubdomain(hostname)

  // No subdomain: root domain passthrough
  if (!subdomain) {
    return NextResponse.next()
  }

  // Subdomain found: inject x-tenant-slug header for downstream Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', subdomain)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Exclude Payload admin, API, Next.js internals, and static files
export const config = {
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon.ico).*)'],
}
