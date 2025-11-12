/**
 * GET /api/status/:taskId
 *
 * Proxies task status check to VPS backend, with R2/KV fallback.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { StatusResponse, ErrorResponse, CloudflareEnv, TaskStatus } from '@/types/cloudflare'

// Use Node.js runtime for better compatibility
export const runtime = 'nodejs'

// VPS Backend URL from environment variable
const VPS_BACKEND_URL = process.env.VPS_BACKEND_URL || 'https://svgconvert-server.zeabur.app'

/**
 * GET handler for task status - Proxies to VPS backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse<StatusResponse | ErrorResponse>> {
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

    console.log(`[Status] Checking task status from VPS: ${taskId}`)

    // Get language from request headers
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'

    // Query VPS backend for task status
    const vpsResponse = await fetch(`${VPS_BACKEND_URL}/api/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Accept-Language': acceptLanguage,
        'Content-Type': 'application/json'
      }
    })

    if (vpsResponse.ok) {
      const vpsData = await vpsResponse.json()

      // VPS 返回扁平结构: { taskId, status, message, fileName, ... }
      // 需要转换为 StatusResponse 格式: { success: true, task: {...} }
      const taskStatus = (vpsData.status || 'PROCESSING') as TaskStatus

      console.log(`[Status] ✅ VPS status check successful: ${taskId} - ${taskStatus}`)
      console.log(`[Status] VPS raw data:`, vpsData)

      // 转换为前端期望的嵌套结构
      const statusResponse: StatusResponse = {
        success: true,
        task: {
          taskId: vpsData.taskId || taskId,
          status: taskStatus,
          originalFileName: vpsData.fileName || vpsData.originalFileName || 'unknown.svg',
          sourceFormat: (vpsData.sourceFormat || 'svg') as any,
          targetFormat: (vpsData.targetFormat || vpsData.outputFormat || 'png') as any,
          sourceFileKey: vpsData.sourceFileKey || vpsData.sourceKey || `source/${taskId}`,
          createdAt: vpsData.createdAt || vpsData.uploadedAt || new Date().toISOString(),
          sourceFileSize: vpsData.sourceFileSize || vpsData.fileSize || 0,
          options: vpsData.options || { targetFormat: vpsData.targetFormat || 'png' },
          // Optional fields
          outputFileKey: vpsData.outputFileKey || vpsData.outputKey,
          outputFileSize: vpsData.outputFileSize,
          errorMessage: vpsData.error || vpsData.errorMessage,
          completedAt: taskStatus === 'COMPLETED' ? (vpsData.completedAt || new Date().toISOString()) : undefined,
          processingStartedAt: vpsData.processingStartedAt,
          conversionTime: vpsData.conversionTime
        }
      }

      return NextResponse.json(statusResponse, { status: vpsResponse.status })
    }

    // If VPS returns 404, try R2/KV fallback
    if (vpsResponse.status === 404) {
      console.log(`[Status] Task not found on VPS, trying R2/KV fallback...`)

      const env = (request as any).cloudflare?.env as CloudflareEnv | undefined
      if (env?.SVG_CONVERTER_KV) {
        try {
          const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`, { type: 'text' })
          if (taskDataStr) {
            const taskMetadata = JSON.parse(taskDataStr)
            console.log(`[Status] ✅ Found task in KV fallback: ${taskId}`)
            return NextResponse.json<StatusResponse>(
              {
                success: true,
                task: taskMetadata
              },
              { status: 200 }
            )
          }
        } catch (error) {
          console.error(`[Status] KV fallback error:`, error)
        }
      }
    }

    // VPS error (not 404) or fallback failed
    const errorText = await vpsResponse.text()
    console.error(`[Status] VPS backend error (${vpsResponse.status}):`, errorText)

    let errorData: any
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { error: 'task_not_found', message: 'Task not found' }
    }

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: errorData.error || 'TASK_NOT_FOUND',
          message: errorData.message || 'Task not found',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        }
      },
      { status: vpsResponse.status }
    )

  } catch (error) {
    console.error('[Status] Proxy error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to check task status',
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
