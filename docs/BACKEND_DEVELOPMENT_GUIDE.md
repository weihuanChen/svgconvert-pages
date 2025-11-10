# 后端服务开发指导文档 (Backend Development Guide)

## 📋 文档概述

本文档为 SVG 转换工具的后端服务（VPS 计算层）开发提供完整的技术指导。前端代码已完成并部署在 Cloudflare Pages，本文档将指导您完成 VPS 端的 Node.js 服务开发。

---

## 🏗️ 架构回顾

### 系统组件

```
┌─────────────────┐
│  Next.js前端    │ (已完成) - Cloudflare Pages
│  + API Routes   │
└────────┬────────┘
         │
         ↓ (HTTP API)
┌─────────────────┐
│ Cloudflare R2   │ (文件存储)
│ Cloudflare KV   │ (任务状态)
│ Cloudflare队列  │ (任务分发)
└────────┬────────┘
         │
         ↓ (Queue消息)
┌─────────────────┐
│   VPS服务器     │ ← **本文档重点**
│   (Hono + Node) │
│   + Sharp       │
│   + Inkscape    │
└─────────────────┘
```

### 职责划分

- **前端 (已完成)**: 用户交互、文件上传、状态显示
- **API Routes (已完成)**: 文件接收、状态查询、下载链接生成
- **VPS服务 (待开发)**: 实际的文件转换计算

---

## 🎯 VPS 服务核心任务

您的 VPS 服务需要完成以下核心任务：

1. **监听 Cloudflare Queues** - 接收转换任务
2. **从 R2 下载源文件** - 使用 S3 兼容 API
3. **执行文件转换** - 调用 Sharp/Inkscape 等库
4. **上传结果文件到 R2** - 转换完成后上传
5. **回调 API** - 通知前端转换完成

---

## 📦 技术栈要求

### 必选技术

| 组件 | 推荐版本 | 用途 |
|------|---------|------|
| **Node.js** | 18+ LTS | 运行时环境 |
| **Hono.js** | 最新版 | Web框架（轻量高性能） |
| **Sharp** | 最新版 | SVG→PNG/JPG 转换 |
| **@aws-sdk/client-s3** | v3 | R2 文件访问 |
| **Docker** | 最新版 | 容器化部署 |

### 可选技术

| 组件 | 用途 |
|------|------|
| **Inkscape CLI** | SVG→PDF/EPS 转换 |
| **Potrace** | PNG/JPG→SVG 矢量化 |
| **Ghostscript** | PDF 处理 |

---

## 🔧 项目结构建议

```
vps-converter-service/
├── src/
│   ├── index.ts                 # Hono服务器入口
│   ├── queue-consumer.ts        # Queue消费者
│   ├── r2-client.ts            # R2文件操作
│   ├── converters/
│   │   ├── svg-to-raster.ts    # SVG→PNG/JPG
│   │   ├── svg-to-vector.ts    # SVG→PDF/EPS
│   │   └── raster-to-svg.ts    # PNG/JPG→SVG
│   ├── types/
│   │   └── index.ts            # 类型定义（从前端复制）
│   └── utils/
│       ├── callback.ts         # 回调API调用
│       └── logger.ts           # 日志工具
├── Dockerfile                   # Docker镜像定义
├── docker-compose.yml           # 本地开发环境
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 📝 详细开发步骤

### Step 1: 项目初始化

```bash
# 创建项目目录
mkdir vps-converter-service
cd vps-converter-service

# 初始化 Node.js 项目
npm init -y

# 安装核心依赖
npm install hono @aws-sdk/client-s3 sharp
npm install -D typescript @types/node tsx

# 初始化 TypeScript
npx tsc --init
```

### Step 2: 复制类型定义

将前端的 `types/cloudflare.ts` 文件复制到 VPS 项目:

```bash
# 从前端项目复制类型定义
cp ../svgconvert.net/types/cloudflare.ts ./src/types/cloudflare.ts
```

这样可以确保前后端使用完全相同的接口定义。

### Step 3: 实现 R2 客户端

创建 `src/r2-client.ts`:

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

export class R2Client {
  private s3: S3Client

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    })
  }

  // 从 R2 下载文件
  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const response = await this.s3.send(command)

    // 将 ReadableStream 转换为 Buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  // 上传文件到 R2
  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
    await this.s3.send(command)
  }
}
```

