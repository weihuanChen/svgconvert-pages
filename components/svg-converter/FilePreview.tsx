/**
 * File Preview Component
 *
 * Displays thumbnail preview for image files
 */

'use client'

import { useState } from 'react'
import { FileIcon, X } from 'lucide-react'
import Image from 'next/image'

interface FilePreviewProps {
  /** Preview URL (blob URL or data URL) */
  previewUrl?: string

  /** File name */
  fileName: string

  /** File format */
  format: string

  /** Enable full-size preview on click */
  enableModal?: boolean
}

export function FilePreview({
  previewUrl,
  fileName,
  format,
  enableModal = true
}: FilePreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const canShowImage = previewUrl && !imageError && ['svg', 'png', 'jpg', 'jpeg'].includes(format.toLowerCase())

  const handleClick = () => {
    if (enableModal && canShowImage) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`
          relative h-16 w-16 flex-shrink-0
          border-4 border-black dark:border-white
          bg-neutral-100 dark:bg-neutral-800
          ${canShowImage && enableModal ? 'cursor-pointer hover:scale-105' : ''}
          transition-transform duration-200
        `}
        onClick={handleClick}
      >
        {canShowImage ? (
          <div className="relative h-full w-full">
            <Image
              src={previewUrl}
              alt={fileName}
              fill
              className="object-contain p-1"
              onError={() => setImageError(true)}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
          </div>
        )}
      </div>

      {/* Full-size modal */}
      {isModalOpen && canShowImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] border-4 border-white bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -right-12 -top-12 h-10 w-10 border-4 border-white bg-lime-400 hover:bg-lime-500 transition-colors"
            >
              <X className="h-6 w-6 text-black mx-auto" />
            </button>
            <div className="relative max-h-[80vh] max-w-[80vw]">
              <Image
                src={previewUrl}
                alt={fileName}
                width={800}
                height={800}
                className="h-auto w-auto max-h-[80vh] max-w-[80vw] object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
