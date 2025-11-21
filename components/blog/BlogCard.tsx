import Link from 'next/link'
import { Clock, Calendar } from 'lucide-react'
import { type BlogPost } from '@/lib/types'
import { format } from 'date-fns'
import { ja, enUS, zhCN } from 'date-fns/locale'

interface BlogCardProps {
  post: BlogPost
  lang: string
}

const localeMap = {
  ja,
  en: enUS,
  zh: zhCN,
}

export function BlogCard({ post, lang }: BlogCardProps) {
  const dateLocale = localeMap[post.locale as keyof typeof localeMap] || ja

  return (
    <Link
      href={`/${lang}/blog/${post.slug}`}
      className="blog-card-hover group block border-4 border-black dark:border-white bg-white dark:bg-black p-6 shadow-none hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
    >
      {/* 标题 */}
      <h2 className="text-2xl font-bold mb-3 group-hover:text-lime-500 transition-colors">
        {post.title}
      </h2>

      {/* 描述 */}
      <p className="text-foreground/80 mb-4 line-clamp-3">{post.description}</p>

      {/* 元信息 */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <time dateTime={post.date}>
            {format(new Date(post.date), 'PPP', { locale: dateLocale })}
          </time>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{post.readingTime} min read</span>
        </div>
      </div>

      {/* 标签 */}
      {post.tagDetails && post.tagDetails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tagDetails.map((tag) => (
            <span
              key={tag.slug}
              className="inline-block px-3 py-1 text-sm border-2 border-black dark:border-white bg-lime-500 dark:bg-lime-400 text-black font-medium"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
