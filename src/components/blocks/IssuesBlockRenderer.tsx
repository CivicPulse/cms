interface IssueItem {
  title: string
  description?: string | null
  id?: string | null
}

interface IssuesBlockProps {
  items?: IssueItem[] | null
}

export function IssuesBlockRenderer({ items }: IssuesBlockProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Key Issues</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={item.id ?? index}
              className="bg-white rounded-lg p-6 border-l-4 border-primary shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-gray-600">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
