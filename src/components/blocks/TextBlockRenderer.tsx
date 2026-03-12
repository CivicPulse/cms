import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

interface TextBlockProps {
  content?: SerializedEditorState | null
}

export function TextBlockRenderer({ content }: TextBlockProps) {
  if (!content) return null

  return (
    <section className="py-12 px-4">
      <div className="prose prose-lg max-w-none">
        <RichText data={content} />
      </div>
    </section>
  )
}
