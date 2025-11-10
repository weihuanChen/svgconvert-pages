/**
 * Language Switcher Component
 *
 * Allows users to switch between supported languages
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { locales, type Locale } from '@/app/i18n'
import { Languages } from 'lucide-react'

interface LanguageSwitcherProps {
  /** Current language */
  currentLocale: Locale

  /** Show icon */
  showIcon?: boolean

  /** Custom class name */
  className?: string
}

const languageNames: Record<Locale, { native: string; english: string }> = {
  ja: { native: '日本語', english: 'Japanese' },
  en: { native: 'English', english: 'English' },
  zh: { native: '中文', english: 'Chinese' }
}

export function LanguageSwitcher({
  currentLocale,
  showIcon = true,
  className = ''
}: LanguageSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    // Replace the locale in the current path
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')

    router.push(newPath)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <Languages className="h-5 w-5 text-black dark:text-white" />
      )}
      <Select value={currentLocale} onValueChange={(value) => handleLanguageChange(value as Locale)}>
        <SelectTrigger className="w-[160px] border-4 border-black dark:border-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale} value={locale}>
              <span className="font-medium">
                {languageNames[locale].native}
              </span>
              {locale !== currentLocale && (
                <span className="ml-2 text-xs text-neutral-500">
                  ({languageNames[locale].english})
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
