/**
 * Theme Toggle Component
 *
 * Allows users to switch between light and dark themes
 */

'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean

  /** Button variant */
  variant?: 'default' | 'outline'

  /** Custom class name */
  className?: string
}

export function ThemeToggle({
  showLabel = false,
  variant = 'outline',
  className = ''
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={showLabel ? 'default' : 'icon'}
        className={className}
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant={variant}
      size={showLabel ? 'default' : 'icon'}
      onClick={toggleTheme}
      className={className}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  )
}
