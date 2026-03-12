import type { SiteSetting } from '@/payload-types'
import { ClassicNav } from './ClassicNav'
import { StickyActionBar } from '@/components/shared/StickyActionBar'
import { Footer } from '@/components/shared/Footer'

interface ClassicLayoutProps {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
}

export function ClassicLayout({
  siteSettings,
  children,
  campaignId,
}: ClassicLayoutProps) {
  const navItems = siteSettings.navItems ?? []

  return (
    <div className="font-serif text-classic-text bg-classic-bg min-h-screen">
      <ClassicNav siteSettings={siteSettings} />
      <StickyActionBar
        navItems={navItems}
        donationUrl={siteSettings.donationUrl}
      />
      <main className="max-w-6xl mx-auto px-6">{children}</main>
      <Footer
        siteSettings={siteSettings}
        campaignId={campaignId}
      />
    </div>
  )
}
