import type { SiteSetting } from '@/payload-types'
import { BoldNav } from './BoldNav'
import { StickyActionBar } from '@/components/shared/StickyActionBar'
import { Footer } from '@/components/shared/Footer'

interface BoldLayoutProps {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
  runApiUrl: string
}

export function BoldLayout({
  siteSettings,
  children,
  campaignId,
  runApiUrl,
}: BoldLayoutProps) {
  // navItems exists in the SiteSettings collection but may not be in generated types yet
  const navItems =
    ((siteSettings as unknown as Record<string, unknown>).navItems as
      | Array<{ label: string; url: string }>
      | undefined) ?? []

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
        runApiUrl={runApiUrl}
      />
    </div>
  )
}
