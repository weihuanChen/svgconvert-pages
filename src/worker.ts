/**
 * SVG 转换工具 - Cloudflare Worker
 *
 * 职责：
 * 1. Queue Consumer: 处理 SVG 转换任务，调用 VPS 进行文件转换
 * 2. Cron Trigger: 定时清理过期文件（每小时运行）
 * 3. 直接访问 Cloudflare 资源（R2、KV）
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ConversionTask {
  taskId: string
  fileName: string
  sourceFormat: string
  targetFormat: string
  r2Key: string
  conversionOptions?: Record<string, any>
  callbackUrl?: string
  createdAt?: number
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
  message: ConversionTask,
  env: Env
): Promise<void> {
  const taskId = message.taskId
  const createdAt = message.createdAt || Date.now()

  try {
    console.log(`[Queue] 处理任务: ${taskId}`)

    // 1. 更新任务状态为 processing
    await updateTaskStatus(env, taskId, {
      taskId,
      status: 'processing',
      fileName: message.fileName,
      sourceFormat: message.sourceFormat,
      targetFormat: message.targetFormat,
      createdAt
    })

    // 2. 从 R2 获取源文件
    const sourceFile = await env.SVG_CONVERTER_BUCKET.get(message.r2Key)
    if (!sourceFile) {
      throw new Error(`Source file not found: ${message.r2Key}`)
    }

    const fileBuffer = await sourceFile.arrayBuffer()
    console.log(
      `[Queue] 已获取源文件: ${message.r2Key}, 大小: ${fileBuffer.byteLength} bytes`
    )

    // 3. 调用 VPS 进行文件转换
    const convertedBuffer = await callVpsConversion(
      fileBuffer,
      message.sourceFormat,
      message.targetFormat,
      message.conversionOptions || {},
      env.VPS_CONVERSION_URL,
      env.VPS_CALLBACK_SECRET
    )

    // 4. 保存转换结果到 R2
    const baseFileName = message.fileName
      .replace(/\.[^/.]+$/, '') // 移除原始扩展名
      .replace(/[^a-zA-Z0-9._-]/g, '_') // 只保留安全字符

    const outputKey = `${taskId}/${baseFileName}.${message.targetFormat.toLowerCase()}`

    await env.SVG_CONVERTER_BUCKET.put(outputKey, convertedBuffer, {
      customMetadata: {
        taskId,
        originalFormat: message.sourceFormat,
        targetFormat: message.targetFormat,
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
      targetFormat: message.targetFormat,
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
      targetFormat: message.targetFormat,
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
  async queue(batch: MessageBatch<ConversionTask>, env: Env) {
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
   * HTTP 请求处理（可选的健康检查端点）
   *
   * 注意：大多数请求由 Pages 处理
   * 这里仅用于 Worker 自身的监控
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'svg-converter-worker',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', path: url.pathname }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      }
    )
  }
} satisfies ExportedHandler<Env>
