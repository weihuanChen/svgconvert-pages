import { getPostBySlugFromCMS, getAllPostSlugsFromCMS } from '@/lib/blog'
import { type Locale } from '@/lib/types'
import { notFound } from 'next/navigation'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { MarkdownContent } from '@/components/blog/MarkdownContent'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ja, enUS, zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Script from 'next/script'

export const revalidate = 43200 // 12 小时
export const dynamicParams = true // 允许动态参数

const localeMap = {
  ja,
  en: enUS,
  zh: zhCN,
}

const siteUrl = 'https://svgconvert.net'

interface BlogPostPageProps {
  params: Promise<{ lang: Locale; slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugsFromCMS()
    const locales: Locale[] = ['ja', 'en', 'zh']

    // 为每个 locale 和 slug 的组合生成参数
    const params = locales.flatMap((lang) =>
      slugs.map((slug) => ({ lang, slug }))
    )

    return params
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    // 如果获取失败，返回空数组，允许动态渲染
    return []
  }
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

  // 确保日期有效
  const postDate = post.date ? new Date(post.date) : new Date()
  const dateLocale = localeMap[post.locale] || ja
  const articleUrl = `${siteUrl}/${lang}/blog/${post.slug}`
  const imageUrl = post.image
    ? post.image.startsWith('http')
      ? post.image
      : `${siteUrl}${post.image.startsWith('/') ? '' : '/'}${post.image}`
    : `${siteUrl}/android-chrome-512x512.png`

  const faqEntities =
    post.faq?.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })) || []

  const articleLd: Record<string, unknown> = {
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: post.title,
    datePublished: postDate.toISOString(),
    dateModified: postDate.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${siteUrl}/${lang}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SVG Converter',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    description: post.description,
    keywords: post.tags,
  }

  if (imageUrl) {
    articleLd.image = {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 675,
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      articleLd,
      ...(faqEntities.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: faqEntities,
            },
          ]
        : []),
    ],
  }

  return (
    <>
      <Script
        id="blog-post-json-ld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                      <time dateTime={post.date || ''}>
                        {format(postDate, 'PPP', { locale: dateLocale })}
                      </time>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{post.readingTime || 1} min read</span>
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
                  <MarkdownContent content={post.content} />
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
    </>
  )
}
