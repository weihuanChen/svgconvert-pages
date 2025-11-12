import { redirect } from 'next/navigation'

/**
 * Root Page - 301 永久重定向到日语版本
 *
 * SEO 优化策略：
 * - 使用 Next.js 的服务端 redirect 函数
 * - 生成 307 临时重定向（Next.js 标准行为）
 * - Cloudflare Worker 在边缘节点处理，超快速
 * - 防止重复内容问题
 *
 * 注意：Next.js 的 redirect() 默认返回 307 重定向
 * 在 SEO 上与 301 类似有效，Google 会正确跟踪
 */

export const metadata = {
  title: 'SVG Converter - Redirecting',
  description: 'Redirecting to Japanese version...',
  robots: {
    index: false,  // 不索引根路径
    follow: false
  }
}

export default function RootPage() {
  /**
   * 服务端重定向到日语版本
   * - 这在服务器端执行（Cloudflare Worker）
   * - 浏览器永远看不到这个页面
   * - SEO 爬虫会遵循重定向到 /ja
   */
  redirect('/ja')
}

