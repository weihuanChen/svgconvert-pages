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
      const fileBuffer = await vpsResponse.arrayBuffer()
      const contentLength = vpsResponse.headers.get('content-length')

      // Detect file format by analyzing the actual file content
      let targetFormat = 'png' // Default fallback
      let detectedContentType = 'application/octet-stream'

      // 1. Try to detect format from file content (magic bytes)
      const detectedFormat = detectFileFormat(fileBuffer)
      if (detectedFormat) {
        targetFormat = detectedFormat
        console.log(`[Download/File] Detected format from file content: ${targetFormat}`)
      }

      // 2. If not detected, try to get from VPS content-type header
      const vpsContentType = vpsResponse.headers.get('content-type')
      if (vpsContentType && !detectedFormat) {
        if (vpsContentType.includes('jpeg') || vpsContentType.includes('jpg')) {
          targetFormat = 'jpg'
        } else if (vpsContentType.includes('pdf')) {
          targetFormat = 'pdf'
        } else if (vpsContentType.includes('svg')) {
          targetFormat = 'svg'
        } else if (vpsContentType.includes('postscript') || vpsContentType.includes('eps')) {
          targetFormat = 'eps'
        }
      }

      // 3. Get target format from task metadata as final reference
      try {
        const env = (request as any).cloudflare?.env as CloudflareEnv | undefined
        if (env?.SVG_CONVERTER_KV) {
          const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`, { type: 'text' })
          if (taskDataStr) {
            const taskData = JSON.parse(taskDataStr)
            const storedFormat = taskData.targetFormat?.toLowerCase()
            // Only use stored format if we haven't detected it from file
            if (storedFormat && targetFormat === 'png') {
              targetFormat = storedFormat
              console.log(`[Download/File] Got target format from KV: ${targetFormat}`)
            }
          }
        }
      } catch (error) {
        console.warn(`[Download/File] Could not get target format from KV:`, error)
      }

      // Determine the correct content-type based on detected format
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'pdf': 'application/pdf',
        'svg': 'image/svg+xml',
        'eps': 'application/postscript'
      }
      detectedContentType = contentTypeMap[targetFormat] || 'application/octet-stream'

      const contentDisposition = vpsResponse.headers.get('content-disposition') || `attachment; filename="converted_${taskId}.${targetFormat}"`

      console.log(`[Download/File] ✅ VPS file download successful: ${taskId} (${fileBuffer.byteLength} bytes, format: ${targetFormat}, content-type: ${detectedContentType})`)

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': detectedContentType,
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
 * Detect file format from file content (magic bytes)
 */
function detectFileFormat(buffer: ArrayBuffer): string | null {
  const view = new Uint8Array(buffer)

  // PNG: 89 50 4E 47
  if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47) {
    return 'png'
  }

  // JPEG: FF D8 FF
  if (view[0] === 0xFF && view[1] === 0xD8 && view[2] === 0xFF) {
    return 'jpg'
  }

  // PDF: 25 50 44 46 (% P D F)
  if (view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
    return 'pdf'
  }

  // SVG: Check for XML declaration or svg tag
  const text = new TextDecoder().decode(view.slice(0, Math.min(100, view.length)))
  if (text.includes('<?xml') || text.includes('<svg')) {
    return 'svg'
  }

  // EPS: %!PS-Adobe
  if (view[0] === 0x25 && view[1] === 0x21) {
    const text = new TextDecoder().decode(view.slice(0, Math.min(20, view.length)))
    if (text.includes('PS-Adobe')) {
      return 'eps'
    }
  }

  return null
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

