'use client'

import { useState, type FormEvent } from 'react'
import { subscribeAction } from '@/actions/newsletter'

interface NewsletterFormProps {
  campaignId: string
  compact?: boolean
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterForm({
  campaignId,
  compact = false,
  className = '',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const result = await subscribeAction({ email, campaignId })

      if (result.ok) {
        setSubmittedEmail(email)
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={className}>
        <p className="text-green-600 font-medium">
          You&apos;re subscribed! Check your inbox.
        </p>
        <a
          href={`/newsletter/thank-you?email=${encodeURIComponent(submittedEmail)}&campaignId=${encodeURIComponent(campaignId)}`}
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          Want to add your name?
        </a>
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
        {status === 'error' && (
          <p className="text-red-500 text-sm mt-1 basis-full">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    )
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
      <p className="text-sm text-gray-600 mb-4">
        Get the latest news and updates delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 font-medium"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
