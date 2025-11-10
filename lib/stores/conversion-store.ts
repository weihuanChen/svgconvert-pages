/**
 * Conversion State Management Store
 *
 * This store manages the entire conversion workflow state using Zustand.
 * It handles file uploads, task tracking, progress polling, and downloads.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TaskMetadata, TaskStatus, ConversionOptions, FileFormat } from '@/types/cloudflare'

// ============================================================================
// Types
// ============================================================================

/**
 * File item in the upload queue
 */
export interface FileItem {
  /** Unique identifier for this file */
  id: string

  /** Original File object */
  file: File

  /** File name */
  fileName: string

  /** Source file format */
  sourceFormat: FileFormat

  /** Target conversion format */
  targetFormat: FileFormat

  /** Conversion options */
  options: ConversionOptions

  /** Task ID (set after upload) */
  taskId?: string

  /** Current status */
  status: 'idle' | 'uploading' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  /** Upload progress (0-100) */
  uploadProgress: number

  /** Error message (if failed) */
  errorMessage?: string

  /** Task metadata (fetched from API) */
  taskMetadata?: TaskMetadata

  /** Preview URL (for displaying thumbnails) */
  previewUrl?: string

  /** Download URL (set after completion) */
  downloadUrl?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

/**
 * Global conversion settings
 */
export interface ConversionSettings {
  /** Default target format */
  defaultTargetFormat: FileFormat

  /** Default quality for JPEG (1-100) */
  defaultQuality: number

  /** Enable transparent background for PNG */
  enableTransparency: boolean

  /** Enable batch processing mode */
  batchMode: boolean

  /** Auto-start conversion after upload */
  autoConvert: boolean

  /** Polling interval in milliseconds */
  pollingInterval: number
}

/**
 * Store state interface
 */
interface ConversionState {
  // ========== Files & Tasks ==========
  /** Array of file items */
  files: FileItem[]

  /** Active polling task IDs */
  pollingTasks: Set<string>

  // ========== Settings ==========
  /** Global conversion settings */
  settings: ConversionSettings

  // ========== Actions ==========
  /** Add files to the queue */
  addFiles: (files: File[], options?: Partial<ConversionOptions>) => void

  /** Remove a file from the queue */
  removeFile: (fileId: string) => void

  /** Update file status */
  updateFileStatus: (fileId: string, status: FileItem['status'], metadata?: Partial<FileItem>) => void

  /** Update file upload progress */
  updateUploadProgress: (fileId: string, progress: number) => void

  /** Set task ID for a file */
  setTaskId: (fileId: string, taskId: string) => void

  /** Update task metadata */
  updateTaskMetadata: (taskId: string, metadata: TaskMetadata) => void

  /** Set download URL for a file */
  setDownloadUrl: (fileId: string, downloadUrl: string) => void

  /** Set error message for a file */
  setError: (fileId: string, errorMessage: string) => void

  /** Start polling for a task */
  startPolling: (taskId: string) => void

  /** Stop polling for a task */
  stopPolling: (taskId: string) => void

  /** Clear all completed tasks */
  clearCompleted: () => void

  /** Clear all tasks */
  clearAll: () => void

  /** Update global settings */
  updateSettings: (settings: Partial<ConversionSettings>) => void

