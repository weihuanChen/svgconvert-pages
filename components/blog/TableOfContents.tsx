'use client'

import { useEffect, useState } from 'react'
import { List } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 提取标题（h2, h3）
    const headingRegex = /^(#{2,3})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]+/g, '-')
        .replace(/^-|-$/g, '')

      items.push({ id, text, level })
    }

    setToc(items)
  }, [content])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    const headings = document.querySelectorAll('h2[id], h3[id]')
    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [])

  if (toc.length === 0) {
    return null
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* 移动端：可折叠的 TOC */}
      <div className="lg:hidden mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-4 py-3 border-4 border-black dark:border-white bg-white dark:bg-black font-bold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          <List className="w-5 h-5" />
          <span>Table of Contents</span>
        </button>

        {isOpen && (
          <nav className="mt-4 p-4 border-4 border-black dark:border-white bg-white dark:bg-black">
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`text-left w-full py-1 hover:text-lime-500 transition-colors ${
                      activeId === item.id
                        ? 'text-lime-500 font-bold'
                        : 'text-foreground/80'
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* 桌面端：固定侧边栏 TOC */}
      <nav className="hidden lg:block sticky top-20 p-6 border-4 border-black dark:border-white bg-white dark:bg-black max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b-4 border-black dark:border-white">
          <List className="w-5 h-5" />
          <h3 className="font-bold">Table of Contents</h3>
        </div>
        <ul className="space-y-2">
          {toc.map((item) => (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`text-left text-sm py-1 hover:text-lime-500 transition-colors ${
                  activeId === item.id ? 'text-lime-500 font-bold' : 'text-foreground/80'
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
