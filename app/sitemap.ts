import type { MetadataRoute } from 'next'
import { getAllPostSlugsFromCMS } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://svgconvert.net'
  const languages = ['ja', 'en', 'zh'] as const
  const blogLanguages = ['ja'] as const

  // 获取所有博客文章的 slug
  const blogSlugs = await getAllPostSlugsFromCMS()

  return [
    // 根 URL - 重定向到日语，设置较低优先级
    {
      url: baseUrl,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: new Date()
    },
    // 每个语言版本的首页
    ...languages.map((lang) => ({
      url: `${baseUrl}/${lang}`,
      changeFrequency: 'monthly' as const,
      priority: lang === 'ja' ? 0.9 : 0.8, // 日语版本优先级最高
      lastModified: new Date()
    })),
    // FAQ 和常见页面
    ...languages.flatMap((lang) => [
      {
        url: `${baseUrl}/${lang}#how-to-use`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        lastModified: new Date()
      },
      {
        url: `${baseUrl}/${lang}#faq`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        lastModified: new Date()
      }
    ]),
    // Blog 文章页面
    ...blogSlugs.flatMap((slug) =>
      blogLanguages.map((lang) => ({
        url: `${baseUrl}/${lang}/blog/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        lastModified: new Date()
      }))
    )
  ]
}
