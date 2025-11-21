import { defaultLocale, type Locale } from "@/app/i18n"

const baseKeywords = [
  "svg converter",
  "svg to png",
  "svg to jpg",
  "svg to pdf",
  "cloudflare",
  "batch conversion",
]

type SeoCopy = {
  pageTitle: string
  metaDescription: string
  keywords: string[]
}

const seoContent: Record<Locale, SeoCopy> = {
  en: {
    pageTitle: "SVG Converter | Free Online SVG to PNG, JPG, PDF & More",
    metaDescription:
      "Convert SVG files to PNG, JPG, PDF, EPS, and WebP in seconds. Free, privacy-safe, Cloudflare-powered batch conversions with adjustable quality settings.",
    keywords: [
      ...baseKeywords,
      "vector conversion",
      "eps to svg",
      "online converter",
    ],
  },
  ja: {
    pageTitle: "SVG変換ツール | 無料でSVG→PNG/JPG/PDF/EPS",
    metaDescription:
      "SVGをPNG・JPG・PDF・EPS・WebPへ秒速変換。無料・会員登録不要。CloudflareとVPSが支える高速バッチ変換と細かな品質調整に対応。",
    keywords: [
      ...baseKeywords,
      "svg 変換",
      "ベクター 変換",
      "オンライン 画像 変換",
    ],
  },
  zh: {
    pageTitle: "SVG 转换器｜免费在线 SVG 转 PNG/JPG/PDF/EPS",
    metaDescription:
      "秒速将 SVG 转成 PNG、JPG、PDF、EPS、WebP。完全免费、无需注册，Cloudflare + VPS 提供安全高速的批量转换与画质控制。",
    keywords: [
      ...baseKeywords,
      "svg 转换",
      "在线图片转换",
      "svg 转 png 工具",
    ],
  },
}

export function getSeoContent(locale: Locale): SeoCopy {
  return seoContent[locale] ?? seoContent[defaultLocale]
}


