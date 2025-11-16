import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter, Roboto_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageSetter } from "@/components/language-setter"
import { Header } from "@/components/Header"
import { locales, type Locale } from "@/app/i18n"
import "../globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" })

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

  const langNames: Record<Locale, string> = {
    ja: "日本語",
    en: "English",
    zh: "中文"
  }

  const descriptions: Record<Locale, string> = {
    ja: "高速で無料のSVG変換ツール。CloudflareとVPSで駆動。",
    en: "Fast, Free SVG Conversion Tool powered by Cloudflare and VPS.",
    zh: "快速、免费的SVG转换工具。由Cloudflare和VPS驱动。"
  }

  const baseUrl = "https://svgconvert.net"

  return {
    title: `SVG Converter - ${langNames[lang]}`,
    description: descriptions[lang],
    keywords: [
      "SVG converter",
      "image conversion",
      "PNG",
      "JPG",
      "PDF",
      lang === "ja" ? "SVG変換" : "",
      lang === "zh" ? "SVG转换" : ""
    ].filter(Boolean),
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
      title: `SVG Converter - ${langNames[lang]}`,
      description: descriptions[lang],
      url: `${baseUrl}/${lang}`,
      type: "website",
      locale: lang === "zh" ? "zh_Hans" : `${lang}-JP`,
      alternateLocale: locales
        .filter((l) => l !== lang)
        .map((l) => (l === "zh" ? "zh_Hans" : `${l}-JP`))
    }
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
    <div className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
      <LanguageSetter lang={lang} />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Header lang={lang} />
        {children}
      </ThemeProvider>
      <Analytics />
    </div>
  )
}

