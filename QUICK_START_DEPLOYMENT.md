# 🚀 快速部署指南

## 5 分钟快速开始

### 前置条件
- ✅ Cloudflare 账号
- ✅ Wrangler CLI 已安装
- ✅ Node.js 已安装

### 部署流程

#### 1️⃣ 构建项目
```bash
npm run build
```
✓ 输出到 `.next/` 目录

#### 2️⃣ 部署到 Pages

**第一次部署**（需要在 Cloudflare 创建项目）：
```bash
# 在 Cloudflare 控制面板创建 Pages 项目
# https://dash.cloudflare.com/

# 然后部署
wrangler pages deploy .next --project-name=svg-converter
```

**后续部署**：
```bash
wrangler pages deploy .next
```

#### 3️⃣ 验证部署
```bash
# 查看部署列表
wrangler pages list

# 访问应用
# https://svg-converter.pages.dev/[lang]
# 或查看部署的实际 URL
```

---

## 配置文件说明

### `wrangler.toml` - Pages 主配置
```toml
name = "svg-converter"
pages_build_output_dir = ".next"

[vars]
# 环境变量

[env.production]
[env.preview]
```

👉 **用途**：部署前端应用到 Cloudflare Pages

### `wrangler.workers.toml` - Workers 参考配置
```toml
name = "svg-converter-api"
account_id = "..."
# Worker 资源绑定
```

👉 **用途**：(可选) 单独部署 API 到 Workers

---

## 常用命令

| 命令 | 用途 |
|------|------|
| `npm run build` | 构建项目 |
| `npm run dev` | 本地开发 |
| `wrangler pages deploy .next` | 部署到 Pages |
| `wrangler pages list` | 查看部署 |
| `wrangler pages rollback` | 回滚部署 |

---

## 部署架构

```
┌─────────────────────────────────────────┐
│     用户请求 (https://example.com)     │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐            ┌──────▼──────┐
   │ 静态资源 │            │ API 请求    │
   │(Pages)  │            │(Pages APIs) │
   └────┬────┘            └──────┬──────┘
        │                         │
    ┌───▼───────┐         ┌───────▼─────┐
    │   CDN     │         │  Next.js    │
    │  缓存     │         │  API Route  │
    └───────────┘         └───────┬─────┘
                                  │
                          ┌───────▼──────┐
                          │  外部 VPS    │
                          │  处理转换    │
                          └──────────────┘
```

---

## 环境变量

### Pages 可访问变量
在 `wrangler.toml` 中定义：

```toml
[vars]
R2_PUBLIC_URL = "https://pub-xxx.r2.dev"
MAX_FILE_SIZE = "20971520"
ENVIRONMENT = "production"
```

### Worker Secrets（如需）
```bash
wrangler secret put VPS_CALLBACK_SECRET
wrangler secret put R2_ACCESS_KEY_ID
```

---

## 故障排除

### ❌ "Project not found"
**原因**：Cloudflare Pages 项目不存在  
**解决**：在 https://dash.cloudflare.com 创建项目

### ❌ "Configuration file contains unsupported fields"
**原因**：Pages 不支持的字段（account_id、workers_dev 等）  
**解决**：使用 `wrangler.toml`（仅 Pages），API 配置在 `wrangler.workers.toml`

### ❌ "Failed to deploy"
**原因**：构建失败或网络问题  
**解决**：
1. 检查本地构建：`npm run build`
2. 检查网络连接
3. 查看详细日志

---

## 监控和管理

### 查看部署日志
```bash
wrangler pages deploy .next -v
```

### 实时日志（部署后）
在 Cloudflare 控制面板查看：
- Build logs
- Runtime logs
- Deployment history

### 回滚部署
```bash
wrangler pages rollback
```

---

## 下一步

1. ✅ 部署前端 Pages
2. ⏳ 配置自定义域名
3. ⏳ 设置 SSL/TLS
4. ⏳ (可选) 部署 Workers 处理 API

---

## 完整文档

- 📚 [CONFIG_FIX_SUMMARY.md](./CONFIG_FIX_SUMMARY.md) - 详细配置修复
- 📚 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- 📚 [RESOLUTION_SUMMARY_CN.md](./RESOLUTION_SUMMARY_CN.md) - 问题解决总结

---

**提示**: 遇到问题？查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 的故障排除部分！