### Step 4: 实现转换器 - SVG to Raster

创建 `src/converters/svg-to-raster.ts`:

```typescript
import sharp from 'sharp'
import type { SVGToRasterOptions } from '../types/cloudflare'

export async function convertSVGToRaster(
  svgBuffer: Buffer,
  options: SVGToRasterOptions
): Promise<Buffer> {
  const { width, height, backgroundColor, quality, targetFormat } = options

  let pipeline = sharp(svgBuffer)

  // 设置输出尺寸
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'contain',
      background: backgroundColor === 'transparent'
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : backgroundColor || { r: 255, g: 255, b: 255, alpha: 1 }
    })
  }

  // 根据目标格式转换
  if (targetFormat === 'png') {
    pipeline = pipeline.png({
      compressionLevel: options.optimize ? 9 : 6,
      adaptiveFiltering: options.optimize
    })
  } else if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality: quality || 85,
      mozjpeg: true // 使用更好的压缩算法
    })
  }

  return pipeline.toBuffer()
}
```

### Step 5: 实现回调功能

创建 `src/utils/callback.ts`:

```typescript
import type { CallbackRequest } from '../types/cloudflare'

export async function notifyCompletion(
  callbackUrl: string,
  callbackToken: string,
  request: Omit<CallbackRequest, 'token'>
): Promise<void> {
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...request,
      token: callbackToken
    })
  })

  if (!response.ok) {
    throw new Error(`Callback failed: ${response.statusText}`)
  }
}
```

### Step 6: 实现队列消费者（核心逻辑）

创建 `src/queue-consumer.ts`:

```typescript
import { R2Client } from './r2-client'
import { convertSVGToRaster } from './converters/svg-to-raster'
import { notifyCompletion } from './utils/callback'
import { generateR2Key } from './types/cloudflare'
import type { QueueMessage } from './types/cloudflare'

export class QueueConsumer {
  private r2Client: R2Client

  constructor() {
    this.r2Client = new R2Client()
  }

  async processTask(message: QueueMessage): Promise<void> {
    const startTime = Date.now()
    const { taskId, bucketName, sourceFileKey, fileName, options, callbackUrl, callbackToken } = message

    try {
      console.log(`[Task ${taskId}] Starting conversion...`)

      // 1. 从 R2 下载源文件
      const sourceBuffer = await this.r2Client.downloadFile(bucketName, sourceFileKey)
      console.log(`[Task ${taskId}] Source file downloaded: ${sourceBuffer.length} bytes`)

      // 2. 执行转换
      let outputBuffer: Buffer

      if (options.targetFormat === 'png' || options.targetFormat === 'jpg') {
        outputBuffer = await convertSVGToRaster(sourceBuffer, options as any)
      } else {
        // TODO: 实现其他转换类型
        throw new Error(`Unsupported conversion: ${options.targetFormat}`)
      }

      console.log(`[Task ${taskId}] Conversion completed: ${outputBuffer.length} bytes`)

      // 3. 上传结果到 R2
      const outputFileName = fileName.replace(/\.\w+$/, `.${options.targetFormat}`)
      const outputFileKey = generateR2Key(taskId, outputFileName, 'output')

      await this.r2Client.uploadFile(
        bucketName,
        outputFileKey,
        outputBuffer,
        `image/${options.targetFormat}`
      )

      console.log(`[Task ${taskId}] Output uploaded to R2: ${outputFileKey}`)

      // 4. 回调通知完成
      const processingDuration = Date.now() - startTime

      await notifyCompletion(callbackUrl, callbackToken, {
        taskId,
        status: 'COMPLETED',
        outputFileKey,
        outputFileSize: outputBuffer.length,
        processingDuration
      })

      console.log(`[Task ${taskId}] Callback sent successfully`)

    } catch (error) {
      console.error(`[Task ${taskId}] Error:`, error)

      // 通知失败
      try {
        await notifyCompletion(callbackUrl, callbackToken, {
          taskId,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processingDuration: Date.now() - startTime
        })
      } catch (callbackError) {
        console.error(`[Task ${taskId}] Callback also failed:`, callbackError)
      }

      throw error
    }
  }
}
```

