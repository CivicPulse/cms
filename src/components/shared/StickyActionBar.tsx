interface NavItem {
  label: string
  url: string
}

interface StickyActionBarProps {
  navItems: NavItem[]
  donationUrl?: string | null
}

export function StickyActionBar({ navItems, donationUrl }: StickyActionBarProps) {
  // Filter to only external links
  const externalItems = navItems.filter((item) => item.url.startsWith('http'))

  // I8: Match both URL and label to avoid suppressing unrelated nav items
  if (donationUrl && !externalItems.some((item) => item.url === donationUrl && item.label === 'Donate')) {
    externalItems.unshift({ label: 'Donate', url: donationUrl })
  }

  // If no external items, don't render the bar
  if (externalItems.length === 0) return null

  return (
    <div className="sticky top-0 z-40 bg-primary text-white py-2 px-4">
      <div className="flex gap-3 justify-center flex-wrap">
        {externalItems.map((item, index) => (
          <a
            key={`${item.url}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium whitespace-nowrap"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}
