# 🔧 Cloudflare 配置参考指南

## 📋 快速查询表

### 资源 ID 对照表

| 资源类型 | 资源名称 | ID / 配置 | 类型 |
|---------|---------|---------|------|
| **R2 Bucket** | `svg-converter` | 已创建 | 生产 |
| **D1 Database** | `svg-converter` | `6762c777-6807-438c-801e-e3f743aa6a5e` | 生产 |
| **D1 Database (Preview)** | `svg-converter` | `6762c777-6807-438c-801e-e3f743aa6a5e` | 预览 |
| **KV Namespace** | `SVG_CONVERTER_KV` | `d6f9b75693384b869b13edae0a84f485` | 生产 |
| **KV Namespace (Preview)** | `SVG_CONVERTER_KV_preview` | `ecc92269f04f49b49f6bbf2d106e0993` | 预览 |
| **Queue (Producer)** | `svg-converter-queue` | 已创建 | 任务队列 |
| **Queue (DLQ)** | `svg-converter-dlq` | 已创建 | 死信队列 |

### Secrets 列表

| Secret 名称 | 类型 | 用途 | 设置方式 |
|-----------|------|------|--------|
| `VPS_CALLBACK_SECRET` | 加密文本 | VPS 回调认证 | `wrangler secret put` |
| `R2_ACCESS_KEY_ID` | 加密文本 | R2 API 访问 | `wrangler secret put` |
| `R2_SECRET_ACCESS_KEY` | 加密文本 | R2 API 认证 | `wrangler secret put` |
| `D1_DATABASE_ID` | 加密文本 | D1 数据库 ID | `wrangler secret put` |
| `KV_NAMESPACE_ID` | 加密文本 | KV 命名空间 ID | `wrangler secret put` |

### 环境变量

| 变量名 | 值 | 类型 | 说明 |
|------|-----|------|------|
| `R2_PUBLIC_URL` | `https://pub-62d5cc9053a54840a2075d357d13940e.r2.dev` | vars | R2 公开 URL |
| `R2_ACCOUNT_ID` | `916a9ebd0967327020ed90ad654875f6` | vars | Cloudflare 账户 ID |
| `MAX_FILE_SIZE` | `20971520` | vars | 最大文件大小（20MB） |
| `FILE_RETENTION_MINUTES` | `30` | vars | 文件保留时间（分钟） |

---

## 🔍 查询现有资源的命令

### 查看所有 D1 数据库

```bash
wrangler d1 list

# 输出示例：
# ┌──────────────────────────────────────┬───────────────┬──────────────────────────┬────────────┐
# │ uuid                                 │ name          │ created_at               │ version    │
# ├──────────────────────────────────────┼───────────────┼──────────────────────────┼────────────┤
# │ 6762c777-6807-438c-801e-e3f743aa6a5e │ svg-converter │ 2025-11-11T02:42:27.038Z │ production │
# └──────────────────────────────────────┴───────────────┴──────────────────────────┴────────────┘
```

### 查看所有 KV 命名空间

```bash
wrangler kv namespace list

# 输出示例（JSON格式）：
# [
#   {
#     "id": "d6f9b75693384b869b13edae0a84f485",
#     "title": "SVG_CONVERTER_KV",
#     "supports_url_encoding": true
#   },
#   {
#     "id": "ecc92269f04f49b49f6bbf2d106e0993",
#     "title": "SVG_CONVERTER_KV_preview",
#     "supports_url_encoding": true
#   }
# ]
```

### 查看所有 R2 Buckets

```bash
wrangler r2 bucket list

# 输出示例：
# ┌────────────────────┬──────────────────────────┐
# │ name               │ creation_date            │
# ├────────────────────┼──────────────────────────┤
# │ svg-converter      │ 2025-11-11T02:42:00.000Z │
# └────────────────────┴──────────────────────────┘
```

### 查看所有 Queues

```bash
wrangler queues list

# 输出示例：
# ┌──────────────────────────┬─────────────┐
# │ name                     │ consumers   │
# ├──────────────────────────┼─────────────┤
# │ svg-converter-queue      │ 0           │
# │ svg-converter-dlq        │ 0           │
# └──────────────────────────┴─────────────┘
```

### 查看所有 Secrets

```bash
wrangler secret list

# 输出示例（JSON格式）：
# [
#   { "name": "VPS_CALLBACK_SECRET", "type": "secret_text" },
#   { "name": "R2_ACCESS_KEY_ID", "type": "secret_text" },
#   { "name": "R2_SECRET_ACCESS_KEY", "type": "secret_text" },
#   { "name": "D1_DATABASE_ID", "type": "secret_text" },
#   { "name": "KV_NAMESPACE_ID", "type": "secret_text" }
# ]
```

---

## 📝 wrangler.toml 完整配置

### 账户配置部分

```toml
name = "svg-converter"
main = "src/index.ts"
compatibility_date = "2024-01-01"
account_id = "916a9ebd0967327020ed90ad654875f6"
workers_dev = true
```

### R2 Bucket 绑定

```toml
[[r2_buckets]]
binding = "SVG_CONVERTER_BUCKET"
bucket_name = "svg-converter"
preview_bucket_name = "svg-converter-preview"
```

### D1 数据库绑定

