import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageSetter } from "@/components/language-setter"
import { Header } from "@/components/Header"
import { locales, type Locale } from "@/app/i18n"
import { getSeoContent } from "@/lib/seo"
import "../globals.css"

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}

/**
 * 生成多语言元数据
 * SEO 优化：为每个语言版本设置适当的 hreflang 和 canonical 标签
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: paramLang } = await params
  const lang = (paramLang && locales.includes(paramLang as Locale)
    ? paramLang
    : "en") as Locale

  const baseUrl = "https://svgconvert.net"
  const seoCopy = getSeoContent(lang)
  const ogLocaleMap: Record<Locale, string> = {
    ja: "ja_JP",
    en: "en_US",
    zh: "zh_Hans",
  }

  return {
    title: seoCopy.pageTitle,
    description: seoCopy.metaDescription,
    keywords: seoCopy.keywords,
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: Object.fromEntries(
        locales.map((locale) => [
          locale,
          `${baseUrl}/${locale}`
        ])
      )
    },
    openGraph: {
      title: seoCopy.pageTitle,
      description: seoCopy.metaDescription,
      url: `${baseUrl}/${lang}`,
      type: "website",
      siteName: "SVG Converter",
      locale: ogLocaleMap[lang],
      alternateLocale: locales
        .filter((l) => l !== lang)
        .map((l) => ogLocaleMap[l]),
    },
    twitter: {
      card: "summary_large_image",
      title: seoCopy.pageTitle,
      description: seoCopy.metaDescription,
    },
  }
}

const langMap: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh"
}

interface LangLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout({
  children,
  params,
}: Readonly<LangLayoutProps>) {
  const { lang: paramLang } = await params
  const lang = (paramLang && locales.includes(paramLang as Locale) ? paramLang : "en") as Locale

  return (
    <div className="font-sans antialiased">
      <LanguageSetter lang={lang} />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Header lang={lang} />
        {children}
      </ThemeProvider>
      <Analytics />
    </div>
  )
}

