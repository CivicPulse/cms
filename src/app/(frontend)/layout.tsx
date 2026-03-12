import type { Metadata } from 'next'
import { Merriweather, Inter, Space_Grotesk } from 'next/font/google'
import { getTenantBySlug, getSiteSettings } from '@/lib/tenant'
import '@/app/globals.css'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantBySlug()
  if (!tenant) {
    return { title: 'Site Not Found' }
  }

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) {
    return { title: tenant.displayName }
  }

  const title = siteSettings.officeRunningFor
    ? `${siteSettings.candidateName} for ${siteSettings.officeRunningFor}`
    : siteSettings.candidateName

  return { title }
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantBySlug()

  // Unknown subdomain or archived tenant: minimal "site not found" page
  if (!tenant || tenant.status === 'archived') {
    return (
      <html lang="en" className={`${merriweather.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="bg-white">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-gray-500 text-lg">This campaign site is not available.</p>
          </div>
        </body>
      </html>
    )
  }

  const siteSettings = await getSiteSettings(tenant.id)

  // CSS variable for primaryColor -- consumed by Tailwind @theme inline tokens
  const primaryColor = siteSettings?.primaryColor ?? undefined

  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <div
          style={primaryColor ? { '--site-primary': primaryColor } as React.CSSProperties : undefined}
        >
          {children}
        </div>
      </body>
    </html>
  )
}
