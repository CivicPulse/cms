import type { SiteSetting } from '@/payload-types'
import { ModernNav } from './ModernNav'
import { StickyActionBar } from '@/components/shared/StickyActionBar'
import { Footer } from '@/components/shared/Footer'

interface ModernLayoutProps {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
}

export function ModernLayout({
  siteSettings,
  children,
  campaignId,
}: ModernLayoutProps) {
  const navItems = siteSettings.navItems ?? []

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
      />
    </div>
  )
}
