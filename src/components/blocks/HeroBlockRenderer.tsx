import type { Media } from '@/payload-types'

interface HeroBlockProps {
  headline: string
  subheadline?: string | null
  backgroundImage?: Media | number | null
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export function HeroBlockRenderer({
  headline,
  subheadline,
  backgroundImage,
  ctaLabel,
  ctaUrl,
}: HeroBlockProps) {
  const bgImage =
    backgroundImage && typeof backgroundImage === 'object'
      ? backgroundImage.url
      : null

  return (
    <section
      className={`py-16 px-4 relative ${bgImage ? 'text-white' : 'bg-gray-50'}`}
    >
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        </>
      )}

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">{headline}</h2>

        {subheadline && (
          <p className="text-xl md:text-2xl mb-8 opacity-90">{subheadline}</p>
        )}

        {ctaLabel && ctaUrl && (
          <a
            href={ctaUrl}
            className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-hover transition-colors font-medium"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
