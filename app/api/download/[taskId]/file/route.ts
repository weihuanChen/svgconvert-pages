/**
 * GET /api/download/:taskId/file
 *
 * Proxies file download from VPS backend, with R2 fallback.
 * Downloads the actual converted file.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { TaskStatus, CloudflareEnv } from '@/types/cloudflare'

// Use Node.js runtime for better fetch compatibility
export const runtime = 'nodejs'

// VPS Backend URL from environment variable
const VPS_BACKEND_URL = process.env.VPS_BACKEND_URL || 'https://svgconvert-server.zeabur.app'

/**
 * GET handler for downloading the converted file - Proxies to VPS backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<Response> {
  try {
    const { taskId } = await params

    if (!taskId) {
      return new NextResponse('Task ID is required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    console.log(`[Download/File] Downloading file from VPS: ${taskId}`)

    // Try to download from VPS backend first
    const vpsResponse = await fetch(`${VPS_BACKEND_URL}/api/download/${taskId}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    })

    if (vpsResponse.ok) {
      const contentType = vpsResponse.headers.get('content-type') || 'application/octet-stream'
      const contentDisposition = vpsResponse.headers.get('content-disposition') || `attachment; filename="converted_${taskId}.png"`
      const contentLength = vpsResponse.headers.get('content-length')

      // Stream the file from VPS to client
      const fileBuffer = await vpsResponse.arrayBuffer()

      console.log(`[Download/File] ✅ VPS file download successful: ${taskId} (${fileBuffer.byteLength} bytes)`)

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
          'Content-Length': contentLength || fileBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // If VPS returns 404, try R2 fallback
    if (vpsResponse.status === 404) {
      console.log(`[Download/File] File not found on VPS, trying R2 fallback...`)

      const env = (request as any).cloudflare?.env as CloudflareEnv | undefined
      if (env?.SVG_CONVERTER_KV && env?.SVG_CONVERTER_BUCKET) {
        try {
          // Get task metadata from KV
          const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`, { type: 'text' })

          if (taskDataStr) {
            const taskData = JSON.parse(taskDataStr) as TaskStatus

            if ((taskData.status === 'completed' || taskData.status === 'COMPLETED') && taskData.outputKey) {
              // Retrieve file from R2
              const r2Object = await env.SVG_CONVERTER_BUCKET.get(taskData.outputKey)

              if (r2Object) {
                const fileBuffer = await r2Object.arrayBuffer()
                const contentType = getContentType(taskData.targetFormat)
                const fileName = `${taskData.fileName.replace(/\.[^.]+$/, '')}.${taskData.targetFormat.toLowerCase()}`

                console.log(`[Download/File] ✅ R2 fallback successful: ${taskId} (${fileBuffer.byteLength} bytes)`)

                return new NextResponse(fileBuffer, {
                  status: 200,
                  headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': fileBuffer.byteLength.toString(),
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  }
                })
              }
            }
          }
        } catch (error) {
          console.error(`[Download/File] R2 fallback error:`, error)
        }
      }
    }

    // VPS error or R2 fallback failed
    console.error(`[Download/File] VPS error (${vpsResponse.status})`)

    return new NextResponse(`File not found: ${taskId}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    console.error('[Download/File] Proxy error:', error)

    return new NextResponse(
      `File download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      }
    )
  }
}

/**
 * Get Content-Type header based on file format
 */
function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'pdf': 'application/pdf',
    'svg': 'image/svg+xml',
    'eps': 'application/postscript'
  }

  return contentTypes[format.toLowerCase()] || 'application/octet-stream'
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

