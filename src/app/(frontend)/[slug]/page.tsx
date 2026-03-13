import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug, getSiteSettings, getPageBySlug } from '@/lib/tenant'
import { getTemplate } from '@/lib/templates'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug()
  if (!tenant) return { title: 'Site Not Found' }

  const page = await getPageBySlug(tenant.id, slug)
  if (!page) return { title: 'Not Found' }

  const siteSettings = await getSiteSettings(tenant.id)
  const candidateName = siteSettings?.candidateName ?? tenant.displayName

  return {
    title: `${page.title} | ${candidateName}`,
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params

  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const page = await getPageBySlug(tenant.id, slug)
  if (!page) notFound()

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const campaignId = tenant.id.toString()

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId}>
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
          {page.layout && (
            <BlockRenderer
              blocks={page.layout}
              siteSettings={siteSettings}
              campaignId={campaignId}
            />
          )}
        </div>
      </div>
    </Template>
  )
}
