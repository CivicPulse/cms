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

  // I9: Validate email format before passing to server action
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    redirect('/newsletter')
  }

  const tenant = await getTenantBySlug()
  if (!tenant) notFound()

  const siteSettings = await getSiteSettings(tenant.id)
  if (!siteSettings) notFound()

  const Template = getTemplate(siteSettings.activeTemplateKey)
  const campaignId = params.campaignId ?? tenant.id.toString()

  return (
    <Template siteSettings={siteSettings} campaignId={campaignId}>
      <ThankYouForm email={email} campaignId={campaignId} />
    </Template>
  )
}
