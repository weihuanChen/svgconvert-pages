/**
 * API Client for SVG Converter
 *
 * This module provides a centralized API client for all backend communication.
 * It handles request/response formatting, error handling, and retry logic.
 */

import type {
  UploadRequest,
  UploadResponse,
  StatusResponse,
  DownloadResponse,
  CleanupResponse,
  ErrorResponse,
  ConversionOptions
} from '@/types/cloudflare'

// ============================================================================
// Configuration
// ============================================================================

// Use Next.js API routes by default (configured via NEXT_PUBLIC_API_BASE_URL)
// Next.js API routes will proxy to VPS backend with R2 backup
// Fallback to Worker URL only if env variable is not set
const FALLBACK_WORKER_URL = 'https://svg-converter-worker.shendongloving123.workers.dev'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_WORKER_URL

// Upload endpoint (same as API_BASE_URL for consistency)
const UPLOAD_API_URL = API_BASE_URL

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// Types
// ============================================================================

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// ============================================================================
// Core Request Handler
// ============================================================================

/**
 * Enhanced fetch with timeout and retry support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Don't retry on client errors (4xx), only on server errors (5xx) or network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)

    } catch (error) {
      lastError = error as Error

      // Don't retry on abort (user cancelled)
      if ((error as Error).name === 'AbortError' && attempt === 0) {
        throw new APIError('REQUEST_CANCELLED', 'Request was cancelled', 0)
      }
    }

    // Wait before retry (exponential backoff)
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)))
    }
  }

  // All retries failed
  throw new APIError(
    'NETWORK_ERROR',
    lastError?.message || 'Network request failed',
    0,
    lastError
  )
}

/**
 * Parse API response (handles both success and error responses)
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    throw new APIError(
      'INVALID_RESPONSE',
      'Server returned non-JSON response',
      response.status
    )
  }

  const data = await response.json()

  if (!response.ok) {
    const errorData = data as ErrorResponse
    throw new APIError(
      errorData.error?.code || 'UNKNOWN_ERROR',
      errorData.error?.message || 'An unknown error occurred',
      response.status,
      errorData.error?.details
    )
  }

  return data as T
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Upload file and create conversion task
 *
 * @param file - File to upload
 * @param options - Conversion options
 * @param onProgress - Progress callback (0-100)
 * @returns Upload response with task ID
 */
export async function uploadFile(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', file.name)
  formData.append('options', JSON.stringify(options))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResponse
          resolve(data)
        } catch (error) {
          reject(new APIError('PARSE_ERROR', 'Failed to parse response', xhr.status))
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText) as ErrorResponse
          reject(new APIError(
            errorData.error?.code || 'UPLOAD_FAILED',
            errorData.error?.message || 'File upload failed',
            xhr.status,
            errorData.error?.details
          ))
        } catch {
          reject(new APIError('UPLOAD_FAILED', `HTTP ${xhr.status}`, xhr.status))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new APIError('NETWORK_ERROR', 'Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new APIError('REQUEST_CANCELLED', 'Upload was cancelled'))
    })

    // 使用 Worker 上传端点（有完整的 Cloudflare 绑定）
    // Fallback to Pages API if Worker URL not available
    const uploadUrl = `${UPLOAD_API_URL}/upload`
    console.log(`[Upload] Using endpoint: ${uploadUrl}`)
    
    xhr.open('POST', uploadUrl)
    xhr.send(formData)
  })
}

/**
 * Get task status by task ID
 *
 * @param taskId - Task ID
 * @returns Task status and metadata
 */
export async function getTaskStatus(taskId: string): Promise<StatusResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/status/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    retries: 1 // Lower retries for polling requests
  })

  return parseResponse<StatusResponse>(response)
}

/**
 * Get download URL for completed task
 *
 * @param taskId - Task ID
 * @returns Download response with pre-signed URL
 */
export async function getDownloadUrl(taskId: string): Promise<DownloadResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/download/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return parseResponse<DownloadResponse>(response)
}

/**
 * Delete task and associated files
 *
 * @param taskId - Task ID
 * @returns Cleanup response
 */
export async function cleanupTask(taskId: string): Promise<CleanupResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/cleanup/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return parseResponse<CleanupResponse>(response)
}

/**
 * Download file directly (triggers browser download)
 *
 * @param downloadUrl - Pre-signed download URL
 * @param fileName - File name for download
 */
export async function downloadFile(downloadUrl: string, fileName: string): Promise<void> {
  try {
    // Use anchor element to trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    throw new APIError(
      'DOWNLOAD_FAILED',
      'Failed to download file',
      0,
      error
    )
  }
}

// ============================================================================
// Polling Utilities
// ============================================================================

