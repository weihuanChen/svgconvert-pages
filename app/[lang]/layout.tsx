import type React from "react"
import { Geist, Geist_Mono, Inter, Roboto_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
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

export default function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const lang = (params as any).lang as Locale || "en"
  const htmlLang = langMap[lang] || "en"

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

