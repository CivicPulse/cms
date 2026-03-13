/**
 * Template registry for campaign website visual themes.
 *
 * Each template defines a distinct visual identity:
 * - classic: Serif fonts, structured grid, traditional feel
 * - modern: Clean sans-serif, balanced whitespace, contemporary feel
 * - bold: Large type, vivid colors, hero-forward, dynamic layout
 */

import type { SiteSetting } from '@/payload-types'
import { ClassicLayout } from '@/components/templates/classic/ClassicLayout'
import { ModernLayout } from '@/components/templates/modern/ModernLayout'
import { BoldLayout } from '@/components/templates/bold/BoldLayout'

export type TemplateKey = 'classic' | 'modern' | 'bold'

type LayoutProps = {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
}

const templates: Record<TemplateKey, React.ComponentType<LayoutProps>> = {
  classic: ClassicLayout,
  modern: ModernLayout,
  bold: BoldLayout,
} as const

/**
 * Returns the Layout component for the given template key.
 * Falls back to ModernLayout for unknown keys (logs warning for debugging).
 */
export function getTemplate(key: string): React.ComponentType<LayoutProps> {
  if (!(key in templates)) {
    console.warn(`Unknown template key "${key}", falling back to "modern"`)
  }
  return templates[key as keyof typeof templates] ?? templates.modern
}
