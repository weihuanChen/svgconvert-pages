'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

type Copy = {
  title: string
  description: string
  cta: string
}

const copyMap: Record<string, Copy> = {
  ja: {
    title: 'お探しのページはこの言語では利用できません',
    description: 'このブログ記事は日本語版のみです。ブログ一覧からほかの記事をご覧ください。',
    cta: 'ブログ一覧へ戻る',
  },
  en: {
    title: "This article isn't available in English",
    description: 'We only have the Japanese version for now. Check the blog list to find articles in your language.',
    cta: 'Go to blog list',
  },
  zh: {
    title: '暂未提供该文章的中文版本',
    description: '目前只有日语版。去博客列表看看其他文章吧。',
    cta: '返回博客列表',
  },
}

export default function NotFound() {
  const params = useParams()
  const langParam = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang
  const lang = ['ja', 'en', 'zh'].includes(langParam || '') ? (langParam as string) : 'en'
  const copy = copyMap[lang]

  return (
    <div className="min-h-screen bg-background flex items-center">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-10 shadow-lg">
          <div className="flex items-center gap-3 text-lime-600 dark:text-lime-400 font-semibold">
            <AlertCircle className="w-6 h-6" />
            <span>404</span>
          </div>
          <h1 className="text-4xl font-bold mt-4 mb-3">{copy.title}</h1>
          <p className="text-lg text-foreground/70 mb-8 leading-relaxed">{copy.description}</p>

          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white bg-lime-500 dark:bg-lime-400 text-black font-semibold transition-transform duration-150 hover:-translate-y-0.5"
          >
            ← {copy.cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
