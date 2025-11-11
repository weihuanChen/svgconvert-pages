/**
 * Cloudflare Pages Function
 * 
 * This function handles routing and redirects for the Next.js application.
 * It runs before any static files are served.
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context
  const url = new URL(request.url)
  const pathname = url.pathname

  // 支持的语言列表
  const locales = ['ja', 'en', 'zh']
  const defaultLocale = 'ja'

  // 检查路径是否已经包含有效的语言代码
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]

  // 如果是根路径 (/)，重定向到默认语言
  if (pathname === '/') {
    return new Response(null, {
      status: 307,
      headers: {
        Location: `/${defaultLocale}`,
      },
    })
  }

  // 如果第一个路径段不是有效的语言代码，重定向到默认语言
  if (pathname !== '/' && firstSegment && !locales.includes(firstSegment)) {
    // 检查是否是静态资源（js, css, 图片等）或 API 路由
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/.test(pathname)
    ) {
      // 让静态资源和 API 路由通过
      return context.next()
    }

    // 其他路由重定向到默认语言
    return new Response(null, {
      status: 307,
      headers: {
        Location: `/${defaultLocale}${pathname}`,
      },
    })
  }

  // 继续处理其他请求
  return context.next()
}

