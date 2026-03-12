import Link from 'next/link'

interface PostCardPost {
  title: string
  slug: string
  featuredImage?: number | { url?: string | null; alt?: string | null } | null
  createdAt: string
  content?: {
    root: {
      children: Array<{ type: string; children?: Array<{ text?: string; [k: string]: unknown }>; [k: string]: unknown }>
      [k: string]: unknown
    }
    [k: string]: unknown
  } | null
}

interface PostCardProps {
  post: PostCardPost
  basePath?: string
}

/**
 * Extract a plain-text excerpt from Lexical rich text content.
 * Walks the first few text nodes and returns up to ~150 characters.
 */
function extractExcerpt(content: PostCardPost['content'], maxLength = 150): string {
  if (!content?.root?.children) return ''

  let text = ''
  for (const node of content.root.children) {
    if (text.length >= maxLength) break
    if (node.children) {
      for (const child of node.children) {
        if (child.text) {
          text += child.text + ' '
          if (text.length >= maxLength) break
        }
      }
    }
  }

  text = text.trim()
  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trimEnd() + '...'
  }
  return text
}

export function PostCard({ post, basePath = '/blog' }: PostCardProps) {
  const href = `${basePath}/${post.slug}`
  const dateStr = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const excerpt = extractExcerpt(post.content)
  const imageUrl =
    post.featuredImage && typeof post.featuredImage === 'object'
      ? post.featuredImage.url
      : null
  const imageAlt =
    post.featuredImage && typeof post.featuredImage === 'object'
      ? post.featuredImage.alt ?? post.title
      : post.title

  return (
    <Link
      href={href}
      className="block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt ?? post.title}
          className="w-full aspect-video object-cover"
        />
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
        {excerpt && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-3">{excerpt}</p>
        )}
      </div>
    </Link>
  )
}
