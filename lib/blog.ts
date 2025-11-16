import { readItems, aggregate } from '@directus/sdk'
import { directus, SITE_ID, type DirectusPost, type PostTranslation, type Tag, type TagTranslation } from './directus'
import { type BlogPost, type Locale, type TagInfo, type BlogListResponse } from './types'

// 禁用缓存的开关（用于调试）
const DISABLE_CACHE = process.env.DISABLE_BLOG_CACHE === 'true'

// 缓存时间：12小时
const CACHE_REVALIDATE = 43200

// 计算阅读时间（基于字数）
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// 获取翻译后的标签
async function getTranslatedTags(
  postTags: Array<{ tags_id: number }> | undefined,
  locale: Locale
): Promise<{ names: string[]; details: TagInfo[] }> {
  if (!postTags || postTags.length === 0) {
    return { names: [], details: [] }
  }

  try {
    const tagIds = postTags.map((pt) => pt.tags_id)
    const tags = await directus.request(
      readItems('tags', {
        filter: {
          id: { _in: tagIds },
        },
        fields: ['id', 'name', 'slug', 'translations.*'],
      })
    )

    const tagNames: string[] = []
    const tagDetails: TagInfo[] = []

    for (const tag of tags as Tag[]) {
      // 优先使用翻译，否则使用原始名称
      let translatedName = tag.name
      if (tag.translations && tag.translations.length > 0) {
        const translation = tag.translations.find((t) => t.language_code === locale)
        if (translation) {
          translatedName = translation.translated_name
        }
      }

      tagNames.push(translatedName)
      tagDetails.push({
        name: translatedName,
        slug: tag.slug,
      })
    }

    return { names: tagNames, details: tagDetails }
  } catch (error) {
    console.error('Error fetching tags:', error)
    return { names: [], details: [] }
  }
}

// 转换 Directus Post 到 BlogPost
async function transformPost(
  directusPost: DirectusPost,
  translation: PostTranslation | null,
  locale: Locale
): Promise<BlogPost> {
  // 获取翻译后的标签
  const { names: tagNames, details: tagDetails } = await getTranslatedTags(
    directusPost.post_tags,
    locale
  )

  // 使用翻译或原始内容
  const title = translation?.title || directusPost.title
  const description = translation?.description || directusPost.description
  const content = translation?.content || directusPost.content

  return {
    slug: directusPost.slug,
    title,
    description,
    content,
    date: directusPost.published_at || directusPost.date_created || '',
    author: 'Admin',
    tags: tagNames,
    tagDetails,
    readingTime: calculateReadingTime(content),
    locale,
    viewCount: directusPost.view_count,
    uniqueViewCount: directusPost.unique_view_count,
    image: directusPost.image,
  }
}

/**
 * 获取博客列表（分页）
 */
export async function getAllPostsFromCMS(
  locale: Locale,
  page: number = 1,
  limit: number = 12
): Promise<BlogListResponse> {
  try {
    const offset = (page - 1) * limit

    // 获取文章总数
    const [countResult] = await directus.request(
      aggregate('posts', {
        aggregate: { count: '*' },
        query: {
          filter: {
            status: { _eq: 'published' },
            site_id: { _eq: SITE_ID },
          },
        },
      })
    )

    const totalPosts = Number(countResult.count) || 0
    const totalPages = Math.ceil(totalPosts / limit)

    // 获取文章列表
    const posts = await directus.request(
      readItems('posts', {
        filter: {
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: [
          'id',
          'slug',
          'title',
          'description',
          'content',
          'published_at',
          'date_created',
          'image',
          'view_count',
          'unique_view_count',
          'post_tags.tags_id',
        ],
        sort: ['-published_at'],
        limit,
        offset,
      })
    )

    // 获取翻译
    const postIds = (posts as DirectusPost[]).map((p) => p.id)
    const translations = await directus.request(
      readItems('post_translation', {
        filter: {
          post_id: { _in: postIds },
          language_code: { _eq: locale },
        },
        fields: ['post_id', 'title', 'description', 'content'],
      })
    )

    // 转换为 BlogPost
    const blogPosts: BlogPost[] = []
    for (const post of posts as DirectusPost[]) {
      const translation =
        (translations as PostTranslation[]).find((t) => t.post_id === post.id) || null
      const blogPost = await transformPost(post, translation, locale)
      blogPosts.push(blogPost)
    }

    return {
      posts: blogPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    return {
      posts: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: limit,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  }
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getPostBySlugFromCMS(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  try {
    const posts = await directus.request(
      readItems('posts', {
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: [
          'id',
          'slug',
          'title',
          'description',
          'content',
          'published_at',
          'date_created',
          'image',
          'view_count',
          'unique_view_count',
          'post_tags.tags_id',
        ],
        limit: 1,
      })
    )

    if (!posts || posts.length === 0) {
      return null
    }

    const post = (posts as DirectusPost[])[0]

    // 获取翻译
    const translations = await directus.request(
      readItems('post_translation', {
        filter: {
          post_id: { _eq: post.id },
          language_code: { _eq: locale },
        },
        fields: ['post_id', 'title', 'description', 'content'],
        limit: 1,
      })
    )

    const translation =
      translations && translations.length > 0 ? (translations as PostTranslation[])[0] : null

    return transformPost(post, translation, locale)
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

/**
 * 获取所有文章的 slug（用于静态生成）
 */
export async function getAllPostSlugsFromCMS(): Promise<string[]> {
  try {
    const posts = await directus.request(
      readItems('posts', {
        filter: {
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: ['slug'],
      })
    )

    return (posts as DirectusPost[]).map((post) => post.slug)
  } catch (error) {
    console.error('Error fetching post slugs:', error)
    return []
  }
}