### Step 7: 实现 Hono 服务器

创建 `src/index.ts`:

```typescript
import { Hono } from 'hono'
import { QueueConsumer } from './queue-consumer'
import type { QueueMessage } from './types/cloudflare'

const app = new Hono()
const queueConsumer = new QueueConsumer()

// 健康检查端点
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// 接收队列消息（用于开发/测试）
// 在生产环境，应该由 Cloudflare Queue 自动调用
app.post('/queue/receive', async (c) => {
  try {
    const message: QueueMessage = await c.req.json()

    // 异步处理任务
    queueConsumer.processTask(message).catch((error) => {
      console.error('Task processing error:', error)
    })

    return c.json({ success: true, message: 'Task accepted' })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// 启动服务器
const port = parseInt(process.env.PORT || '3001')
console.log(`🚀 VPS Converter Service running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch
}
```

### Step 8: Docker 配置

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

# 安装系统依赖（如果需要 Inkscape）
# RUN apk add --no-cache inkscape

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["npm", "start"]
```

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  converter:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - VPS_CALLBACK_SECRET=${VPS_CALLBACK_SECRET}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

---

## 🧪 测试指南

### 本地测试步骤

1. **启动前端开发服务器**

```bash
cd svgconvert.net
npm run dev
```

2. **启动 VPS 服务**

```bash
cd vps-converter-service
npm run dev
```

3. **手动测试转换流程**

创建测试脚本 `test/manual-test.ts`:

```typescript
import { QueueConsumer } from '../src/queue-consumer'
import type { QueueMessage } from '../src/types/cloudflare'

const testMessage: QueueMessage = {
  taskId: 'test-task-123',
  bucketName: 'svg-converter',
  sourceFileKey: 'source/2025-01-01/test-task-123/example.svg',
  fileName: 'example.svg',
  sourceFormat: 'svg',
  options: {
    targetFormat: 'png',
    width: 800,
    height: 600
  },
  callbackUrl: 'http://localhost:3000/api/callback',
  callbackToken: 'dev-secret'
}

const consumer = new QueueConsumer()
consumer.processTask(testMessage)
  .then(() => console.log('✅ Test completed successfully'))
  .catch((error) => console.error('❌ Test failed:', error))
```

运行测试:

```bash
npx tsx test/manual-test.ts
```

---

## 📊 API 接口规范

### 前端 → VPS 通信（通过 Queue）

**Queue Message 格式**（已在前端定义）:

```typescript
interface QueueMessage {
  taskId: string                  // 任务ID
  bucketName: string              // R2存储桶名称
  sourceFileKey: string           // 源文件在R2中的key
  fileName: string                // 原始文件名
  sourceFormat: FileFormat        // 源文件格式
  options: ConversionOptions      // 转换选项
  callbackUrl: string             // 回调URL
  callbackToken: string           // 认证token
}
```

### VPS → 前端回调

**POST {callbackUrl}**

请求体:

```json
{
  "taskId": "uuid-v4",
  "status": "COMPLETED",  // 或 "FAILED"
  "outputFileKey": "output/2025-01-01/uuid-v4/example.png",
  "outputFileSize": 204800,
  "processingDuration": 1234,
  "errorMessage": "错误信息（如果失败）",
  "token": "验证token"
}
```

响应:

```json
{
  "success": true,
  "message": "Task status updated successfully"
}
```

---

## 🔐 安全注意事项

1. **验证回调 Token**
   - 每次回调都必须包含正确的 `VPS_CALLBACK_SECRET`
   - 前端 API 会验证此 token

2. **文件大小限制**
   - 确保不处理超过 20MB 的文件
   - 在下载文件时设置超时

3. **错误处理**
   - 捕获所有可能的异常
   - 即使转换失败也要回调通知前端

