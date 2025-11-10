/**
 * GET /api/status/:taskId
 *
 * Retrieves the current status and metadata of a conversion task.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { StatusResponse, ErrorResponse, TaskMetadata, CloudflareEnv } from '@/types/cloudflare'

/**
 * GET handler for task status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
): Promise<NextResponse<StatusResponse | ErrorResponse>> {
  try {
    const { taskId } = params

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

    // TODO: In production, access Cloudflare bindings
    // const env = context.cloudflare.env as CloudflareEnv

    // TODO: Retrieve task metadata from D1/KV
    // const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`, { type: 'text' })
    //
    // if (!taskDataStr) {
    //   return NextResponse.json<ErrorResponse>(
    //     {
    //       success: false,
    //       error: {
    //         code: 'TASK_NOT_FOUND',
    //         message: `Task with ID ${taskId} not found`
    //       }
    //     },
    //     { status: 404 }
    //   )
    // }
    //
    // const taskMetadata: TaskMetadata = JSON.parse(taskDataStr)

    // Simulate task metadata for development
    const taskMetadata: TaskMetadata = {
      taskId,
      originalFileName: 'example.svg',
      sourceFormat: 'svg',
      targetFormat: 'png',
      sourceFileKey: `source/2025-01-01/${taskId}/example.svg`,
      status: 'PENDING',
      options: {
        targetFormat: 'png'
      },
      createdAt: new Date().toISOString(),
      sourceFileSize: 1024
    }

    console.log('[SIMULATED] Task status retrieved:', taskId)

    // Return success response
    return NextResponse.json<StatusResponse>(
      {
        success: true,
        task: taskMetadata
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Status check error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking task status',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
