import { notFound, redirect } from 'next/navigation'
import { getTenantBySlug, getSiteSettings } from '@/lib/tenant'
import { getTemplate } from '@/lib/templates'
import { ThankYouForm } from './ThankYouForm'

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; campaignId?: string }>
}) {
  const params = await searchParams
  const email = params.email

  // If no email, redirect to newsletter page (user arrived directly)
  if (!email) {
    redirect('/newsletter')
  }

  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const runApiUrl = process.env.RUN_API_BASE_URL ?? ''
  const campaignId = params.campaignId ?? tenant.id.toString()

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId} runApiUrl={runApiUrl}>
      <ThankYouForm email={email} campaignId={campaignId} runApiUrl={runApiUrl} />
    </Template>
  )
}
