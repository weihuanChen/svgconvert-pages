import type { Metadata } from "next"
import { getTranslation, type Locale, locales, defaultLocale } from "@/app/i18n"
import { SvgToCodeClient } from "@/components/svg-to-code/SvgToCodeClient"

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const { lang: paramLang } = params
  const lang = (paramLang && locales.includes(paramLang as Locale) ? paramLang : defaultLocale) as Locale
  const copy = getTranslation(lang).svgToCode
  const baseUrl = "https://svgconvert.net"

  return {
    title: `${copy.title} | SVG Converter`,
    description: copy.subtitle,
    alternates: {
      canonical: `${baseUrl}/${lang}/svg-to-code`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `${baseUrl}/${locale}/svg-to-code`])),
    },
    openGraph: {
      title: `${copy.title} | SVG Converter`,
      description: copy.subtitle,
      url: `${baseUrl}/${lang}/svg-to-code`,
      type: "website",
    },
  }
}

export default function SvgToCodePage({ params }: { params: { lang: string } }) {
  const { lang: paramLang } = params
  const lang = (paramLang && locales.includes(paramLang as Locale) ? paramLang : defaultLocale) as Locale
  return <SvgToCodeClient lang={lang} />
}
