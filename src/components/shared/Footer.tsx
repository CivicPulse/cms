import { NewsletterForm } from './NewsletterForm'
import type { SiteSetting } from '@/payload-types'

interface FooterProps {
  siteSettings: SiteSetting
  campaignId: string
}

export function Footer({ siteSettings, campaignId }: FooterProps) {
  const {
    candidateName,
    officeRunningFor,
    twitterUrl,
    facebookUrl,
    instagramUrl,
    contactEmail,
  } = siteSettings

  const hasSocial = twitterUrl || facebookUrl || instagramUrl

  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Top row: Newsletter */}
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-3">Stay Updated</h3>
          <NewsletterForm
            campaignId={campaignId}
            compact
          />
        </div>

        {/* Middle row: Campaign info + social */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-700 pt-8">
          <p className="font-semibold text-lg">{candidateName}</p>

          {hasSocial && (
            <div className="flex gap-4 items-center">
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter/X"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}

              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              )}

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {contactEmail}
            </a>
          )}
        </div>

        {/* Bottom row: Disclaimer + Powered by */}
        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400 space-y-2">
          {officeRunningFor && (
            <p>
              Paid for by {candidateName} for {officeRunningFor}
            </p>
          )}
          <p>
            Powered by{' '}
            <a
              href="https://civpulse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline"
            >
              CivPulse
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
