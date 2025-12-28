/**
 * History List Component
 *
 * Displays list of historical conversion records
 */

'use client'

import { Button } from '@/components/ui/button'
import { Download, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { FileItem } from '@/lib/stores/conversion-store'
import type { Locale } from '@/app/i18n'
import { formatDistanceToNow } from 'date-fns'
import { ja, enUS, zhCN } from 'date-fns/locale'

interface HistoryListProps {
  /** Array of history items */
  items: FileItem[]

  /** Current language */
  locale: Locale

  /** Callback when download is clicked */
  onDownload: (taskId: string) => void

  /** Callback when delete is clicked */
  onDelete: (taskId: string) => void

  /** Custom translations */
  translations: {
    status: {
      completed: string
      failed: string
      cancelled: string
    }
    download: string
    delete: string
    noHistory: string
    createdAt: string
    fileSize: string
    processingTime: string
    taskId: string
  }
}

const dateLocales = {
  ja,
  en: enUS,
  zh: zhCN
}

export function HistoryList({
  items,
  locale,
  onDownload,
  onDelete,
  translations
}: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-black dark:border-white bg-white dark:bg-neutral-900 p-8">
        <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
        <p className="text-lg font-bold text-neutral-600 dark:text-neutral-400">
          {translations.noHistory}
        </p>
      </div>
    )
  }

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  const getStatusText = (status: FileItem['status']) => {
    if (status === 'completed') return translations.status.completed
    if (status === 'failed') return translations.status.failed
    if (status === 'cancelled') return translations.status.cancelled
    return status
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: dateLocales[locale] || enUS
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-4 border-black dark:border-white bg-white dark:bg-neutral-900 p-4"
        >
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(item.status)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black dark:text-white truncate">
                    {item.fileName}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {item.sourceFormat.toUpperCase()} → {item.targetFormat.toUpperCase()}
                  </p>
                </div>

                {/* Delete Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => item.taskId && onDelete(item.taskId)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{translations.delete}</span>
                </Button>
              </div>

              {/* Status */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {getStatusText(item.status)}
                </span>
              </div>

              {/* Metadata */}
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
                <p>
                  {translations.createdAt}: {formatDate(item.createdAt)}
                </p>
                {item.taskId && (
                  <p className="font-mono text-xs">
                    {translations.taskId}: {item.taskId.slice(0, 8)}...
                  </p>
                )}
                {item.taskMetadata?.outputFileSize && (
                  <p>
                    {translations.fileSize}:{' '}
                    {(item.taskMetadata.outputFileSize / 1024).toFixed(1)} KB
                  </p>
                )}
                {item.taskMetadata?.processingDuration && (
                  <p>
                    {translations.processingTime}:{' '}
                    {(item.taskMetadata.processingDuration / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              {/* Error Message */}
              {item.status === 'failed' && item.errorMessage && (
                <div className="mt-2 p-2 border-2 border-red-500 bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {item.errorMessage}
                  </p>
                </div>
              )}

              {/* Download Button */}
              {item.status === 'completed' && item.taskId && (
                <div className="mt-3">
                  <Button
                    onClick={() => onDownload(item.taskId)}
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {translations.download}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