4. **资源清理**
   - 处理完成后清理临时文件
   - 避免内存泄漏

---

## 🚀 部署到生产环境

### 使用 Docker 部署

```bash
# 构建镜像
docker build -t svg-converter-vps .

# 运行容器
docker run -d \
  --name svg-converter \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  svg-converter-vps
```

### 配置 Cloudflare Queue 连接

由于 Cloudflare Queues 不能直接推送到外部 VPS，您需要:

**选项 1: 轮询模式**（推荐用于开发）

VPS 定期调用 Cloudflare Workers API 拉取任务:

```typescript
// 在 VPS 中实现
async function pollQueue() {
  while (true) {
    const tasks = await fetch('https://your-domain.com/api/queue/pull')
    // 处理任务...
    await sleep(5000) // 5秒轮询间隔
  }
}
```

**选项 2: Webhook 模式**（推荐用于生产）

在 Cloudflare Workers 中添加一个endpoint，接收到队列消息后立即通过HTTP推送给VPS:

```typescript
// 在 Workers 中
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      await fetch('https://your-vps-domain.com/queue/receive', {
        method: 'POST',
        body: JSON.stringify(message.body)
      })
    }
  }
}
```

---

## 🐛 常见问题排查

### 问题1: Sharp 安装失败

**解决方案**:

```bash
# 清除缓存并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 问题2: R2 连接失败

**检查清单**:

1. ✅ 确认 `R2_ACCOUNT_ID` 正确
2. ✅ 确认 Access Key 有读写权限
3. ✅ 检查 bucket 是否存在
4. ✅ 测试网络连接

### 问题3: 回调失败

**检查清单**:

1. ✅ VPS_CALLBACK_SECRET 前后端一致
2. ✅ callbackUrl 可以从 VPS 访问
3. ✅ 检查前端 API Route 日志

---

## 📚 参考资料

### 官方文档

- [Hono.js 文档](https://hono.dev/)
- [Sharp 文档](https://sharp.pixelplumbing.com/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare Queues 文档](https://developers.cloudflare.com/queues/)

### 代码示例

所有前端代码已完成，您可以参考:

- `/types/cloudflare.ts` - 完整的类型定义
- `/lib/api-client.ts` - API 调用示例
- `/app/api/*` - API Routes 实现

---

## ✅ 开发检查清单

使用此清单确保所有功能都已实现:

### 核心功能

- [ ] R2 文件下载
- [ ] R2 文件上传
- [ ] SVG → PNG 转换
- [ ] SVG → JPG 转换
- [ ] 转换参数支持（尺寸、质量等）
- [ ] 回调 API 调用
- [ ] 错误处理和日志

### 可选功能

- [ ] SVG → PDF 转换
- [ ] PNG/JPG → SVG 矢量化
- [ ] 批量处理优化
- [ ] 健康检查端点
- [ ] 性能监控

### 部署

- [ ] Docker 镜像构建
- [ ] 环境变量配置
- [ ] 生产环境测试
- [ ] 日志和监控设置

---

## 💡 优化建议

### 性能优化

1. **并发处理**: 使用 Worker Threads 并行处理多个任务
2. **缓存策略**: 缓存常用的转换参数模板
3. **资源池**: 复用 Sharp 实例以减少初始化开销

### 可靠性优化

1. **重试机制**: 对失败的任务自动重试
2. **超时保护**: 为每个转换任务设置超时时间
3. **优雅关闭**: 处理 SIGTERM 信号，确保任务完成后再退出

---

## 🎉 总结

您现在拥有了完整的前后端架构说明:

1. ✅ **前端** - Next.js + React + Zustand (已完成)
2. ✅ **API层** - Next.js API Routes (已完成)
3. ✅ **类型系统** - 完整的 TypeScript 定义 (已完成)
4. 📝 **VPS服务** - 本文档提供了完整的实现指导

按照本文档的步骤，您应该能够在 2-3 天内完成 VPS 服务的开发和测试。

**祝开发顺利！** 🚀

如有问题，请参考前端代码或联系团队成员。
