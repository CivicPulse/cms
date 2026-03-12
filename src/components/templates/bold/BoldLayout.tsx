import type { SiteSetting } from '@/payload-types'
import { BoldNav } from './BoldNav'
import { StickyActionBar } from '@/components/shared/StickyActionBar'
import { Footer } from '@/components/shared/Footer'

interface BoldLayoutProps {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
}

export function BoldLayout({
  siteSettings,
  children,
  campaignId,
}: BoldLayoutProps) {
  const navItems = siteSettings.navItems ?? []

  return (
    <div className="font-sans text-bold-text bg-bold-bg min-h-screen">
      <BoldNav siteSettings={siteSettings} />
      <StickyActionBar
        navItems={navItems}
        donationUrl={siteSettings.donationUrl}
      />
      <main className="max-w-7xl mx-auto px-6">{children}</main>
      <Footer
        siteSettings={siteSettings}
        campaignId={campaignId}
      />
    </div>
  )
}
