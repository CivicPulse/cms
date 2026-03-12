import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug, getSiteSettings, getPublishedPosts } from '@/lib/tenant'
import { getTemplate } from '@/lib/templates'
import { PostCard } from '@/components/shared/PostCard'
import { Pagination } from '@/components/shared/Pagination'

type BlogPageProps = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantBySlug()
  if (!tenant) return { title: 'Site Not Found' }

  const siteSettings = await getSiteSettings(tenant.id)
  const candidateName = siteSettings?.candidateName ?? tenant.displayName

  return {
    title: `Blog | ${candidateName}`,
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams
  const page = Number(sp?.page) || 1

  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const posts = await getPublishedPosts(tenant.id, { page, limit: 9 })

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const campaignId = tenant.id.toString()

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId}>
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Blog</h1>
          {posts.docs.length === 0 ? (
            <p className="text-gray-500">No posts yet. Check back soon!</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.docs.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              {posts.totalPages > 1 && (
                <Pagination
                  currentPage={posts.page ?? page}
                  totalPages={posts.totalPages}
                  basePath="/blog"
                />
              )}
            </>
          )}
        </div>
      </div>
    </Template>
  )
}
