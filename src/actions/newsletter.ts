'use server'

import { subscribeToNewsletter, updateSubscriber } from '@/lib/api'

export async function subscribeAction(params: {
  email: string
  campaignId: string
}) {
  return subscribeToNewsletter(params)
}

export async function updateSubscriberAction(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}) {
  return updateSubscriber(params)
}
