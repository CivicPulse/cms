/**
 * Server-side API helpers for communicating with run-api.
 *
 * Called from server actions (src/actions/newsletter.ts),
 * NOT directly from client components.
 */

import { env } from '@/env'

interface ApiResult {
  ok: boolean
  error?: string
}

const baseUrl = env.RUN_API_BASE_URL.replace(/\/$/, '')

export async function subscribeToNewsletter(params: {
  email: string
  campaignId: string
}): Promise<ApiResult> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${params.campaignId}/subscribers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: params.email }),
      },
    )

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: body || `HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export async function updateSubscriber(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}): Promise<ApiResult> {
  try {
    const body: Record<string, string> = {}
    if (params.name) body.name = params.name
    if (params.zipCode) body.zipCode = params.zipCode

    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${params.campaignId}/subscribers/${encodeURIComponent(params.email)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      return { ok: false, error: text || `HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}
