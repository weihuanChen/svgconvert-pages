import type { MetadataRoute } from 'next'
import { locales } from './i18n'
import { getPostSlugsWithLanguagesFromCMS } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://svgconvert.net'
  const languages = locales
  const blogSlugLocales = await getPostSlugsWithLanguagesFromCMS()
  const lastModified = new Date()

  const entries: MetadataRoute.Sitemap = [
    // 根 URL - 重定向到日语，设置较低优先级
    {
      url: baseUrl,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified
    },
    // 每个语言版本的首页
    ...languages.map((lang) => ({
      url: `${baseUrl}/${lang}`,
      changeFrequency: 'monthly' as const,
      priority: lang === 'ja' ? 0.9 : 0.8, // 日语版本优先级最高
      lastModified
    })),
    // 用户服务协议页面
    ...languages.map((lang) => ({
      url: `${baseUrl}/${lang}/user-service`,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
      lastModified
    })),
    // FAQ 和常见页面
    ...languages.flatMap((lang) => [
      {
        url: `${baseUrl}/${lang}#how-to-use`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        lastModified
      },
      {
        url: `${baseUrl}/${lang}#faq`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        lastModified
      }
    ]),
    // Blog 文章页面
    ...blogSlugLocales.flatMap(({ slug, languages: langs }) =>
      langs.map((lang) => ({
        url: `${baseUrl}/${lang}/blog/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        lastModified
      }))
    )
  ]

  return entries
}