  /** Reset store to initial state */
  reset: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const initialSettings: ConversionSettings = {
  defaultTargetFormat: 'png',
  defaultQuality: 85,
  enableTransparency: true,
  batchMode: false,
  autoConvert: true,
  pollingInterval: 2000 // 2 seconds
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useConversionStore = create<ConversionState>()(
  persist(
    (set, get) => ({
      // ========== Initial State ==========
      files: [],
      pollingTasks: new Set(),
      settings: initialSettings,

      // ========== Actions ==========

      addFiles: (files: File[], options?: Partial<ConversionOptions>) => {
        const newFiles: FileItem[] = files.map((file) => {
          const sourceFormat = getFileFormat(file.name)
          const targetFormat = options?.targetFormat || get().settings.defaultTargetFormat
          const previewUrl = canPreview(file) ? URL.createObjectURL(file) : undefined

          return {
            id: generateFileId(),
            file,
            fileName: file.name,
            sourceFormat,
            targetFormat,
            options: {
              targetFormat,
              ...options
            } as ConversionOptions,
            status: 'idle',
            uploadProgress: 0,
            previewUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })

        set((state) => ({
          files: [...state.files, ...newFiles]
        }))
      },

      removeFile: (fileId: string) => {
        const file = get().files.find((f) => f.id === fileId)

        // Revoke preview URL to free memory
        if (file?.previewUrl) {
          URL.revokeObjectURL(file.previewUrl)
        }

        // Stop polling if active
        if (file?.taskId) {
          get().stopPolling(file.taskId)
        }

        set((state) => ({
          files: state.files.filter((f) => f.id !== fileId)
        }))
      },

      updateFileStatus: (fileId: string, status: FileItem['status'], metadata?: Partial<FileItem>) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status,
                  ...metadata,
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      updateUploadProgress: (fileId: string, progress: number) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  uploadProgress: Math.min(100, Math.max(0, progress)),
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      setTaskId: (fileId: string, taskId: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  taskId,
                  status: 'pending',
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      updateTaskMetadata: (taskId: string, metadata: TaskMetadata) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.taskId === taskId
              ? {
                  ...f,
                  taskMetadata: metadata,
                  status: mapTaskStatusToFileStatus(metadata.status),
                  errorMessage: metadata.errorMessage,
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))

        // Stop polling if task is in terminal state
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(metadata.status)) {
          get().stopPolling(taskId)
        }
      },

      setDownloadUrl: (fileId: string, downloadUrl: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  downloadUrl,
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      setError: (fileId: string, errorMessage: string) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'failed',
                  errorMessage,
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      startPolling: (taskId: string) => {
        set((state) => ({
          pollingTasks: new Set([...state.pollingTasks, taskId])
        }))
      },

      stopPolling: (taskId: string) => {
        set((state) => {
          const newPollingTasks = new Set(state.pollingTasks)
          newPollingTasks.delete(taskId)
          return { pollingTasks: newPollingTasks }
        })
      },

      clearCompleted: () => {
        const completedFiles = get().files.filter((f) => f.status === 'completed' || f.status === 'failed')

        // Revoke preview URLs
        completedFiles.forEach((file) => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl)
          }
        })

        set((state) => ({
          files: state.files.filter((f) => f.status !== 'completed' && f.status !== 'failed')
        }))
      },

      clearAll: () => {
        // Revoke all preview URLs
        get().files.forEach((file) => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl)
          }
        })

        // Stop all polling
        get().pollingTasks.forEach((taskId) => {
          get().stopPolling(taskId)
        })

        set({
          files: [],
          pollingTasks: new Set()
        })
      },

      updateSettings: (settings: Partial<ConversionSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings
          }
        }))
      },

      reset: () => {
        get().clearAll()
        set({
          files: [],
          pollingTasks: new Set(),
          settings: initialSettings
        })
      }
    }),
    {
      name: 'svg-converter-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist File objects, preview URLs, or polling state
      partialize: (state) => ({
        settings: state.settings,
        files: state.files.map((f) => ({
          ...f,
          file: undefined, // Don't persist File objects
          previewUrl: undefined // Don't persist blob URLs
        }))
      })
    }
  )
)

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique file ID
 */
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract file format from file name
 */
function getFileFormat(fileName: string): FileFormat {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'svg') return 'svg'
  if (ext === 'png') return 'png'
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'eps') return 'eps'
  return 'png' // Default fallback
}

/**
 * Check if file can be previewed
 */
function canPreview(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Map TaskStatus to FileItem status
 */
function mapTaskStatusToFileStatus(taskStatus: TaskStatus): FileItem['status'] {
  switch (taskStatus) {
    case 'PENDING':
      return 'pending'
    case 'PROCESSING':
      return 'processing'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'idle'
  }
}

// ============================================================================
// Selectors (for optimized component access)
// ============================================================================

/**
 * Select files by status
 */
export const selectFilesByStatus = (status: FileItem['status']) => (state: ConversionState) =>
  state.files.filter((f) => f.status === status)

/**
 * Select file by ID
 */
export const selectFileById = (fileId: string) => (state: ConversionState) =>
  state.files.find((f) => f.id === fileId)

/**
 * Select file by task ID
 */
export const selectFileByTaskId = (taskId: string) => (state: ConversionState) =>
  state.files.find((f) => f.taskId === taskId)

/**
 * Check if any files are being processed
 */
export const selectIsProcessing = (state: ConversionState) =>
  state.files.some((f) => ['uploading', 'pending', 'processing'].includes(f.status))

/**
 * Get total file count
 */
export const selectTotalFiles = (state: ConversionState) => state.files.length

/**
 * Get completed file count
 */
export const selectCompletedCount = (state: ConversionState) =>
  state.files.filter((f) => f.status === 'completed').length

/**
 * Get failed file count
 */
export const selectFailedCount = (state: ConversionState) =>
  state.files.filter((f) => f.status === 'failed').length
