import React from 'react'

export const metadata = {
  title: 'CivPulse CMS',
  description: 'Campaign website content management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
