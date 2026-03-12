import type { SiteSetting, Media } from '@/payload-types'

interface BoldHeroProps {
  siteSettings: SiteSetting
}

export function BoldHero({ siteSettings }: BoldHeroProps) {
  const {
    candidateName,
    officeRunningFor,
    tagline,
    candidatePhoto,
    donationUrl,
  } = siteSettings

  const populatedPhoto =
    typeof candidatePhoto === 'object' && candidatePhoto !== null
      ? (candidatePhoto as Media)
      : null

  // navItems exists in the SiteSettings collection but may not be in generated types yet
  const items =
    ((siteSettings as unknown as Record<string, unknown>).navItems as
      | Array<{ label: string; url: string }>
      | undefined) ?? []
  const firstExternal = items.find((item) => item.url.startsWith('http'))

  return (
    <section
      className="relative min-h-[70vh] flex flex-col justify-center items-center text-center py-24 px-6"
      style={
        populatedPhoto?.url
          ? { backgroundImage: `url(${populatedPhoto.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {/* Overlay: primaryColor semi-transparent if photo, solid if no photo */}
      <div
        className="absolute inset-0"
        style={
          populatedPhoto?.url
            ? { backgroundColor: 'color-mix(in srgb, var(--site-primary, #2563eb) 70%, transparent)' }
            : { backgroundColor: 'var(--site-primary, #2563eb)' }
        }
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {officeRunningFor && (
          <p className="text-lg uppercase tracking-widest text-white/80 mb-4">
            {officeRunningFor}
          </p>
        )}

        <h1 className="font-display text-5xl lg:text-7xl text-white font-bold mb-6">
          {candidateName}
        </h1>

        {tagline && (
          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto mb-10">
            {tagline}
          </p>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {donationUrl && (
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-bold-bg transition-colors font-medium"
            >
              Donate
            </a>
          )}
          {firstExternal && (
            <a
              href={firstExternal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white/60 text-white/90 px-8 py-3 rounded-md hover:bg-white hover:text-bold-bg transition-colors font-medium"
            >
              {firstExternal.label}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
