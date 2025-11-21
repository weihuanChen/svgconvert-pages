import type React from "react"
import type { Metadata } from "next"
import { defaultLocale } from "@/app/i18n"
import { getSeoContent } from "@/lib/seo"
import "./globals.css"

const seo = getSeoContent(defaultLocale)
const siteUrl = "https://svgconvert.net"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seo.pageTitle,
    template: "%s | SVG Converter",
  },
  description: seo.metaDescription,
  keywords: seo.keywords,
  generator: "Next.js",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SVG Converter",
    title: seo.pageTitle,
    description: seo.metaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.pageTitle,
    description: seo.metaDescription,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
