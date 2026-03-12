import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
import { getTenantBySlug, getSiteSettings, getPageBySlug, getPublishedPosts } from '@/lib/tenant'
import { getTemplate, type TemplateKey } from '@/lib/templates'
import { ClassicHero } from '@/components/templates/classic/ClassicHero'
import { ModernHero } from '@/components/templates/modern/ModernHero'
import { BoldHero } from '@/components/templates/bold/BoldHero'
import { PostCard } from '@/components/shared/PostCard'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

const heroComponents: Record<TemplateKey, typeof ClassicHero> = {
  classic: ClassicHero,
  modern: ModernHero,
  bold: BoldHero,
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantBySlug()
  if (!tenant) return { title: 'Site Not Found' }

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) return { title: tenant.displayName }

  const title = siteSettings.officeRunningFor
    ? `${siteSettings.candidateName} | ${siteSettings.officeRunningFor}`
    : siteSettings.candidateName

  const populatedPhoto =
    typeof siteSettings.candidatePhoto === 'object' && siteSettings.candidatePhoto !== null
      ? (siteSettings.candidatePhoto as Media)
      : null

  return {
    title,
    description: siteSettings.tagline ?? undefined,
    openGraph: populatedPhoto?.url
      ? { images: [{ url: populatedPhoto.url }] }
      : undefined,
  }
}

export default async function HomePage() {
  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500 text-lg">Campaign not configured yet.</p>
      </div>
    )
  }

  const homePage = await getPageBySlug(tenant.id, 'home')
  const posts = await getPublishedPosts(tenant.id, { limit: 9 })

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const Hero = heroComponents[siteSettings.activeTemplateKey as TemplateKey] ?? ModernHero

  const runApiUrl = process.env.RUN_API_BASE_URL ?? ''
  const campaignId = tenant.id.toString()

  const populatedPhoto =
    typeof siteSettings.candidatePhoto === 'object' && siteSettings.candidatePhoto !== null
      ? (siteSettings.candidatePhoto as Media)
      : null

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId} runApiUrl={runApiUrl}>
      {/* 1. Hero from SiteSettings */}
      <Hero siteSettings={siteSettings} />

      {/* 2. Meet the Candidate (only if bio is filled) */}
      {siteSettings.bio && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3 flex justify-center">
              {populatedPhoto?.url ? (
                <img
                  src={populatedPhoto.url}
                  alt={populatedPhoto.alt ?? siteSettings.candidateName}
                  className="rounded-lg shadow-md max-h-72 w-auto object-cover"
                />
              ) : (
                <InitialsAvatar name={siteSettings.candidateName} size="lg" />
              )}
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4">
                Meet {siteSettings.candidateName}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700">
                {siteSettings.bio}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Editable blocks from Pages "home" */}
      {homePage?.layout && (
        <BlockRenderer
          blocks={homePage.layout}
          siteSettings={siteSettings}
          campaignId={campaignId}
          runApiUrl={runApiUrl}
        />
      )}

      {/* 4. Recent posts grid */}
      {posts.docs.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Latest Updates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.docs.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {posts.totalPages > 1 && (
              <div className="mt-8 text-center">
                <a
                  href="/blog"
                  className="text-primary hover:underline font-medium"
                >
                  View all posts &rarr;
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </Template>
  )
}
