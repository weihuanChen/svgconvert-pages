import Link from 'next/link'
import { BookOpen } from 'lucide-react'

interface BlogIconProps {
  lang: string
  className?: string
}

export function BlogIcon({ lang, className = '' }: BlogIconProps) {
  return (
    <Link
      href={`/${lang}/blog`}
      className={`inline-flex items-center justify-center w-10 h-10 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:bg-lime-500 dark:hover:bg-lime-400 hover:text-black ${className}`}
      aria-label="Blog"
      title="Blog"
    >
      <BookOpen className="w-5 h-5" />
    </Link>
  )
}
