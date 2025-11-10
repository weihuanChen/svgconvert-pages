/**
 * File Upload Zone Component
 *
 * Drag-and-drop zone for file uploads with visual feedback
 */

'use client'

import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import type { Locale } from '@/app/i18n'

interface FileUploadZoneProps {
  /** Current language */
  locale: Locale

  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void

  /** Accepted file types */
  accept?: string

  /** Maximum file size in bytes */
  maxSize?: number

  /** Allow multiple files */
  multiple?: boolean

  /** Custom translations */
  translations: {
    uploadTitle: string
    uploadSubtitle: string
    dragActive: string
  }

  /** Disable upload */
  disabled?: boolean
}

export function FileUploadZone({
  locale,
  onFilesSelected,
  accept = '.svg,.png,.jpg,.jpeg,.pdf,.eps',
  maxSize = 20 * 1024 * 1024, // 20MB
  multiple = true,
  translations,
  disabled = false
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    const errorMessages = {
      ja: {
        tooLarge: (name: string) => `${name} は大きすぎます（最大${maxSize / 1024 / 1024}MB）`,
        invalidType: (name: string) => `${name} はサポートされていない形式です`
      },
      en: {
        tooLarge: (name: string) => `${name} is too large (max ${maxSize / 1024 / 1024}MB)`,
        invalidType: (name: string) => `${name} has unsupported format`
      },
      zh: {
        tooLarge: (name: string) => `${name} 太大（最大${maxSize / 1024 / 1024}MB）`,
        invalidType: (name: string) => `${name} 格式不支持`
      }
    }

    const messages = errorMessages[locale]
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(messages.tooLarge(file.name))
        return
      }

      // Check file type
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
      if (!acceptedExtensions.includes(ext)) {
        errors.push(messages.invalidType(file.name))
        return
      }

      valid.push(file)
    })

    return { valid, errors }
  }, [accept, maxSize, locale])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setError(null)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }

    if (valid.length > 0) {
      onFilesSelected(valid)
    }
  }, [disabled, validateFiles, onFilesSelected])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }

    if (valid.length > 0) {
      onFilesSelected(valid)
    }

    // Reset input so same file can be selected again
    e.target.value = ''
  }, [validateFiles, onFilesSelected])

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={`
          relative block w-full cursor-pointer
          border-4 border-black dark:border-white
          bg-white dark:bg-neutral-900
          transition-all duration-200
          ${isDragActive ? 'scale-[0.98] border-lime-500 dark:border-lime-400' : 'hover:scale-[0.99]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div
            className={`
              mx-auto mb-6 flex h-24 w-24 items-center justify-center
              border-4 border-black dark:border-white
              bg-lime-300 dark:bg-lime-500
              transition-transform duration-200
              ${isDragActive ? 'scale-110 rotate-12' : ''}
            `}
          >
            <Upload className="h-12 w-12 text-black dark:text-white" />
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-black dark:text-white">
              {isDragActive ? translations.dragActive : translations.uploadTitle}
            </p>
            {!isDragActive && (
              <p className="text-base text-neutral-600 dark:text-neutral-400">
                {translations.uploadSubtitle}
              </p>
            )}
          </div>
        </div>

        <input
          id="file-upload"
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </label>

      {error && (
        <div className="mt-4 border-4 border-red-500 bg-red-50 dark:bg-red-950 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 whitespace-pre-line">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
