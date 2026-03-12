import Link from 'next/link'
import type { SiteSetting, Media } from '@/payload-types'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { MobileNav } from '@/components/shared/MobileNav'

interface BoldNavProps {
  siteSettings: SiteSetting
}

export function BoldNav({ siteSettings }: BoldNavProps) {
  const { candidateName, logo } = siteSettings
  const populatedLogo = typeof logo === 'object' && logo !== null ? (logo as Media) : null

  // navItems exists in the SiteSettings collection but may not be in generated types yet
  const items =
    ((siteSettings as unknown as Record<string, unknown>).navItems as
      | Array<{ label: string; url: string }>
      | undefined) ?? []

  return (
    <nav className="bg-bold-bg border-b border-bold-border">
      {/* Desktop nav */}
      <div className="hidden md:flex items-center justify-between py-4 px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          {populatedLogo?.url ? (
            <img
              src={populatedLogo.url}
              alt={populatedLogo.alt ?? candidateName}
              className="h-10 w-auto"
            />
          ) : (
            <InitialsAvatar name={candidateName} size="sm" />
          )}
          <span className="font-display text-bold-text font-bold text-lg">
            {candidateName}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {items.map((item) => {
            const isExternal = item.url.startsWith('http')
            if (isExternal) {
              return (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-bold-accent hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              )
            }
            return (
              <Link
                key={item.url}
                href={item.url}
                className="font-sans text-sm text-bold-accent hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-between py-4 px-6">
        <Link href="/" className="flex items-center gap-3">
          {populatedLogo?.url ? (
            <img
              src={populatedLogo.url}
              alt={populatedLogo.alt ?? candidateName}
              className="h-8 w-auto"
            />
          ) : (
            <InitialsAvatar name={candidateName} size="sm" />
          )}
          <span className="font-display text-bold-text font-bold">
            {candidateName}
          </span>
        </Link>
        <MobileNav navItems={items} candidateName={candidateName} />
      </div>
    </nav>
  )
}
