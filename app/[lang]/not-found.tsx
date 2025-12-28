"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Home, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslation, type Locale } from "@/app/i18n"

export default function NotFound() {
  const params = useParams()
  const langParam = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang
  const lang = (["ja", "en", "zh"].includes(langParam || "") ? langParam : "en") as Locale
  const t = getTranslation(lang)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] bg-white dark:bg-gray-800 p-8 md:p-12">
          {/* 404 大标题 */}
          <div className="text-center mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-black dark:text-white font-mono mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white font-mono">{t.notFound.title}</h2>
          </div>

          {/* 描述文字 */}
          <p className="text-lg md:text-xl text-black dark:text-white text-center mb-12 font-mono leading-relaxed">
            {t.notFound.description}
          </p>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${lang}`} className="flex-1 max-w-xs">
              <Button className="w-full h-14 text-lg font-bold bg-lime-400 dark:bg-lime-500 hover:bg-lime-500 dark:hover:bg-lime-600 text-black border-4 border-black dark:border-black shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#000] transition-all font-mono">
                <Home className="w-5 h-5 mr-2" />
                {t.notFound.goHome}
              </Button>
            </Link>

            <Link href={`/${lang}/blog`} className="flex-1 max-w-xs">
              <Button className="w-full h-14 text-lg font-bold bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] transition-all font-mono">
                <BookOpen className="w-5 h-5 mr-2" />
                {t.notFound.goBlog}
              </Button>
            </Link>
          </div>
        </div>

        {/* 额外提示 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-black/60 dark:text-white/60 font-mono">
            {lang === "ja" && "※ お困りの場合は、ページを更新してもう一度お試しください。"}
            {lang === "en" && "If you continue to see this error, try refreshing the page."}
            {lang === "zh" && "如果问题持续，请尝试刷新页面。"}
          </p>
        </div>
      </div>
    </div>
  )
}
