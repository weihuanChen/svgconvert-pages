/**
 * Conversion Progress Component
 *
 * Shows overall conversion progress and statistics
 */

'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { Locale } from '@/app/i18n'

interface ConversionProgressProps {
  /** Total number of files */
  total: number

  /** Number of completed files */
  completed: number

  /** Number of failed files */
  failed: number

  /** Number of processing files */
  processing: number

  /** Current language */
  locale: Locale

  /** Show detailed statistics */
  showDetails?: boolean
}

export function ConversionProgress({
  total,
  completed,
  failed,
  processing,
  locale,
  showDetails = true
}: ConversionProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setIsProcessing(processing > 0)
  }, [processing])

  useEffect(() => {
    if (!isProcessing) {
      setElapsedTime(0)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isProcessing])

  if (total === 0) {
    return null
  }

  const pending = total - completed - failed - processing
  const progress = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="border-4 border-black dark:border-white bg-lime-100 dark:bg-lime-950 p-6">
      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold text-black dark:text-white">
              {locale === 'ja' && '変換進行状況'}
              {locale === 'en' && 'Conversion Progress'}
              {locale === 'zh' && '转换进度'}
            </h3>
            <span className="text-2xl font-bold text-black dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="h-4 w-full border-4 border-black dark:border-white bg-white dark:bg-neutral-900">
            <div
              className="h-full bg-lime-400 dark:bg-lime-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        {showDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Pending */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {locale === 'ja' && '待機中'}
                  {locale === 'en' && 'Pending'}
                  {locale === 'zh' && '等待中'}
                </span>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{pending}</p>
            </div>

            {/* Processing */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {locale === 'ja' && '処理中'}
                  {locale === 'en' && 'Processing'}
                  {locale === 'zh' && '处理中'}
                </span>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{processing}</p>
            </div>

            {/* Completed */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {locale === 'ja' && '完了'}
                  {locale === 'en' && 'Completed'}
                  {locale === 'zh' && '已完成'}
                </span>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{completed}</p>
            </div>

            {/* Failed */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {locale === 'ja' && '失敗'}
                  {locale === 'en' && 'Failed'}
                  {locale === 'zh' && '失败'}
                </span>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white">{failed}</p>
            </div>
          </div>
        )}

        {/* Elapsed Time */}
        {isProcessing && (
          <div className="border-t-4 border-black dark:border-white pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black dark:text-white">
                {locale === 'ja' && '経過時間'}
                {locale === 'en' && 'Elapsed Time'}
                {locale === 'zh' && '已用时间'}
              </span>
              <span className="text-xl font-bold font-mono text-black dark:text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
