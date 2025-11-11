/**
 * POST /api/upload
 *
 * Handles file upload, stores in R2, creates task metadata in D1/KV,
 * and pushes task to Cloudflare Queue.
 *
 * This is a Next.js API route that will be deployed to Cloudflare Pages.
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  UploadResponse,
  ErrorResponse,
  ConversionOptions,
  TaskMetadata,
  QueueMessage,
  CloudflareEnv
} from '@/types/cloudflare'
import { generateTaskId, generateR2Key, getMimeType } from '@/types/cloudflare'

// Edge runtime for Cloudflare Pages
export const runtime = 'edge'

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * POST handler for file upload
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

    // Generate task ID and file keys
    const taskId = generateTaskId()
    const sourceFileKey = generateR2Key(taskId, fileName, 'source')
    const sourceFormat = fileName.split('.').pop()?.toLowerCase() as string

    // TODO: In production, access Cloudflare bindings from context
    // const env = context.cloudflare.env as CloudflareEnv
    // For now, we'll simulate the response

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // TODO: Upload to R2
    // await env.SVG_CONVERTER_BUCKET.put(sourceFileKey, fileBuffer, {
    //   httpMetadata: {
    //     contentType: file.type || getMimeType(sourceFormat as any),
    //     contentDisposition: `attachment; filename="${fileName}"`
    //   },
    //   customMetadata: {
    //     taskId,
    //     originalFileName: fileName
    //   }
    // })

    // Create task metadata
    const taskMetadata: TaskMetadata = {
      taskId,
      originalFileName: fileName,
      sourceFormat: sourceFormat as any,
      targetFormat: options.targetFormat,
      sourceFileKey,
      status: 'PENDING',
      options,
      createdAt: new Date().toISOString(),
      sourceFileSize: file.size
    }

    // TODO: Store task metadata in D1/KV
    // await env.SVG_CONVERTER_KV.put(
    //   `task:${taskId}`,
    //   JSON.stringify(taskMetadata),
    //   { expirationTtl: 3600 } // 1 hour TTL
    // )

    // Create queue message
    const queueMessage: QueueMessage = {
      taskId,
      bucketName: 'svg-converter', // TODO: Get from env
      sourceFileKey,
      fileName,
      sourceFormat: sourceFormat as any,
      options,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/callback`,
      callbackToken: process.env.VPS_CALLBACK_SECRET || 'dev-secret'
    }

    // TODO: Push to Cloudflare Queue
    // await env.SVG_CONVERTER_QUEUE.send(queueMessage)

    // Simulate task creation for development
    console.log('[SIMULATED] Task created:', {
      taskId,
      fileName,
      sourceFormat,
      targetFormat: options.targetFormat
    })

    // Return success response
    return NextResponse.json<UploadResponse>(
      {
        success: true,
        taskId,
        message: 'File uploaded successfully and task created'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during upload',
          details: process.env.NODE_ENV === 'development' ? error : undefined
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
