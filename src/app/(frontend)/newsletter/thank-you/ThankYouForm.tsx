'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { updateSubscriberAction } from '@/actions/newsletter'

interface ThankYouFormProps {
  email: string
  campaignId: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function ThankYouForm({ email, campaignId }: ThankYouFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const result = await updateSubscriberAction({
        campaignId,
        email,
        name: name || undefined,
        zipCode: zipCode || undefined,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Update failed')
      }

      setStatus('success')
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch {
      setStatus('error')
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-4xl mb-4" aria-hidden="true">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold mb-2">All set!</h1>
          <p className="text-gray-600">Redirecting you to the homepage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Thank you for subscribing!</h1>
            <p className="text-gray-600">
              Want to help us personalize your experience? Add your name and zip code below.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={status === 'loading'}
              />
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                id="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g. 62701"
                maxLength={10}
                className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={status === 'loading'}
              />
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-sm">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 font-medium"
            >
              {status === 'loading' ? 'Updating...' : 'Update'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleSkip}
            disabled={status === 'loading'}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
