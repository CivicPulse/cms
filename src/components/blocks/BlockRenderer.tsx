import type { SiteSetting, Page } from '@/payload-types'
import { HeroBlockRenderer } from './HeroBlockRenderer'
import { TextBlockRenderer } from './TextBlockRenderer'
import { IssuesBlockRenderer } from './IssuesBlockRenderer'
import { ContactBlockRenderer } from './ContactBlockRenderer'

type Block = NonNullable<Page['layout']>[number]

interface BlockRendererProps {
  blocks: Block[]
  siteSettings?: SiteSetting | null
  campaignId?: string
}

export function BlockRenderer({
  blocks,
  siteSettings,
  campaignId,
}: BlockRendererProps) {
  return (
    <>
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}-${Math.random()}`

        switch (block.blockType) {
          case 'hero':
            return (
              <section key={key}>
                <HeroBlockRenderer
                  headline={block.headline}
                  subheadline={block.subheadline}
                  backgroundImage={block.backgroundImage}
                  ctaLabel={block.ctaLabel}
                  ctaUrl={block.ctaUrl}
                />
              </section>
            )
          case 'text':
            return (
              <section key={key}>
                <TextBlockRenderer content={block.content} />
              </section>
            )
          case 'issues':
            return (
              <section key={key}>
                <IssuesBlockRenderer items={block.items} />
              </section>
            )
          case 'contact':
            return (
              <section key={key}>
                <ContactBlockRenderer
                  contactEmail={block.contactEmail}
                  officeAddress={block.officeAddress}
                  phoneNumber={block.phoneNumber}
                  showNewsletterForm={block.showNewsletterForm}
                  siteSettings={siteSettings}
                  campaignId={campaignId}
                />
              </section>
            )
          default:
            return null
        }
      })}
    </>
  )
}
