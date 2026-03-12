'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MobileNavProps {
  navItems: Array<{ label: string; url: string }>
  candidateName: string
}

export function MobileNav({ navItems, candidateName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-700 hover:text-primary transition-colors"
        aria-label="Open navigation menu"
        type="button"
      >
        <div className="w-6 flex flex-col gap-1.5">
          <div className="h-0.5 w-full bg-current" />
          <div className="h-0.5 w-full bg-current" />
          <div className="h-0.5 w-full bg-current" />
        </div>
      </button>

      {/* Overlay + slide-in panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Nav panel */}
          <nav className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-white shadow-xl p-6 flex flex-col animate-slide-in-right">
            {/* Close button */}
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg">{candidateName}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close navigation menu"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <ul className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isExternal = item.url.startsWith('http')

                if (isExternal) {
                  return (
                    <li key={item.url}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-gray-700 hover:text-primary transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                }

                return (
                  <li key={item.url}>
                    <Link
                      href={item.url}
                      className="text-lg text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
