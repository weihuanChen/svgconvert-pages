import type React from "react"
import { Geist, Geist_Mono, Inter, Roboto_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageSetter } from "@/components/language-setter"
import { locales, type Locale } from "@/app/i18n"
import "../globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" })

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}

const langMap: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh",
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
        {children}
      </ThemeProvider>
      <Analytics />
    </div>
  )
}

