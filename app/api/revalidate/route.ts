import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN
const BLOG_TAGS = ['blog-slugs', 'blog-posts', 'blog-search']

export async function POST(request: NextRequest) {
  if (!REVALIDATE_TOKEN) {
    console.error('[Revalidate] Missing REVALIDATE_TOKEN')
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

  if (!token || token !== REVALIDATE_TOKEN) {
    console.warn('[Revalidate] Invalid token attempt', { authHeader })
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  let body: { event?: string; collection?: string; key?: string } = {}
  try {
    body = await request.json()
  } catch {
    // ignore invalid json and fall back to empty body
  }

  const timestamp = new Date().toISOString()

  try {
    console.log('[Revalidate] Triggered', { ...body, timestamp })
    for (const tag of BLOG_TAGS) {
      await revalidateTag(tag)
    }

    return NextResponse.json({
      revalidated: true,
      tags: BLOG_TAGS,
      timestamp,
    })
  } catch (error) {
    console.error('[Revalidate] Error revalidating', error)
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
