/**
 * SVG 转换工具 - Cloudflare Worker
 * 
 * 职责：
 * 1. Queue Consumer: 处理 SVG 转换任务
 * 2. Cron Trigger: 定时清理过期文件
 * 3. 直接访问 R2、D1、KV 等 Cloudflare 资源
 */

interface ConversionTask {
  taskId: string;
  fileName: string;
  sourceFormat: string;
  targetFormat: string;
  r2Key: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

interface Env {
  SVG_CONVERTER_BUCKET: R2Bucket;
  SVG_CONVERTER_DB: D1Database;
  SVG_CONVERTER_KV: KVNamespace;
  SVG_CONVERTER_QUEUE: Queue;
  VPS_CALLBACK_SECRET: string;
  R2_PUBLIC_URL: string;
  MAX_FILE_SIZE: string;
  FILE_RETENTION_MINUTES: string;
  ENVIRONMENT: string;
}

/**
 * Queue Consumer - 处理转换任务
 */
async function handleQueueMessage(
  message: ConversionTask,
  env: Env
): Promise<void> {
  try {
    console.log(`[Queue Consumer] 处理任务: ${message.taskId}`);

    // 1. 更新任务状态为 processing
    await env.SVG_CONVERTER_KV.put(
      `task:${message.taskId}`,
      JSON.stringify({
        ...message,
        status: 'processing'
      }),
      { expirationTtl: 1800 } // 30 分钟后过期
    );

    // 2. 从 R2 获取源文件
    const sourceFile = await env.SVG_CONVERTER_BUCKET.get(message.r2Key);
    if (!sourceFile) {
      throw new Error(`Source file not found: ${message.r2Key}`);
    }

    const fileBuffer = await sourceFile.arrayBuffer();

    // 3. 调用 VPS 进行文件转换
    // 注意：这里需要你的 VPS 实现转换逻辑
    const convertedBuffer = await callVpsConversion(
      fileBuffer,
      message.sourceFormat,
      message.targetFormat,
      env.VPS_CALLBACK_SECRET
    );

    // 4. 保存转换结果到 R2
    const outputKey = `${message.taskId}/${message.fileName}.${message.targetFormat}`;
    await env.SVG_CONVERTER_BUCKET.put(outputKey, convertedBuffer, {
      customMetadata: {
        taskId: message.taskId,
        originalFormat: message.sourceFormat,
        targetFormat: message.targetFormat,
        uploadedAt: new Date().toISOString()
      }
    });

    // 5. 更新任务状态为 completed
    await env.SVG_CONVERTER_KV.put(
      `task:${message.taskId}`,
      JSON.stringify({
        ...message,
        status: 'completed',
        outputKey,
        completedAt: Date.now()
      }),
      { expirationTtl: 1800 } // 30 分钟后过期
    );

    console.log(`[Queue Consumer] 任务完成: ${message.taskId}`);
  } catch (error) {
    console.error(`[Queue Consumer] 任务失败: ${message.taskId}`, error);

    // 更新任务状态为 failed
    await env.SVG_CONVERTER_KV.put(
      `task:${message.taskId}`,
      JSON.stringify({
        ...message,
        status: 'failed',
        error: String(error),
        completedAt: Date.now()
      }),
      { expirationTtl: 1800 }
    );

    throw error;
  }
}

/**
 * 调用 VPS 进行文件转换
 */
async function callVpsConversion(
  fileBuffer: ArrayBuffer,
  sourceFormat: string,
  targetFormat: string,
  secret: string
): Promise<ArrayBuffer> {
  // 这里应该替换为你的 VPS 地址
  const VPS_URL = 'https://your-vps.example.com/api/convert';

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), `file.${sourceFormat}`);
  formData.append('sourceFormat', sourceFormat);
  formData.append('targetFormat', targetFormat);

  const response = await fetch(VPS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`VPS conversion failed: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Cron Trigger - 定时清理过期文件（每 30 分钟运行）
 */
async function handleCleanup(env: Env): Promise<void> {
  try {
    console.log('[Cron] 开始清理过期文件');

    const retentionMinutes = parseInt(env.FILE_RETENTION_MINUTES || '30');
    const cutoffTime = Date.now() - retentionMinutes * 60 * 1000;

    // 1. 列出 R2 中所有文件
    let cursor: string | undefined;
    let deletedCount = 0;

    do {
      const listResult = await env.SVG_CONVERTER_BUCKET.list({
        cursor,
        prefix: '',
        limit: 1000
      });

      // 2. 检查每个文件的上传时间
      for (const object of listResult.objects) {
        const uploadedAt = object.customMetadata?.uploadedAt;
        if (uploadedAt) {
          const uploadTime = new Date(uploadedAt as string).getTime();
          if (uploadTime < cutoffTime) {
            // 3. 删除过期文件
            await env.SVG_CONVERTER_BUCKET.delete(object.key);
            deletedCount++;
            console.log(`[Cron] 删除过期文件: ${object.key}`);
          }
        }
      }

      cursor = listResult.cursor;
    } while (cursor);

    console.log(`[Cron] 清理完成，删除 ${deletedCount} 个过期文件`);
  } catch (error) {
    console.error('[Cron] 清理失败', error);
    throw error;
  }
}

/**
 * 主 Worker 处理函数
 */
export default {
  async queue(batch: MessageBatch<ConversionTask>, env: Env) {
    for (const message of batch.messages) {
      try {
        await handleQueueMessage(message.body, env);
        message.ack();
      } catch (error) {
        console.error('Failed to process message', error);
        message.retry();
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: Env) {
    console.log(`[Cron] 触发定时任务: ${event.cron}`);
    await handleCleanup(env);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // 可选：为 Worker 提供一个健康检查端点
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      }
    );
  }
} satisfies ExportedHandler<Env>;

