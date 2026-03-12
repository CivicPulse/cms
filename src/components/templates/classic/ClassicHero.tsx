import type { SiteSetting, Media } from '@/payload-types'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

interface ClassicHeroProps {
  siteSettings: SiteSetting
}

export function ClassicHero({ siteSettings }: ClassicHeroProps) {
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

  const items = siteSettings.navItems ?? []
  const firstExternal = items.find((item) => item.url.startsWith('http'))

  return (
    <section className="bg-classic-bg py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
        {/* Left: Text content (60% on desktop) */}
        <div className="md:w-3/5 text-center md:text-left">
          {officeRunningFor && (
            <p className="text-sm uppercase tracking-widest text-primary font-medium mb-4">
              {officeRunningFor}
            </p>
          )}
          <h1 className="font-serif text-4xl lg:text-5xl text-classic-text font-bold mb-4">
            {candidateName}
          </h1>
          {tagline && (
            <p className="font-serif text-xl text-classic-muted mb-8">
              {tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {donationUrl && (
              <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary-hover transition-colors font-medium"
              >
                Donate
              </a>
            )}
            {firstExternal && (
              <a
                href={firstExternal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-classic-border text-classic-accent px-8 py-3 rounded-md hover:border-primary hover:text-primary transition-colors font-medium"
              >
                {firstExternal.label}
              </a>
            )}
          </div>
        </div>

        {/* Right: Photo (40% on desktop) */}
        <div className="md:w-2/5 flex justify-center">
          {populatedPhoto?.url ? (
            <img
              src={populatedPhoto.url}
              alt={populatedPhoto.alt ?? candidateName}
              className="rounded-lg shadow-lg max-h-96 w-auto object-cover"
            />
          ) : (
            <InitialsAvatar name={candidateName} size="lg" />
          )}
        </div>
      </div>
    </section>
  )
}
