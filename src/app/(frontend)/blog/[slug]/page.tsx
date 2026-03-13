import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug, getSiteSettings, getPostBySlug } from '@/lib/tenant'
import { getTemplate } from '@/lib/templates'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { env } from '@/env'

type PostPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug()
  if (!tenant) return { title: 'Site Not Found' }

  const post = await getPostBySlug(tenant.id, slug)
  if (!post) return { title: 'Not Found' }

  const siteSettings = await getSiteSettings(tenant.id)
  const candidateName = siteSettings?.candidateName ?? tenant.displayName

  const featuredImage =
    typeof post.featuredImage === 'object' && post.featuredImage !== null
      ? post.featuredImage
      : null

  return {
    title: `${post.title} | ${candidateName}`,
    openGraph: featuredImage?.url
      ? { images: [{ url: featuredImage.url }] }
      : undefined,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params

  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const post = await getPostBySlug(tenant.id, slug)
  if (!post) notFound()

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const campaignId = tenant.id.toString()

  const featuredImage =
    typeof post.featuredImage === 'object' && post.featuredImage !== null
      ? post.featuredImage
      : null

  // Build the public share URL
  const tenantSlug = tenant.slug
  const shareUrl = `https://${tenantSlug}.${env.SITE_DOMAIN}/blog/${post.slug}`

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId}>
      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="text-sm text-gray-500 mb-8">
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>

          {featuredImage?.url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={featuredImage.url}
                alt={featuredImage.alt ?? post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {post.content && (
            <div className="prose prose-lg max-w-none">
              <RichText data={post.content} />
            </div>
          )}

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-gray-500 mb-3">Share this post</p>
            <ShareButtons url={shareUrl} title={post.title} />
          </div>
        </div>
      </article>
    </Template>
  )
}
