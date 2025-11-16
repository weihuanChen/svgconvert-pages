import { getPostBySlugFromCMS, getAllPostSlugsFromCMS } from '@/lib/blog'
import { type Locale } from '@/lib/types'
import { notFound } from 'next/navigation'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ja, enUS, zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Streamdown from 'streamdown'

export const revalidate = 43200 // 12 小时

const localeMap = {
  ja,
  en: enUS,
  zh: zhCN,
}

interface BlogPostPageProps {
  params: Promise<{ lang: Locale; slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugsFromCMS()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { lang, slug } = await params
  const post = await getPostBySlugFromCMS(slug, lang)

  if (!post) {
    return {
      title: 'Not Found',
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.image && { images: [post.image] }),
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = await params
  const post = await getPostBySlugFromCMS(slug, lang)

  if (!post) {
    notFound()
  }

  const dateLocale = localeMap[post.locale] || ja

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <Link
          href={`/${lang}/blog`}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black font-medium transition-all hover:bg-lime-500 dark:hover:bg-lime-400 hover:text-black"
        >
          ← Back to Blog
        </Link>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* 主内容区 */}
            <article className="min-w-0">
              {/* 文章头部 */}
              <header className="mb-8 p-8 border-4 border-black dark:border-white bg-white dark:bg-black">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
                <p className="text-xl text-foreground/80 mb-6">{post.description}</p>

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={post.date}>
                      {format(new Date(post.date), 'PPP', { locale: dateLocale })}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.readingTime} min read</span>
                  </div>
                </div>

                {/* 标签 */}
                {post.tagDetails && post.tagDetails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t-4 border-black dark:border-white">
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
              </header>

              {/* 移动端 TOC */}
              <div className="lg:hidden mb-8">
                <TableOfContents content={post.content} />
              </div>

              {/* 文章内容 */}
              <div className="prose prose-lg max-w-none p-8 border-4 border-black dark:border-white bg-white dark:bg-black blog-content">
                <Streamdown content={post.content} />
              </div>
            </article>

            {/* 桌面端侧边栏 TOC */}
            <aside className="hidden lg:block">
              <TableOfContents content={post.content} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
