import { notFound } from 'next/navigation'
import { getTenantBySlug, getSiteSettings } from '@/lib/tenant'
import { getTemplate } from '@/lib/templates'
import { NewsletterForm } from '@/components/shared/NewsletterForm'

export default async function NewsletterPage() {
  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const runApiUrl = process.env.RUN_API_BASE_URL ?? ''
  const campaignId = tenant.id.toString()

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId} runApiUrl={runApiUrl}>
      <div className="py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Stay Connected</h1>
          <p className="text-lg text-gray-600 mb-8">
            Get the latest updates from {siteSettings.candidateName}&apos;s campaign
            delivered to your inbox.
          </p>
          <NewsletterForm
            campaignId={campaignId}
            runApiUrl={runApiUrl}
          />
        </div>
      </div>
    </Template>
  )
}
