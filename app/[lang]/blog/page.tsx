import { getAllPostsFromCMS } from '@/lib/blog'
import { type Locale } from '@/lib/types'
import { BlogCard } from '@/components/blog/BlogCard'
import { Pagination } from '@/components/blog/Pagination'
import { BookOpen } from 'lucide-react'

export const revalidate = 43200 // 12 小时

interface BlogPageProps {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ page?: string }>
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parseInt(pageParam || '1', 10)

  const { posts, pagination } = await getAllPostsFromCMS(lang, currentPage, 12)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <BookOpen className="w-12 h-12" />
            <h1 className="text-5xl font-bold">Blog</h1>
          </div>
          <p className="text-lg text-foreground/60">
            {lang === 'ja' && '技術記事とチュートリアル'}
            {lang === 'en' && 'Technical articles and tutorials'}
            {lang === 'zh' && '技术文章与教程'}
          </p>
        </div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-foreground/60">
              {lang === 'ja' && '記事がありません'}
              {lang === 'en' && 'No posts found'}
              {lang === 'zh' && '暂无文章'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} lang={lang} />
              ))}
            </div>

            {/* 分页 */}
            <Pagination pagination={pagination} lang={lang} basePath="/blog" />
          </>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params

  const titles = {
    ja: 'ブログ | SVG変換ツール',
    en: 'Blog | SVG Converter',
    zh: '博客 | SVG转换工具',
  }

  const descriptions = {
    ja: 'SVG変換に関する技術記事とチュートリアル',
    en: 'Technical articles and tutorials about SVG conversion',
    zh: '关于SVG转换的技术文章和教程',
  }

  return {
    title: titles[lang] || titles.en,
    description: descriptions[lang] || descriptions.en,
  }
}
