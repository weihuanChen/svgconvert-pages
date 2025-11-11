# 部署指南 - SVG 转换工具

本项目采用 **混合架构** 在 Cloudflare 上部署，分为两部分：

## 📋 架构概述

| 部分 | 技术 | 用途 | 配置文件 |
|------|------|------|--------|
| **前端** | Next.js + Cloudflare Pages | 提供 UI 界面和静态资源 | `wrangler.toml` |
| **API** | Next.js API Routes + Workers | 处理文件上传、状态查询等 | `wrangler.workers.toml` |
| **后端处理** | 外部 VPS | 真正的 SVG 转换处理 | `app/api/callback/route.ts` |

## 🚀 部署步骤

### 第 1 步：前置准备

```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

### 第 2 步：部署前端到 Pages

```bash
# 首次部署（需要先在 Cloudflare 控制面板创建 Pages 项目）
# 1. 访问 https://dash.cloudflare.com
# 2. 进入 Pages 部分，创建新项目
# 3. 连接 GitHub 或手动上传

# 或使用命令行部署
wrangler pages deploy .next --project-name=svg-converter
```

**关键点**：
- Pages 使用 `wrangler.toml` 中的配置（仅限 `[vars]` 和 `[env.production]`/`[env.preview]`）
- 自动使用 `.next` 目录作为输出（`pages_build_output_dir = ".next"`）

### 第 3 步：部署 API Workers

```bash
# 部署 API Routes 到 Workers
wrangler deploy -c wrangler.workers.toml

# 设置所需的 Secret
wrangler secret put VPS_CALLBACK_SECRET -c wrangler.workers.toml
wrangler secret put R2_ACCESS_KEY_ID -c wrangler.workers.toml
wrangler secret put R2_SECRET_ACCESS_KEY -c wrangler.workers.toml
```

**关键点**：
- Workers 配置包含所有 Cloudflare 资源绑定（R2、D1、KV、Queue）
- 包含任务队列消费者配置和定时任务（Cron）

### 第 4 步：验证部署

```bash
# 本地开发
npm run dev

# 验证 Pages
curl https://svg-converter.pages.dev/[lang]

# 验证 Workers API
curl https://svg-converter-api.workers.dev/api/upload
```

## 📝 配置文件说明

### `wrangler.toml` - Pages 配置

```toml
name = "svg-converter"
pages_build_output_dir = ".next"

[vars]
# 前端环境变量

[env.production]
# 生产环境特定配置

[env.preview]
# 预览环境特定配置
```

**限制**：Pages 不支持 Workers 特定的配置（account_id、triggers、观察性等）

### `wrangler.workers.toml` - API Workers 配置

```toml
name = "svg-converter-api"
account_id = "..."

# R2 Bucket
[[r2_buckets]]
...

# D1 Database
[[d1_databases]]
...

# KV Namespaces
[[kv_namespaces]]
...

# Queue (Consumer)
[[queues.consumers]]
...

# Cron Triggers
[triggers]
crons = ["0 */1 * * *"]
```

## 🔄 工作流程

1. **用户上传文件**
   - 上传到 `/api/upload` (Pages API Route)
   - 文件存储到 R2
   - 任务元数据保存到 KV/D1
   - 消息发送到 Queue

2. **任务处理**
   - Queue Consumer 接收消息
   - 调用外部 VPS 处理 SVG 转换
   - VPS 处理完毕后 POST 回 `/api/callback`

3. **回调处理**
   - 更新任务状态
   - 存储输出文件到 R2
   - 用户可下载

## 🔐 环境变量和 Secrets

### 前端可访问 (vars)
- `R2_PUBLIC_URL` - R2 公开 URL
- `MAX_FILE_SIZE` - 最大文件大小
- `ENVIRONMENT` - 环境标记

### Worker 需要的 Secrets
- `VPS_CALLBACK_SECRET` - VPS 回调验证密钥
- `R2_ACCESS_KEY_ID` - R2 API 访问密钥
- `R2_SECRET_ACCESS_KEY` - R2 API 密钥

## 🐛 故障排除

### 问题：Pages 配置验证失败

**原因**：Pages 不支持 Workers 特定的配置字段

**解决**：
- 确保使用 `wrangler.toml`（Pages 配置）
- Worker 相关配置放在 `wrangler.workers.toml`
- 检查不支持的字段：`account_id`, `workers_dev`, `build`, `triggers`, `observability`, `queues.consumers`

### 问题：API 无法访问 Cloudflare 资源

**原因**：需要正确的配置文件和 Secrets

**解决**：
- 使用 `wrangler deploy -c wrangler.workers.toml` 部署 API
- 设置所有必需的 Secrets
- 验证 Cloudflare 资源 IDs

### 问题：文件上传失败

**原因**：可能是 R2 权限或网络问题

**解决**：
- 检查 R2 权限设置
- 验证 API 密钥有效性
- 查看 Workers 日志：`wrangler tail -c wrangler.workers.toml`

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [R2 存储 API](https://developers.cloudflare.com/r2/)
- [D1 数据库](https://developers.cloudflare.com/d1/)
- [KV 存储](https://developers.cloudflare.com/kv/)

## 🔄 更新构建

当需要更新应用时：

```bash
# 1. 修改代码
git add .
git commit -m "Your changes"

# 2. 构建
npm run build

# 3. 部署前端
wrangler pages deploy .next

# 4. 部署 API（如果有变更）
wrangler deploy -c wrangler.workers.toml
```

## 💡 最佳实践

1. **分离配置**：使用不同的配置文件管理 Pages 和 Workers
2. **环境隔离**：使用 `env.production` 和 `env.preview` 区分环境
3. **Secret 安全**：避免在代码中硬编码密钥，使用 `wrangler secret put`
4. **监控日志**：使用 `wrangler tail` 查看实时日志
5. **定期测试**：在部署前本地测试所有功能

---

**最后更新**：2025-11-11  
**项目**：SVG 转换工具  
**架构**：Next.js + Cloudflare Pages/Workers 混合部署

