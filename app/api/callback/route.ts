/**
 * POST /api/callback
 *
 * Receives callbacks from VPS after conversion completion.
 * Updates task status in D1/KV.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { CallbackRequest, CallbackResponse, ErrorResponse, TaskMetadata, CloudflareEnv } from '@/types/cloudflare'

/**
 * POST handler for VPS callback
 */
export async function POST(request: NextRequest): Promise<NextResponse<CallbackResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: CallbackRequest = await request.json()

    const { taskId, status, outputFileKey, outputFileSize, errorMessage, processingDuration, token } = body

    // Validate inputs
    if (!taskId || !status || !processingDuration) {
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

    // Validate authentication token
    const expectedToken = process.env.VPS_CALLBACK_SECRET || 'dev-secret'
    if (token !== expectedToken) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token'
          }
        },
        { status: 401 }
      )
    }

    // TODO: In production, access Cloudflare bindings
    // const env = context.cloudflare.env as CloudflareEnv

    // TODO: Retrieve existing task metadata
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

    // Update task metadata
    // const updatedMetadata: TaskMetadata = {
    //   ...taskMetadata,
    //   status,
    //   outputFileKey,
    //   outputFileSize,
    //   errorMessage,
    //   processingDuration,
    //   completedAt: new Date().toISOString()
    // }

    // TODO: Save updated metadata to D1/KV
    // await env.SVG_CONVERTER_KV.put(
    //   `task:${taskId}`,
    //   JSON.stringify(updatedMetadata),
    //   { expirationTtl: 3600 } // Extend TTL to 1 hour
    // )

    // Simulate callback processing for development
    console.log('[SIMULATED] Callback received:', {
      taskId,
      status,
      outputFileKey,
      processingDuration
    })

    // Return success response
    return NextResponse.json<CallbackResponse>(
      {
        success: true,
        message: 'Task status updated successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Callback processing error:', error)

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing callback',
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
