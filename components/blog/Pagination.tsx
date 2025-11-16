import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type PaginationMeta } from '@/lib/types'

interface PaginationProps {
  pagination: PaginationMeta
  lang: string
  basePath?: string
}

export function Pagination({ pagination, lang, basePath = '/blog' }: PaginationProps) {
  const { currentPage, totalPages, hasPreviousPage, hasNextPage } = pagination

  if (totalPages <= 1) {
    return null
  }

  const createPageUrl = (page: number) => {
    return `/${lang}${basePath}?page=${page}`
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-12">
      {/* 上一页按钮 */}
      {hasPreviousPage ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="flex items-center gap-2 px-6 py-3 border-4 border-black dark:border-white bg-white dark:bg-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-6 py-3 border-4 border-black/20 dark:border-white/20 bg-gray-100 dark:bg-gray-900 text-gray-400 font-bold cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </div>
      )}

      {/* 页码显示 */}
      <div className="px-6 py-3 border-4 border-black dark:border-white bg-lime-500 dark:bg-lime-400 text-black font-bold">
        <span>
          {currentPage} / {totalPages}
        </span>
      </div>

      {/* 下一页按钮 */}
      {hasNextPage ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="flex items-center gap-2 px-6 py-3 border-4 border-black dark:border-white bg-white dark:bg-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-6 py-3 border-4 border-black/20 dark:border-white/20 bg-gray-100 dark:bg-gray-900 text-gray-400 font-bold cursor-not-allowed">
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}
