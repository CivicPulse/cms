import Link from 'next/link'
import type { SiteSetting, Media } from '@/payload-types'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { MobileNav } from '@/components/shared/MobileNav'

interface ModernNavProps {
  siteSettings: SiteSetting
}

export function ModernNav({ siteSettings }: ModernNavProps) {
  const { candidateName, logo } = siteSettings
  const populatedLogo = typeof logo === 'object' && logo !== null ? (logo as Media) : null

  const items = siteSettings.navItems ?? []

  return (
    <nav className="bg-modern-bg shadow-sm">
      {/* Desktop nav */}
      <div className="hidden md:flex items-center justify-between py-5 px-6 max-w-5xl mx-auto">
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
          <span className="font-sans text-modern-text font-semibold text-lg">
            {candidateName}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {items.map((item) => {
            const isExternal = item.url.startsWith('http')
            if (isExternal) {
              return (
                <a
                  key={`${item.url}-${item.label}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-modern-accent hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              )
            }
            return (
              <Link
                key={`${item.url}-${item.label}`}
                href={item.url}
                className="font-sans text-sm text-modern-accent hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-between py-5 px-6">
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
          <span className="font-sans text-modern-text font-semibold">
            {candidateName}
          </span>
        </Link>
        <MobileNav navItems={items} candidateName={candidateName} />
      </div>
    </nav>
  )
}
