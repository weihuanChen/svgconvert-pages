/**
 * File List Component
 *
 * Displays list of files with their conversion status
 */

'use client'

import { FilePreview } from './FilePreview'
import { Button } from '@/components/ui/button'
import { Download, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { FileItem } from '@/lib/stores/conversion-store'
import type { Locale } from '@/app/i18n'

interface FileListProps {
  /** Array of file items */
  files: FileItem[]

  /** Current language */
  locale: Locale

  /** Callback when download is clicked */
  onDownload: (fileId: string) => void

  /** Callback when remove is clicked */
  onRemove: (fileId: string) => void

  /** Custom translations */
  translations: {
    status: {
      idle: string
      uploading: string
      pending: string
      processing: string
      completed: string
      failed: string
      cancelled: string
    }
    download: string
    remove: string
  }
}

export function FileList({
  files,
  locale,
  onDownload,
  onRemove,
  translations
}: FileListProps) {
  if (files.length === 0) {
    return null
  }

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading':
      case 'pending':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
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
    return translations.status[status] || status
  }

  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading':
      case 'pending':
      case 'processing':
        return 'text-blue-600 dark:text-blue-400'
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'failed':
      case 'cancelled':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-neutral-600 dark:text-neutral-400'
    }
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="border-4 border-black dark:border-white bg-white dark:bg-neutral-900 p-4"
        >
          <div className="flex items-start gap-4">
            {/* File Preview */}
            <FilePreview
              previewUrl={file.previewUrl}
              fileName={file.fileName}
              format={file.sourceFormat}
            />

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black dark:text-white truncate">
                    {file.fileName}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {file.sourceFormat.toUpperCase()} → {file.targetFormat.toUpperCase()}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onRemove(file.id)}
                  className="flex-shrink-0"
                  disabled={file.status === 'uploading' || file.status === 'processing'}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{translations.remove}</span>
                </Button>
              </div>

              {/* Status */}
              <div className="mt-2 flex items-center gap-2">
                {getStatusIcon(file.status)}
                <span className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                  {getStatusText(file.status)}
                </span>
              </div>

              {/* Upload Progress */}
              {file.status === 'uploading' && file.uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="h-2 w-full border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full bg-lime-400 dark:bg-lime-500 transition-all duration-300"
                      style={{ width: `${file.uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    {file.uploadProgress}%
                  </p>
                </div>
              )}

              {/* Error Message */}
              {file.status === 'failed' && file.errorMessage && (
                <div className="mt-2 p-2 border-2 border-red-500 bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {file.errorMessage}
                  </p>
                </div>
              )}

              {/* Task Info */}
              {file.taskMetadata && (
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
                  {file.taskMetadata.processingDuration && (
                    <p>
                      {locale === 'ja' && `処理時間: ${(file.taskMetadata.processingDuration / 1000).toFixed(1)}秒`}
                      {locale === 'en' && `Processing time: ${(file.taskMetadata.processingDuration / 1000).toFixed(1)}s`}
                      {locale === 'zh' && `处理时间: ${(file.taskMetadata.processingDuration / 1000).toFixed(1)}秒`}
                    </p>
                  )}
                  {file.taskMetadata.outputFileSize && (
                    <p>
                      {locale === 'ja' && `ファイルサイズ: ${(file.taskMetadata.outputFileSize / 1024).toFixed(1)} KB`}
                      {locale === 'en' && `File size: ${(file.taskMetadata.outputFileSize / 1024).toFixed(1)} KB`}
                      {locale === 'zh' && `文件大小: ${(file.taskMetadata.outputFileSize / 1024).toFixed(1)} KB`}
                    </p>
                  )}
                </div>
              )}

              {/* Download Button */}
              {file.status === 'completed' && (
                <div className="mt-3">
                  <Button
                    onClick={() => onDownload(file.id)}
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
