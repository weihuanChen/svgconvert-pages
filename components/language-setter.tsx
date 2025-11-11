"use client"

import { useEffect } from "react"
import { locales, type Locale } from "@/app/i18n"

const langMap: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh",
}

interface LanguageSetterProps {
  lang: Locale
}

export function LanguageSetter({ lang }: LanguageSetterProps) {
  useEffect(() => {
    const htmlLang = langMap[lang] || "en"
    document.documentElement.lang = htmlLang
    document.documentElement.setAttribute("lang", htmlLang)
  }, [lang])

  return null
}

