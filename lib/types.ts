export type Locale = 'ja' | 'en' | 'zh'

export interface FAQItem {
  question: string
  answer: string
}

export interface TagInfo {
  name: string
  slug: string
  postCount?: number
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  tagDetails?: TagInfo[]
  content: string
  readingTime: number
  locale: Locale
  faq?: FAQItem[]
  viewCount?: number
  uniqueViewCount?: number
  image?: string
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalPosts: number
  postsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface BlogListResponse {
  posts: BlogPost[]
  pagination: PaginationMeta
}
