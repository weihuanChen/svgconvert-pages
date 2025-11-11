'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Root page component
 * Automatically redirects to the appropriate language version based on browser preferences
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Detect browser language preference
    const browserLang = navigator.language.toLowerCase()
    
    // Map browser language to supported languages
    let targetLang = 'en' // default to English
    
    if (browserLang.startsWith('ja')) {
      targetLang = 'ja'
    } else if (browserLang.startsWith('zh')) {
      targetLang = 'zh'
    } else if (browserLang.startsWith('en')) {
      targetLang = 'en'
    }
    
    // Redirect to the detected language version
    router.push(`/${targetLang}`)
  }, [router])

  // Return nothing while redirecting
  return null
}

