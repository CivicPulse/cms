import type { SiteSetting, Media } from '@/payload-types'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

interface ModernHeroProps {
  siteSettings: SiteSetting
}

export function ModernHero({ siteSettings }: ModernHeroProps) {
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

  return (
    <section className="bg-modern-bg py-24 px-6">
      <div className="flex flex-col items-center text-center">
        {/* Circular candidate photo */}
        <div className="mb-6">
          {populatedPhoto?.url ? (
            <img
              src={populatedPhoto.url}
              alt={populatedPhoto.alt ?? candidateName}
              className="w-24 h-24 rounded-full object-cover shadow-md"
            />
          ) : (
            <InitialsAvatar name={candidateName} size="lg" />
          )}
        </div>

        {/* Name */}
        <h1 className="font-sans text-3xl lg:text-4xl text-modern-text font-bold mb-2">
          {candidateName}
        </h1>

        {/* Office */}
        {officeRunningFor && (
          <p className="text-sm uppercase tracking-wide text-primary mb-4">
            {officeRunningFor}
          </p>
        )}

        {/* Tagline */}
        {tagline && (
          <p className="font-sans text-lg text-modern-muted max-w-xl mx-auto mb-8">
            {tagline}
          </p>
        )}

        {/* CTA */}
        {donationUrl && (
          <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-hover transition-colors font-medium"
          >
            Donate
          </a>
        )}
      </div>
    </section>
  )
}
