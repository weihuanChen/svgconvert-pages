/**
 * SVG 转换工具 - Cloudflare Worker
 *
 * 职责：
 * 1. Queue Consumer: 处理 SVG 转换任务，调用 VPS 进行文件转换
 * 2. Cron Trigger: 定时清理过期文件（每小时运行）
 * 3. 直接访问 Cloudflare 资源（R2、KV）
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Import types from shared types file
type FileFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'pdf' | 'eps'

/**
 * Generate R2 file key with date-based path for organization
 */
function generateR2Key(taskId: string, fileName: string, type: 'source' | 'output'): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${type}/${timestamp}/${taskId}/${sanitizedFileName}`
}

interface ConversionOptions {
  targetFormat: FileFormat
  quality?: number
  transparency?: boolean
  width?: number
  height?: number
  backgroundColor?: string
  optimize?: boolean
  [key: string]: any
}

interface QueueMessage {
  taskId: string
  bucketName: string
  sourceFileKey: string
  fileName: string
  sourceFormat: FileFormat
  options: ConversionOptions
  callbackUrl: string
  callbackToken: string
}

// Cloudflare Worker types
interface R2Bucket {
  get(key: string): Promise<R2Object | null>
  put(key: string, value: ArrayBuffer, options?: any): Promise<R2Object>
  delete(key: string): Promise<void>
  list(options?: any): Promise<any>
}

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: any): Promise<void>
  delete(key: string): Promise<void>
}

interface Queue {
  send(message: any, options?: any): Promise<void>
}

interface R2Object {
  arrayBuffer(): Promise<ArrayBuffer>
}

interface MessageBatch<T> {
  messages: Array<{
    body: T
    ack(): void
    retry(): void
  }>
}

interface ScheduledEvent {
  cron: string
}

interface ExportedHandler<T> {
  fetch?: (request: Request, env: T) => Promise<Response>
  queue?: (batch: MessageBatch<any>, env: T) => Promise<void>
  scheduled?: (event: ScheduledEvent, env: T) => Promise<void>
}

interface Env {
  SVG_CONVERTER_BUCKET: R2Bucket
  SVG_CONVERTER_KV: KVNamespace
  SVG_CONVERTER_QUEUE: Queue
  VPS_CALLBACK_SECRET: string
  VPS_CONVERSION_URL: string
  R2_PUBLIC_URL: string
  MAX_FILE_SIZE: string
  FILE_RETENTION_MINUTES: string
  ENVIRONMENT: string
}

interface TaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileName: string
  sourceFormat: string
  targetFormat: string
  outputKey?: string
  error?: string
  createdAt: number
  completedAt?: number
}

/**
 * 更新任务状态到 KV
 */
async function updateTaskStatus(
  env: Env,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  await env.SVG_CONVERTER_KV.put(
    `task:${taskId}`,
    JSON.stringify(status),
    { expirationTtl: 3600 } // 1 小时后过期
  )
}

/**
 * Queue Consumer - 处理转换任务
 */
async function handleQueueMessage(
  message: QueueMessage,
  env: Env
): Promise<void> {
  const taskId = message.taskId
  const createdAt = Date.now()
  const targetFormat = message.options.targetFormat

  try {
    console.log(`[Queue] 处理任务: ${taskId}`)

    // 1. 更新任务状态为 processing
    await updateTaskStatus(env, taskId, {
      taskId,
      status: 'processing',
      fileName: message.fileName,
      sourceFormat: message.sourceFormat,
      targetFormat: targetFormat,
      createdAt
    })

    // 2. 从 R2 获取源文件 - Use sourceFileKey instead of r2Key
    const sourceFile = await env.SVG_CONVERTER_BUCKET.get(message.sourceFileKey)
    if (!sourceFile) {
      throw new Error(`Source file not found: ${message.sourceFileKey}`)
    }

    const fileBuffer = await sourceFile.arrayBuffer()
    console.log(
      `[Queue] 已获取源文件: ${message.sourceFileKey}, 大小: ${fileBuffer.byteLength} bytes`
    )

    // 3. 调用 VPS 进行文件转换
    const convertedBuffer = await callVpsConversion(
      fileBuffer,
      message.sourceFormat,
      targetFormat,
      message.options,
      env.VPS_CONVERSION_URL,
      env.VPS_CALLBACK_SECRET
    )

    // 4. 保存转换结果到 R2
    const baseFileName = message.fileName
      .replace(/\.[^/.]+$/, '') // 移除原始扩展名

    const outputFileName = `${baseFileName}.${targetFormat.toLowerCase()}`
    const outputKey = generateR2Key(taskId, outputFileName, 'output')

    await env.SVG_CONVERTER_BUCKET.put(outputKey, convertedBuffer, {
      customMetadata: {
        taskId,
        originalFormat: message.sourceFormat,
        targetFormat: targetFormat,
        uploadedAt: new Date().toISOString()
      }
    })

    console.log(
      `[Queue] 已保存转换结果: ${outputKey}, 大小: ${convertedBuffer.byteLength} bytes`
    )

    // 5. 更新任务状态为 completed
    await updateTaskStatus(env, taskId, {
      taskId,
      status: 'completed',
      fileName: message.fileName,
      sourceFormat: message.sourceFormat,
      targetFormat: targetFormat,
      outputKey,
      createdAt,
      completedAt: Date.now()
    })

    console.log(`[Queue] ✅ 任务完成: ${taskId}`)
  } catch (error) {
    const errorMsg = String(error)
    console.error(`[Queue] ❌ 任务失败: ${taskId}`, error)

    // 更新任务状态为 failed
    await updateTaskStatus(env, taskId, {
      taskId,
      status: 'failed',
      fileName: message.fileName,
      sourceFormat: message.sourceFormat,
      targetFormat: targetFormat,
      error: errorMsg,
      createdAt,
      completedAt: Date.now()
    })

    throw error
  }
}

/**
 * 调用 VPS 进行文件转换，支持超时控制和重试
 */
async function callVpsConversion(
  fileBuffer: ArrayBuffer,
  sourceFormat: string,
  targetFormat: string,
  options: Record<string, any>,
  vpsUrl: string,
  secret: string
): Promise<ArrayBuffer> {
  const TIMEOUT_MS = 120000 // 120 秒超时

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const formData = new FormData()
    formData.append(
      'file',
      new Blob([fileBuffer]),
      `file.${sourceFormat}`
    )
    formData.append('sourceFormat', sourceFormat)
    formData.append('targetFormat', targetFormat)

    // 添加转换选项
    if (options.quality) formData.append('quality', String(options.quality))
    if (options.transparency !== undefined)
      formData.append('transparency', String(options.transparency))

    formData.append('timestamp', String(Date.now()))

    console.log(`[VPS] 发送转换请求: ${sourceFormat} → ${targetFormat}`)

    const response = await fetch(vpsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'X-Request-ID':
          (crypto as any).randomUUID?.() || Math.random().toString(36)
      },
      body: formData,
      signal: controller.signal
    })

    if (!response.ok) {
      const statusCode = response.status
      const statusText = response.statusText

      // 区分可重试和不可重试的错误
      if (statusCode >= 500) {
        throw new Error(
          `VPS Server Error ${statusCode}: ${statusText} (retryable)`
        )
      } else if (statusCode === 400 || statusCode === 422) {
        throw new Error(
          `VPS Bad Request ${statusCode}: ${statusText} (not retryable)`
        )
      } else {
        throw new Error(`VPS Error ${statusCode}: ${statusText}`)
      }
    }

    const result = await response.arrayBuffer()
    console.log(`[VPS] ✅ 转换成功, 输出大小: ${result.byteLength} bytes`)
    return result
  } catch (error) {
    if (error instanceof TypeError && (error as any).name === 'AbortError') {
      throw new Error(`VPS Conversion Timeout after ${TIMEOUT_MS}ms (retryable)`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Cron Trigger - 定时清理过期文件（每小时运行）
 */
async function handleCleanup(env: Env): Promise<void> {
  try {
    const retentionMinutes = parseInt(env.FILE_RETENTION_MINUTES || '30')
    const cutoffTime = Date.now() - retentionMinutes * 60 * 1000

    console.log(`[Cron] 开始清理 ${retentionMinutes} 分钟前的过期文件`)

    let cursor: string | undefined
    let deletedCount = 0
    let skippedCount = 0

    do {
      const listResult = await env.SVG_CONVERTER_BUCKET.list({
        cursor,
        limit: 1000
      })

      for (const object of listResult.objects) {
        try {
          const uploadedAt = (object.customMetadata?.uploadedAt as
            | string
            | undefined) || ''

          if (!uploadedAt) {
            skippedCount++
            continue
          }

          const uploadTime = new Date(uploadedAt).getTime()

          if (uploadTime < cutoffTime) {
            await env.SVG_CONVERTER_BUCKET.delete(object.key)
            deletedCount++
            console.log(`[Cron] 已删除: ${object.key}`)
          }
        } catch (error) {
          console.error(`[Cron] 删除文件失败: ${object.key}`, error)
        }
      }

      cursor = listResult.cursor
    } while (cursor)

    console.log(
      `[Cron] ✅ 清理完成: 删除 ${deletedCount} 个文件, 跳过 ${skippedCount} 个文件`
    )
  } catch (error) {
    console.error('[Cron] ❌ 清理失败', error)
    throw error
  }
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(error: unknown): boolean {
  const errorMsg = String(error)

  // 可重试的错误模式
  const retryablePatterns = [
    'timeout',
    '500',
    '502',
    '503',
    '504',
    'retryable',
    'ECONNREFUSED',
    'ENOTFOUND',
    'network'
  ]

  return retryablePatterns.some(pattern =>
    errorMsg.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * 主 Worker 处理函数
 */
export default {
  /**
   * Queue Consumer：处理 SVG 转换任务队列
   */
  async queue(batch: MessageBatch<QueueMessage>, env: Env) {
    console.log(`[Queue] 收到 ${batch.messages.length} 个任务`)

    for (const message of batch.messages) {
      try {
        await handleQueueMessage(message.body, env)
        message.ack() // 确认消息已处理
        console.log(`[Queue] ✅ 消息已确认: ${message.body.taskId}`)
      } catch (error) {
        const taskId = message.body.taskId
        const isRetryable = isRetryableError(error)

        if (isRetryable) {
          console.warn(
            `[Queue] ⚠️  可重试的错误，将重新入队: ${taskId}`,
            error
          )
          message.retry()
        } else {
          console.error(
            `[Queue] ❌ 不可重试的错误，将消息发送到死信队列: ${taskId}`,
            error
          )
          message.ack() // 确认消息，防止无限重试
        }
      }
    }
  },

  /**
   * Cron Trigger：定时清理过期文件（每小时运行）
   */
  async scheduled(event: ScheduledEvent, env: Env) {
    const cron = (event as any).cron || 'unknown'
    console.log(`[Cron] ⏰ 触发定时任务: ${cron}`)

    try {
      await handleCleanup(env)
    } catch (error) {
      console.error(`[Cron] ❌ 清理任务失败`, error)
      // 不抛出错误，防止影响下一次执行
    }
  },

  /**
   * HTTP 请求处理
   *
   * 处理文件上传、下载、健康检查等端点
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS 预检请求处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    // CORS 头辅助函数
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 文件上传端点 - 从 Worker 直接上传（有完整的 Cloudflare 绑定）
    if (request.method === 'POST' && url.pathname === '/upload') {
      try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const fileName = formData.get('fileName') as string | null
        const optionsStr = formData.get('options') as string | null

        if (!file || !fileName || !optionsStr) {
          return new Response(
            JSON.stringify({ success: false, error: { code: 'MISSING_PARAMS', message: 'Missing required fields' } }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        const taskId = (crypto as any).randomUUID?.() || Math.random().toString(36).substr(2, 9)
        const sourceFileKey = generateR2Key(taskId, fileName, 'source')
        const fileBuffer = await file.arrayBuffer()
        const options = JSON.parse(optionsStr)

        // 上传源文件到 R2
        await env.SVG_CONVERTER_BUCKET.put(sourceFileKey, fileBuffer, {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
            contentDisposition: `attachment; filename="${fileName}"`
          },
          customMetadata: {
            taskId,
            originalFileName: fileName,
            uploadedAt: new Date().toISOString()
          }
        })

        console.log(`[Worker Upload] ✅ File uploaded to R2: ${sourceFileKey}`)

        // 存储任务元数据到 KV
        const taskMetadata = {
          taskId,
          fileName,
          sourceFormat: fileName.split('.').pop()?.toLowerCase(),
          targetFormat: options.targetFormat,
          sourceFileKey,
          status: 'pending',
          createdAt: new Date().toISOString(),
          fileSize: file.size
        }

        await env.SVG_CONVERTER_KV.put(`task:${taskId}`, JSON.stringify(taskMetadata), { expirationTtl: 86400 })

        console.log(`[Worker Upload] ✅ Task metadata stored in KV: ${taskId}`)

        // 推送到队列 - 使用正确的 QueueMessage 格式
        const queueMessage: QueueMessage = {
          taskId,
          bucketName: 'svgconvert-net',
          sourceFileKey,
          fileName,
          sourceFormat: taskMetadata.sourceFormat as any,
          options,
          callbackUrl: `https://svg-converter-worker.shendongloving123.workers.dev/callback`,
          callbackToken: env.VPS_CALLBACK_SECRET || 'dev-secret'
        }
        await env.SVG_CONVERTER_QUEUE.send(queueMessage)

        console.log(`[Worker Upload] ✅ Task queued: ${taskId}`)

        return new Response(
          JSON.stringify({
            success: true,
            taskId,
            message: 'File uploaded successfully'
          }),
          { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      } catch (error) {
        console.error('[Worker Upload] Error:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UPLOAD_FAILED', message: error instanceof Error ? error.message : 'Upload failed' }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    // 健康检查端点
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'svg-converter-worker',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200
        }
      )
    }

    // 任务状态查询端点
    if (request.method === 'GET' && url.pathname.startsWith('/status/')) {
      const taskId = url.pathname.split('/')[2]

      if (!taskId) {
        return new Response(
          JSON.stringify({ success: false, error: { code: 'MISSING_TASK_ID', message: 'Task ID required' } }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      try {
        const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`)

        if (!taskDataStr) {
          return new Response(
            JSON.stringify({ success: false, error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        const taskData = JSON.parse(taskDataStr)

        return new Response(
          JSON.stringify({ success: true, task: taskData }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      } catch (error) {
        console.error('[Worker] Status check error:', error)
        return new Response(
          JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Status check failed' } }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    // 下载元数据端点 - 返回下载 URL 信息（符合前端 API 期望）
    if (request.method === 'GET' && url.pathname.match(/^\/download\/[^\/]+$/)) {
      const taskId = url.pathname.split('/')[2]

      if (!taskId) {
        return new Response(
          JSON.stringify({ success: false, error: { code: 'MISSING_TASK_ID', message: 'Task ID required' } }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      try {
        // 从 KV 获取任务元数据
        const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`)

        if (!taskDataStr) {
          return new Response(
            JSON.stringify({ success: false, error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        const taskData = JSON.parse(taskDataStr) as TaskStatus

        // 检查任务是否完成
        if (taskData.status !== 'completed') {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'TASK_NOT_COMPLETED',
                message: `Task not completed. Status: ${taskData.status}`,
                details: { status: taskData.status }
              }
            }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        // 检查输出文件密钥
        if (!taskData.outputKey) {
          return new Response(
            JSON.stringify({ success: false, error: { code: 'OUTPUT_FILE_MISSING', message: 'Output file not found' } }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        // 生成下载 URL
        const fileName = `${taskData.fileName.replace(/\.[^.]+$/, '')}.${taskData.targetFormat.toLowerCase()}`
        const downloadUrl = `https://svg-converter-worker.shendongloving123.workers.dev/download/${taskId}/file`
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

        console.log('[Worker] Download URL generated:', { taskId, fileName })

        return new Response(
          JSON.stringify({
            success: true,
            downloadUrl,
            fileName,
            fileSize: 0, // We don't store file size in current implementation
            expiresAt
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      } catch (error) {
        console.error('[Worker] Download URL generation error:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Download URL generation failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    // 文件下载端点 - 从 R2 提供实际文件
    if (request.method === 'GET' && url.pathname.match(/^\/download\/[^\/]+\/file$/)) {
      const taskId = url.pathname.split('/')[2]

      if (!taskId) {
        return new Response('Task ID required', { status: 400 })
      }

      try {
        // 从 KV 获取任务元数据
        const taskDataStr = await env.SVG_CONVERTER_KV.get(`task:${taskId}`)

        if (!taskDataStr) {
          return new Response('Task not found', { status: 404 })
        }

        const taskData = JSON.parse(taskDataStr) as TaskStatus

        // 检查任务是否完成
        if (taskData.status !== 'completed') {
          return new Response(`Task not completed. Status: ${taskData.status}`, { status: 400 })
        }

        // 检查输出文件密钥
        if (!taskData.outputKey) {
          return new Response('Output file not found', { status: 404 })
        }

        // 从 R2 获取文件
        const r2Object = await env.SVG_CONVERTER_BUCKET.get(taskData.outputKey)

        if (!r2Object) {
          console.error(`[Download] File not found in R2: ${taskData.outputKey}`)
          return new Response('File not found in storage', { status: 404 })
        }

        // 获取文件内容
        const fileBuffer = await r2Object.arrayBuffer()

        // 确定 Content-Type
        const contentType = getContentTypeFromFormat(taskData.targetFormat)

        // 生成文件名
        const fileName = `${taskData.fileName.replace(/\.[^.]+$/, '')}.${taskData.targetFormat.toLowerCase()}`

        console.log(
          `[Worker] 从 R2 提供下载: ${taskData.outputKey} (${fileBuffer.byteLength} bytes)`
        )

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': fileBuffer.byteLength.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (error) {
        console.error('[Worker] Download error:', error)
        return new Response(
          `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { status: 500 }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', path: url.pathname }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 404
      }
    )
  }
} satisfies ExportedHandler<Env>

/**
 * 根据文件格式获取 Content-Type
 */
function getContentTypeFromFormat(format: string): string {
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
