'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface MobileNavProps {
  navItems: Array<{ label: string; url: string }>
  candidateName: string
}

export function MobileNav({ navItems, candidateName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const navPanelRef = useRef<HTMLElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
      // I7: Focus the close button when menu opens
      closeButtonRef.current?.focus()
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  // I7: Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  // I7: Trap focus within the nav panel
  useEffect(() => {
    if (!isOpen || !navPanelRef.current) return
    const panel = navPanelRef.current
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = panel.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
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
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
            aria-hidden="true"
          />

          {/* Nav panel */}
          <nav ref={navPanelRef} className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-white shadow-xl p-6 flex flex-col animate-slide-in-right">
            {/* Close button */}
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg">{candidateName}</span>
              <button
                ref={closeButtonRef}
                onClick={close}
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
              {navItems.map((item, index) => {
                const isExternal = item.url.startsWith('http')

                if (isExternal) {
                  return (
                    <li key={`${item.url}-${index}`}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-gray-700 hover:text-primary transition-colors"
                        onClick={close}
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                }

                return (
                  <li key={`${item.url}-${index}`}>
                    <Link
                      href={item.url}
                      className="text-lg text-gray-700 hover:text-primary transition-colors"
                      onClick={close}
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
