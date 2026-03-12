import type { SiteSetting } from '@/payload-types'
import { ModernNav } from './ModernNav'
import { StickyActionBar } from '@/components/shared/StickyActionBar'
import { Footer } from '@/components/shared/Footer'

interface ModernLayoutProps {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
  runApiUrl: string
}

export function ModernLayout({
  siteSettings,
  children,
  campaignId,
  runApiUrl,
}: ModernLayoutProps) {
  // navItems exists in the SiteSettings collection but may not be in generated types yet
  const navItems =
    ((siteSettings as unknown as Record<string, unknown>).navItems as
      | Array<{ label: string; url: string }>
      | undefined) ?? []

  return (
    <div className="font-sans text-modern-text bg-modern-bg min-h-screen">
      <ModernNav siteSettings={siteSettings} />
      <StickyActionBar
        navItems={navItems}
        donationUrl={siteSettings.donationUrl}
      />
      <main className="max-w-5xl mx-auto px-6">{children}</main>
      <Footer
        siteSettings={siteSettings}
        campaignId={campaignId}
        runApiUrl={runApiUrl}
      />
    </div>
  )
}
