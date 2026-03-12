/**
 * Client-facing API helpers for communicating with run-api.
 *
 * These functions are intended to be called from server actions or API routes,
 * NOT directly from client components (they use server-side env vars).
 */

interface ApiResult {
  ok: boolean
  error?: string
}

function getBaseUrl(): string {
  const baseUrl =
    process.env.RUN_API_BASE_URL ?? process.env.NEXT_PUBLIC_RUN_API_BASE_URL ?? ''
  return baseUrl.replace(/\/$/, '') // strip trailing slash
}

/**
 * Subscribe an email to a campaign's newsletter via run-api.
 *
 * Step 1 of the two-step signup flow: captures email only.
 */
export async function subscribeToNewsletter(params: {
  email: string
  campaignId: string
}): Promise<ApiResult> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    return { ok: false, error: 'Newsletter service is not configured' }
  }

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

/**
 * Update a subscriber's profile (name, zip code) via run-api.
 *
 * Step 2 of the two-step signup flow: optional profile enrichment.
 */
export async function updateSubscriber(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}): Promise<ApiResult> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    return { ok: false, error: 'Newsletter service is not configured' }
  }

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
