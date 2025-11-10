import { NextRequest, NextResponse } from 'next/server'

const locales = ['ja', 'en', 'zh']
const defaultLocale = 'ja'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Redirect root to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
  }

  // If pathname doesn't have a locale, prepend default locale
  return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icon-.*\\.png).*)',
  ],
}

