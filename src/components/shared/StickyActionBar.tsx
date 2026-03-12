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

  // Prepend donation URL if it exists and isn't already in external items
  if (donationUrl && !externalItems.some((item) => item.url === donationUrl)) {
    externalItems.unshift({ label: 'Donate', url: donationUrl })
  }

  // If no external items, don't render the bar
  if (externalItems.length === 0) return null

  return (
    <div className="sticky top-0 z-40 bg-primary text-white py-2 px-4">
      <div className="flex gap-3 justify-center flex-wrap">
        {externalItems.map((item) => (
          <a
            key={item.url}
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
