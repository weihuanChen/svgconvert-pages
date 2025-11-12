/**
 * POST /api/upload
 *
 * Proxies file upload to VPS backend (primary) and optionally backs up to R2.
 * This implements a hybrid architecture:
 * 1. Upload to VPS backend (https://svgconvert-server.zeabur.app)
 * 2. Optionally backup to R2 (if Cloudflare bindings available)
 *
 * This is a Next.js API route that can run on Node.js or Edge runtime.
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  UploadResponse,
  ErrorResponse,
  ConversionOptions,
  CloudflareEnv
} from '@/types/cloudflare'
import { generateR2Key, getMimeType } from '@/types/cloudflare'

// Use Node.js runtime for better compatibility with fetch and FormData
export const runtime = 'nodejs'

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

// VPS Backend URL from environment variable
const VPS_BACKEND_URL = process.env.VPS_BACKEND_URL || 'https://svgconvert-server.zeabur.app'
const ENABLE_R2_BACKUP = process.env.ENABLE_R2_BACKUP === 'true'

/**
 * POST handler for file upload - Proxies to VPS backend
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = formData.get('fileName') as string | null
    const optionsStr = formData.get('options') as string | null

    // Validate inputs
    if (!file) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'No file provided'
          }
        },
        { status: 400 }
      )
    }

    if (!fileName || !optionsStr) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing required parameters'
          }
        },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          }
        },
        { status: 413 }
      )
    }

    // Parse conversion options
    let options: ConversionOptions
    try {
      options = JSON.parse(optionsStr)
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_OPTIONS',
            message: 'Invalid conversion options format'
          }
        },
        { status: 400 }
      )
    }

    console.log(`[Upload] Proxying to VPS backend: ${VPS_BACKEND_URL}/api/upload`)

    // Create FormData for VPS backend (matches VPS API format)
    const vpsFormData = new FormData()
    vpsFormData.append('file', file)
    vpsFormData.append('outputFormat', options.targetFormat)

    // Add optional parameters
    if (options.width) vpsFormData.append('width', options.width.toString())
    if (options.height) vpsFormData.append('height', options.height.toString())
    if (options.quality) vpsFormData.append('quality', options.quality.toString())
    if (options.backgroundColor) vpsFormData.append('backgroundColor', options.backgroundColor)
    if (options.maintainAspectRatio !== undefined) {
      vpsFormData.append('maintainAspectRatio', options.maintainAspectRatio.toString())
    }

    // Get language from request headers
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'

    // Forward to VPS backend
    const vpsResponse = await fetch(`${VPS_BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: vpsFormData,
      headers: {
        'Accept-Language': acceptLanguage
      }
    })

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text()
      console.error(`[Upload] VPS backend error (${vpsResponse.status}):`, errorText)

      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText, message: 'VPS backend error' }
      }

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: errorData.error || 'VPS_ERROR',
            message: errorData.message || 'VPS backend returned an error',
            details: process.env.NODE_ENV === 'development' ? errorData : undefined
          }
        },
        { status: vpsResponse.status }
      )
    }

    // Parse VPS response
    const vpsData = await vpsResponse.json()
    const taskId = vpsData.taskId

    // Validate that VPS returned a valid taskId
    if (!taskId) {
      console.error(`[Upload] ❌ VPS did not return taskId. Response:`, vpsData)
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_VPS_RESPONSE',
            message: 'VPS backend did not return a valid task ID',
            details: process.env.NODE_ENV === 'development' ? vpsData : undefined
          }
        },
        { status: 500 }
      )
    }

    console.log(`[Upload] ✅ VPS upload successful. TaskId: ${taskId}`)
    console.log(`[Upload] VPS response data:`, vpsData)

    // Optional: Backup to R2 if enabled and bindings available
    if (ENABLE_R2_BACKUP) {
      const env = (request as any).cloudflare?.env as CloudflareEnv | undefined
      if (env?.SVG_CONVERTER_BUCKET) {
        try {
          const sourceFormat = fileName.split('.').pop()?.toLowerCase() as string
          const sourceFileKey = generateR2Key(taskId, fileName, 'source')
          const fileBuffer = await file.arrayBuffer()

          await env.SVG_CONVERTER_BUCKET.put(sourceFileKey, fileBuffer, {
            httpMetadata: {
              contentType: file.type || getMimeType(sourceFormat as any),
              contentDisposition: `attachment; filename="${fileName}"`
            },
            customMetadata: {
              taskId,
              originalFileName: fileName,
              uploadedAt: new Date().toISOString(),
              backupSource: 'vps'
            }
          })
          console.log(`[Upload] ✅ R2 backup successful: ${sourceFileKey}`)
        } catch (error) {
          console.error(`[Upload] ⚠️  R2 backup failed (non-critical):`, error)
          // Don't fail the request - backup is optional
        }
      }
    }

    // Return VPS response to client
    return NextResponse.json<UploadResponse>(
      {
        success: true,
        taskId,
        message: vpsData.message || 'File uploaded successfully'
      },
      { status: vpsResponse.status }
    )

  } catch (error) {
    console.error('[Upload] Proxy error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to proxy upload to VPS backend',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        }
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
