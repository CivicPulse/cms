interface InitialsAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-lg',
  lg: 'h-24 w-24 text-2xl',
} as const

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function InitialsAvatar({ name, size = 'md', className = '' }: InitialsAvatarProps) {
  const initials = getInitials(name)

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold bg-primary text-white ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  )
}
