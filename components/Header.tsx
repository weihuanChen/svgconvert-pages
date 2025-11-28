"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Sun, Moon, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { type Locale } from "@/lib/types"

interface HeaderProps {
  lang: Locale
}

export function Header({ lang }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleLanguageChange = (newLang: string) => {
    router.push(`/${newLang}`)
  }

  const copyLink = () => {
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href
      navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareText = {
    ja: "リンクを共有",
    en: "Share Link",
    zh: "分享链接",
  }

  const svgToCodeText = {
    ja: "SVG→コード",
    en: "SVG→Code",
    zh: "SVG→代码",
  }

  const copiedText = {
    ja: "コピーしました！",
    en: "Copied!",
    zh: "已复制！",
  }

  return (
    <header className="border-b-4 border-black dark:border-white bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo/Title - Clickable to return home */}
          <Link
            href={`/${lang}`}
            className="text-2xl md:text-3xl font-bold font-mono text-black dark:text-white hover:text-lime-500 dark:hover:text-lime-400 transition-colors"
          >
            SVG CONVERTER
          </Link>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* SVG to Code */}
            <Link
              href={`/${lang}/svg-to-code`}
              className="inline-flex items-center justify-center h-10 px-4 border-4 border-black dark:border-white bg-lime-400 dark:bg-lime-500 text-black font-mono font-bold hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] transition-transform shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]"
              title={svgToCodeText[lang]}
            >
              {svgToCodeText[lang]}
            </Link>

            {/* Language Selector */}
            <Select value={lang} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-20 border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-mono font-bold shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-4 border-black dark:border-white bg-white dark:bg-gray-800">
                <SelectItem value="ja">JA</SelectItem>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="zh">ZH</SelectItem>
              </SelectContent>
            </Select>

            {/* Blog Icon */}
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center justify-center h-10 w-10 border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-lime-400 dark:hover:bg-lime-500 hover:text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-colors"
              title="Blog"
            >
              <BookOpen className="h-5 w-5" />
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Share Link */}
            <Button
              variant="outline"
              size="icon"
              onClick={copyLink}
              className="border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] relative"
              title={shareText[lang]}
            >
              <Share2 className="h-5 w-5" />
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono bg-lime-500 dark:bg-lime-500 text-black px-2 py-1 border-2 border-black dark:border-white whitespace-nowrap shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                  {copiedText[lang]}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
