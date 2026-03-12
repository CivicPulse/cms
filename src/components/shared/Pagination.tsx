import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex justify-between items-center py-8" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="text-primary hover:underline font-medium"
        >
          &larr; Newer Posts
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="text-primary hover:underline font-medium"
        >
          Older Posts &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
