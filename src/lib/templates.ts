/**
 * Template registry for campaign website visual themes.
 *
 * Each template defines a distinct visual identity:
 * - classic: Serif fonts, structured grid, traditional feel
 * - modern: Clean sans-serif, balanced whitespace, contemporary feel
 * - bold: Large type, vivid colors, hero-forward, dynamic layout
 */

export type TemplateKey = 'classic' | 'modern' | 'bold'

const VALID_KEYS: ReadonlySet<string> = new Set<TemplateKey>(['classic', 'modern', 'bold'])

/**
 * Validates and normalizes a template key string.
 * Falls back to 'modern' for unknown values.
 */
export function getTemplateKey(key: string): TemplateKey {
  if (VALID_KEYS.has(key)) {
    return key as TemplateKey
  }
  return 'modern'
}

// Template component mapping -- Plan 03 will populate this with actual
// React component references for each template's Layout, Hero, PostCard, etc.
// Example future shape:
//
// export const templates: Record<TemplateKey, TemplateComponents> = {
//   classic: { Layout: ClassicLayout, Hero: ClassicHero, ... },
//   modern:  { Layout: ModernLayout,  Hero: ModernHero,  ... },
//   bold:    { Layout: BoldLayout,    Hero: BoldHero,    ... },
// }
