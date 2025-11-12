/**
 * GET /api/download/:taskId
 *
 * Proxies download URL generation to VPS backend, with R2 fallback.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { DownloadResponse, ErrorResponse, CloudflareEnv } from '@/types/cloudflare'

// Use Node.js runtime for better compatibility
export const runtime = 'nodejs'

// VPS Backend URL from environment variable
const VPS_BACKEND_URL = process.env.VPS_BACKEND_URL || 'https://svgconvert-server.zeabur.app'

// Pre-signed URL expiration time (15 minutes)
const URL_EXPIRATION_SECONDS = 15 * 60

/**
 * GET handler for download URL generation - Proxies to VPS backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse<DownloadResponse | ErrorResponse>> {
  try {
    const { taskId } = await params

    if (!taskId) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'MISSING_TASK_ID',
            message: 'Task ID is required'
          }
        },
        { status: 400 }
      )
    }

    // VPS /api/download/:taskId 直接返回文件内容，不是 JSON
    // 所以我们不需要先查询 VPS，直接返回我们的代理端点 URL
    console.log(`[Download] Generating download URL for task: ${taskId}`)

    // 检查任务状态以确认文件已完成
    const statusResponse = await fetch(`${VPS_BACKEND_URL}/api/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Accept-Language': request.headers.get('Accept-Language') || 'en'
      }
    })

    if (!statusResponse.ok) {
      // 如果状态查询失败，尝试 R2/KV fallback
      const env = (request as any).cloudflare?.env as CloudflareEnv | undefined
      if (env?.SVG_CONVERTER_KV) {
        try {
          const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`, { type: 'text' })
          if (taskDataStr) {
            const taskMetadata = JSON.parse(taskDataStr)

            if (taskMetadata.status === 'COMPLETED' && taskMetadata.outputFileKey) {
              console.log(`[Download] ✅ Found task in KV fallback: ${taskId}`)
              const fileName = taskMetadata.originalFileName.replace(/\.[^.]+$/, `.${taskMetadata.targetFormat.toLowerCase()}`)
              const downloadUrl = `/api/download/${taskId}/file`
              const expiresAt = new Date(Date.now() + URL_EXPIRATION_SECONDS * 1000).toISOString()

              return NextResponse.json<DownloadResponse>(
                {
                  success: true,
                  downloadUrl,
                  fileName,
                  fileSize: taskMetadata.outputFileSize || 0,
                  expiresAt
                },
                { status: 200 }
              )
            }
          }
        } catch (error) {
          console.error(`[Download] KV fallback error:`, error)
        }
      }

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found or not completed'
          }
        },
        { status: 404 }
      )
    }

    // 解析状态响应
    const statusData = await statusResponse.json()
    const taskStatus = statusData.status || 'UNKNOWN'
    const fileName = statusData.fileName || statusData.originalFileName || `converted_${taskId}.png`

    console.log(`[Download] ✅ Task status: ${taskStatus}, generating download URL`)

    // 检查任务是否已完成
    if (taskStatus !== 'COMPLETED') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'TASK_NOT_COMPLETED',
            message: `Task is not completed. Current status: ${taskStatus}`
          }
        },
        { status: 400 }
      )
    }

    // 返回下载 URL（指向我们的 /file 代理端点）
    const downloadUrl = `/api/download/${taskId}/file`
    const expiresAt = new Date(Date.now() + URL_EXPIRATION_SECONDS * 1000).toISOString()

    return NextResponse.json<DownloadResponse>(
      {
        success: true,
        downloadUrl,
        fileName,
        fileSize: 0,  // 文件大小在实际下载时获取
        expiresAt
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[Download] Proxy error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to generate download URL',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
