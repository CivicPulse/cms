import { NewsletterForm } from '@/components/shared/NewsletterForm'
import type { SiteSetting } from '@/payload-types'

interface ContactBlockProps {
  contactEmail?: string | null
  officeAddress?: string | null
  phoneNumber?: string | null
  showNewsletterForm?: boolean | null
  siteSettings?: SiteSetting | null
  campaignId?: string
}

export function ContactBlockRenderer({
  contactEmail,
  officeAddress,
  phoneNumber,
  showNewsletterForm,
  siteSettings,
  campaignId,
}: ContactBlockProps) {
  // Fall back to siteSettings contact email if block doesn't specify one
  const email = contactEmail || siteSettings?.contactEmail

  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Contact</h2>

        <div className="space-y-4">
          {email && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Email</h3>
              <a
                href={`mailto:${email}`}
                className="text-primary hover:underline"
              >
                {email}
              </a>
            </div>
          )}

          {officeAddress && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Address</h3>
              <p className="text-gray-600 whitespace-pre-line">{officeAddress}</p>
            </div>
          )}

          {phoneNumber && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Phone</h3>
              <a
                href={`tel:${phoneNumber}`}
                className="text-primary hover:underline"
              >
                {phoneNumber}
              </a>
            </div>
          )}
        </div>

        {showNewsletterForm && campaignId && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <NewsletterForm
              campaignId={campaignId}
            />
          </div>
        )}
      </div>
    </section>
  )
}
