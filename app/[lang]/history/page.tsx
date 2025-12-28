'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { HistoryList } from '@/components/svg-converter/HistoryList'
import { useConversionStore } from '@/lib/stores/conversion-store'
import { getTranslation, type Locale, locales, defaultLocale } from '@/app/i18n'
import { downloadFile } from '@/lib/api-client'
import { Trash2, Search, Filter } from 'lucide-react'
import type { HistoryFilters } from '@/lib/stores/conversion-store'
import type { FileFormat } from '@/types/cloudflare'

interface PageProps {
  params: Promise<{ lang: string }>
}

export default function HistoryPage({ params }: PageProps) {
  const router = useRouter()
  const [lang, setLang] = useState<Locale>(defaultLocale)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})

  const { history, getHistory, clearHistory, deleteHistoryItem, cleanupOldHistory } =
    useConversionStore()

  const langPromise = useMemo(() => params, [params])

  useEffect(() => {
    langPromise.then((p) => {
      const paramLang = p.lang as Locale
      if (locales.includes(paramLang)) {
        setLang(paramLang)
      } else {
        setLang(defaultLocale)
      }
    })
  }, [langPromise])

  // Clean up old history on mount (older than 30 days)
  useEffect(() => {
    cleanupOldHistory(30)
  }, [cleanupOldHistory])

  const t = getTranslation(lang)

  // Build filters
  const filters: HistoryFilters = {
    searchQuery: searchQuery || undefined,
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    sourceFormat: formatFilter !== 'all' ? (formatFilter as FileFormat) : undefined
  }

  const filteredHistory = getHistory(filters)

  const handleDownload = async (taskId: string) => {
    if (isDownloading[taskId]) return

    setIsDownloading((prev) => ({ ...prev, [taskId]: true }))

    try {
      const historyItem = history.find((h) => h.taskId === taskId)
      const downloadUrl = `/api/download/${taskId}/file`
      const fileName = historyItem
        ? `${historyItem.fileName.replace(/\.[^.]+$/, '')}.${historyItem.targetFormat}`
        : `converted_${taskId}`
      await downloadFile(downloadUrl, fileName)
    } catch (error) {
      console.error('Download failed:', error)
      alert(
        lang === 'ja'
          ? 'ダウンロードに失敗しました'
          : lang === 'zh'
            ? '下载失败'
            : 'Download failed'
      )
    } finally {
      setIsDownloading((prev) => ({ ...prev, [taskId]: false }))
    }
  }

  const handleDelete = (taskId: string) => {
    if (confirm(t.history?.confirmDelete || 'Are you sure you want to delete this record?')) {
      deleteHistoryItem(taskId)
    }
  }

  const handleClearAll = () => {
    if (confirm(t.history?.confirmClearAll || 'Are you sure you want to clear all history?')) {
      clearHistory()
    }
  }

  const translations = {
    status: {
      completed: t.history?.status?.completed || 'Completed',
      failed: t.history?.status?.failed || 'Failed',
      cancelled: t.history?.status?.cancelled || 'Cancelled'
    },
    download: t.download || 'Download',
    delete: t.history?.delete || 'Delete',
    noHistory: t.history?.noHistory || 'No history records',
    createdAt: t.history?.createdAt || 'Created',
    fileSize: t.history?.fileSize || 'File size',
    processingTime: t.history?.processingTime || 'Processing time',
    taskId: t.history?.taskId || 'Task ID'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-black dark:text-white mb-2">
            {t.history?.title || 'Download History'}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {t.history?.subtitle || 'View and manage your conversion history'}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder={t.history?.searchPlaceholder || 'Search by file name or task ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-4 border-black dark:border-white bg-white dark:bg-neutral-900"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 border-4 border-black dark:border-white bg-white dark:bg-neutral-900">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t.history?.filterStatus || 'Filter by status'} />
              </SelectTrigger>
              <SelectContent className="border-4 border-black dark:border-white bg-white dark:bg-neutral-900">
                <SelectItem value="all">{t.history?.filterAll || 'All'}</SelectItem>
                <SelectItem value="completed">{t.history?.status?.completed || 'Completed'}</SelectItem>
                <SelectItem value="failed">{t.history?.status?.failed || 'Failed'}</SelectItem>
                <SelectItem value="cancelled">{t.history?.status?.cancelled || 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>

            {/* Format Filter */}
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full sm:w-48 border-4 border-black dark:border-white bg-white dark:bg-neutral-900">
                <SelectValue placeholder={t.history?.filterFormat || 'Filter by format'} />
              </SelectTrigger>
              <SelectContent className="border-4 border-black dark:border-white bg-white dark:bg-neutral-900">
                <SelectItem value="all">{t.history?.filterAll || 'All'}</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear All Button */}
          {filteredHistory.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="border-4 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.history?.clearAll || 'Clear All History'}
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 border-4 border-black dark:border-white bg-lime-50 dark:bg-lime-950">
          <p className="text-sm font-bold text-black dark:text-white">
            {t.history?.totalRecords || 'Total records'}: {filteredHistory.length}
            {history.length !== filteredHistory.length && ` (${history.length} total)`}
          </p>
        </div>

        {/* History List */}
        <HistoryList
          items={filteredHistory}
          locale={lang}
          onDownload={handleDownload}
          onDelete={handleDelete}
          translations={translations}
        />

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => router.push(`/${lang}`)}
            className="border-4 border-black dark:border-white bg-lime-400 dark:bg-lime-500 text-black font-mono font-bold"
          >
            {t.history?.backToHome || 'Back to Home'}
          </Button>
        </div>
      </div>
    </div>
  )
}

