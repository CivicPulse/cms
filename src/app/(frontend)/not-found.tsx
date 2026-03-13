import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center font-sans text-gray-600 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
      <p className="text-lg mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-primary hover:underline font-medium"
      >
        Back to homepage
      </Link>
    </div>
  )
}