```toml
[[d1_databases]]
binding = "SVG_CONVERTER_DB"
database_name = "svg-converter"
database_id = "6762c777-6807-438c-801e-e3f743aa6a5e"
preview_database_id = "6762c777-6807-438c-801e-e3f743aa6a5e"
```

### KV 命名空间绑定

```toml
[[kv_namespaces]]
binding = "SVG_CONVERTER_KV"
id = "d6f9b75693384b869b13edae0a84f485"
preview_id = "ecc92269f04f49b49f6bbf2d106e0993"
```

### Queue 配置

```toml
[[queues.producers]]
binding = "SVG_CONVERTER_QUEUE"
queue = "svg-converter-queue"

[[queues.consumers]]
queue = "svg-converter-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "svg-converter-dlq"
```

### 环境变量配置

```toml
[vars]
R2_PUBLIC_URL = "https://pub-62d5cc9053a54840a2075d357d13940e.r2.dev"
R2_ACCOUNT_ID = "916a9ebd0967327020ed90ad654875f6"
MAX_FILE_SIZE = "20971520"
FILE_RETENTION_MINUTES = "30"
```

---

## 🔧 常用命令速查

### 部署操作

```bash
# 验证配置（不部署）
wrangler deploy --dry-run

# 部署到生产
wrangler deploy

# 查看部署历史
wrangler deployments

# 回滚到上一版本
wrangler rollback

# 查看 Worker 日志（实时）
wrangler tail

# 删除 Worker
wrangler delete
```

### Secret 管理

```bash
# 设置 Secret
wrangler secret put SECRET_NAME

# 查看所有 Secrets
wrangler secret list

# 删除 Secret
wrangler secret delete SECRET_NAME
```

### 本地开发

```bash
# 启动本地开发服务器
wrangler dev

# 指定监听端口
wrangler dev --port 8787
```

### 账户管理

```bash
# 查看当前登录用户
wrangler whoami

# 登录 Cloudflare
wrangler login

# 退出登录
wrangler logout
```

---

## 🛠️ 在 Worker 代码中使用这些资源

### TypeScript 类型定义

```typescript
interface Env {
  // R2 Bucket
  SVG_CONVERTER_BUCKET: R2Bucket

  // D1 Database
  SVG_CONVERTER_DB: D1Database

  // KV Namespace
  SVG_CONVERTER_KV: KVNamespace

  // Queue Binding
  SVG_CONVERTER_QUEUE: Queue

  // Secrets
  VPS_CALLBACK_SECRET: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string

  // Variables
  R2_PUBLIC_URL: string
  R2_ACCOUNT_ID: string
  MAX_FILE_SIZE: string
  FILE_RETENTION_MINUTES: string
}
```

### 使用示例

```typescript
export default {
  async fetch(request: Request, env: Env) {
    // 使用 R2 Bucket
    const file = await env.SVG_CONVERTER_BUCKET.get('path/to/file')

    // 使用 D1 Database
    const db = env.SVG_CONVERTER_DB
    const result = await db.prepare('SELECT * FROM tasks').all()

    // 使用 KV Namespace
    const cached = await env.SVG_CONVERTER_KV.get('cache-key')

    // 使用 Queue
    await env.SVG_CONVERTER_QUEUE.send({ taskId: '123' })

    // 使用 Secrets
    const token = env.VPS_CALLBACK_SECRET

    // 使用环境变量
    const maxSize = parseInt(env.MAX_FILE_SIZE)

    return new Response('OK')
  }
}
```

---

## 📊 资源配置时间线

| 时间 | 操作 | 状态 |
|------|------|------|
| 2025-11-11 02:42:00 | 创建 R2 Bucket | ✅ |
| 2025-11-11 02:42:27 | 创建 D1 Database | ✅ |
| 2025-11-11 02:43:00 | 创建 KV Namespace (生产) | ✅ |
| 2025-11-11 02:43:30 | 创建 KV Namespace (预览) | ✅ |
| 2025-11-11 02:44:00 | 创建 Queue (主队列) | ✅ |
| 2025-11-11 02:44:30 | 创建 Queue (死信队列) | ✅ |
| 2025-11-11 02:45:00 | 设置 Secrets | ✅ |
| 2025-11-11 02:45:30 | 更新 wrangler.toml | ✅ |

---

## ⚠️ 重要提醒

1. **不要将 Secrets 提交到 Git** - 它们只存储在 Cloudflare 服务器上
2. **定期备份 ID** - 将这份文档安全地保存
3. **生产环境使用强密钥** - `VPS_CALLBACK_SECRET` 应该足够强
4. **监控 R2 存储成本** - 大文件和高频访问会产生费用
5. **设置文件保留策略** - 定期清理过期文件

---

## 🔗 相关文档链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 参考](https://developers.cloudflare.com/workers/wrangler/commands/)
- [R2 API 参考](https://developers.cloudflare.com/r2/api/s3/api/)
- [D1 SQL 参考](https://developers.cloudflare.com/d1/platform/client-api/)
- [KV API 参考](https://developers.cloudflare.com/kv/api/)
- [Queues 文档](https://developers.cloudflare.com/queues/)

---

**最后更新**: 2025-11-11  
**配置版本**: 1.0  
**状态**: ✅ 完成