/**
 * Poll task status until completion or failure
 *
 * @param taskId - Task ID to poll
 * @param onUpdate - Callback for status updates
 * @param interval - Polling interval in milliseconds (default: 2000)
 * @returns Promise that resolves when task is complete
 */
export async function pollTaskStatus(
  taskId: string,
  onUpdate: (response: StatusResponse) => void,
  interval: number = 2000
): Promise<StatusResponse> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getTaskStatus(taskId)
        onUpdate(response)

        const status = response.task.status

        // Terminal states
        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
          resolve(response)
        } else {
          // Continue polling
          setTimeout(poll, interval)
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

/**
 * Create a cancellable polling operation
 *
 * @param taskId - Task ID to poll
 * @param onUpdate - Callback for status updates
 * @param interval - Polling interval in milliseconds
 * @returns Object with promise and cancel function
 */
export function createPollableTask(
  taskId: string,
  onUpdate: (response: StatusResponse) => void,
  interval: number = 2000
): { promise: Promise<StatusResponse>; cancel: () => void } {
  let cancelled = false
  let timeoutId: NodeJS.Timeout | null = null

  const promise = new Promise<StatusResponse>((resolve, reject) => {
    const poll = async () => {
      if (cancelled) {
        reject(new APIError('REQUEST_CANCELLED', 'Polling was cancelled'))
        return
      }

      try {
        const response = await getTaskStatus(taskId)
        onUpdate(response)

        const status = response.task.status

        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
          resolve(response)
        } else if (!cancelled) {
          timeoutId = setTimeout(poll, interval)
        }
      } catch (error) {
        if (!cancelled) {
          reject(error)
        }
      }
    }

    poll()
  })

  const cancel = () => {
    cancelled = true
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return { promise, cancel }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Upload multiple files in parallel
 *
 * @param files - Array of files with their options
 * @param onProgress - Progress callback for each file
 * @returns Array of upload responses
 */
export async function uploadMultipleFiles(
  files: Array<{ file: File; options: ConversionOptions }>,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResponse[]> {
  const uploadPromises = files.map(({ file, options }, index) =>
    uploadFile(file, options, (progress) => {
      onProgress?.(index, progress)
    })
  )

  return Promise.all(uploadPromises)
}

/**
 * Poll multiple tasks in parallel
 *
 * @param taskIds - Array of task IDs
 * @param onUpdate - Callback for each task update
 * @param interval - Polling interval
 * @returns Array of final status responses
 */
export async function pollMultipleTasks(
  taskIds: string[],
  onUpdate: (taskId: string, response: StatusResponse) => void,
  interval: number = 2000
): Promise<StatusResponse[]> {
  const pollPromises = taskIds.map((taskId) =>
    pollTaskStatus(taskId, (response) => onUpdate(taskId, response), interval)
  )

  return Promise.all(pollPromises)
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Check if error is an API error
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown, locale: 'ja' | 'en' | 'zh' = 'en'): string {
  if (!isAPIError(error)) {
    return getDefaultErrorMessage(locale)
  }

  const messages: Record<string, Record<string, string>> = {
    NETWORK_ERROR: {
      ja: 'ネットワークエラーが発生しました。接続を確認してください。',
      en: 'Network error occurred. Please check your connection.',
      zh: '网络错误。请检查您的连接。'
    },
    FILE_TOO_LARGE: {
      ja: 'ファイルサイズが大きすぎます。',
      en: 'File size is too large.',
      zh: '文件大小过大。'
    },
    INVALID_FILE_FORMAT: {
      ja: 'サポートされていないファイル形式です。',
      en: 'Unsupported file format.',
      zh: '不支持的文件格式。'
    },
    CONVERSION_FAILED: {
      ja: '変換に失敗しました。',
      en: 'Conversion failed.',
      zh: '转换失败。'
    },
    TASK_NOT_FOUND: {
      ja: 'タスクが見つかりません。',
      en: 'Task not found.',
      zh: '未找到任务。'
    },
    REQUEST_CANCELLED: {
      ja: 'リクエストがキャンセルされました。',
      en: 'Request was cancelled.',
      zh: '请求已取消。'
    }
  }

  return messages[error.code]?.[locale] || error.message || getDefaultErrorMessage(locale)
}

function getDefaultErrorMessage(locale: 'ja' | 'en' | 'zh'): string {
  const defaults = {
    ja: '予期しないエラーが発生しました。',
    en: 'An unexpected error occurred.',
    zh: '发生了意外错误。'
  }
  return defaults[locale]
}

// ============================================================================
// Export Types
// ============================================================================

export type { APIError }
export { APIError as APIErrorClass }
