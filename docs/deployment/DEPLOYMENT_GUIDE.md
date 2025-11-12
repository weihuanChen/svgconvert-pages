# 📦 SVG Converter - 完整部署指南

**最后更新**: 2025-11-12  
**项目版本**: 1.0.0  
**部署方案**: OpenNextJS Cloudflare + Worker 分发架构

---

## 🏗️ 架构概览

### 混合部署架构

```
┌─────────────────────────────────────────┐
│        用户浏览器请求                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
     ┌─────────────────────────┐
     │  Cloudflare Worker      │  ← 分发决策
     │  (svgconvert.net)       │
     └──────────┬──────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   ┌─────────┐      ┌─────────┐
   │ R2 存储  │      │ VPS 后端 │
   │(静态)   │      │(转换处理)│
   └─────────┘      └─────────┘
```

**流量分发**:
- **前端静态资源** (HTML/CSS/JS) → **R2 存储**
- **API 转换请求** → **VPS 后端服务**
- **文件下载** → **VPS 返回文件**

---

## 🚀 前端部署：OpenNextJS Cloudflare

### 前置要求

```bash
# Node.js 版本
node --version  # 需要 18+ 或 20+

# 安装依赖
npm install @opennextjs/cloudflare
npm install --save-dev wrangler@3.99.0
```

### 步骤 1：创建 wrangler.jsonc 配置

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "svgconvert-next",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "svgconvert-next"
    }
  ],
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production",
        "VPS_API_BASE": "https://svgconvert-server.zeabur.app"
      }
    },
    "preview": {
      "vars": {
        "ENVIRONMENT": "preview",
        "VPS_API_BASE": "http://localhost:3001"
      }
    }
  }
}
```

### 步骤 2：创建 open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 可选的配置选项
});
```

### 步骤 3：创建 .dev.vars

```
NEXTJS_ENV=development
VPS_API_BASE=http://localhost:3001
```

### 步骤 4：更新 package.json 脚本

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### 步骤 5：更新 next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
}

export default nextConfig
```

### 步骤 6：配置静态缓存 (public/_headers)

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable

/api/*
  Cache-Control: no-cache

/*
  Cache-Control: public,max-age=3600,must-revalidate
```

---

## 🔌 API 代理配置

### Worker 中的 API 转发

在 Next.js 中添加 API 路由来转发请求到 VPS：

```typescript
// app/api/[...route]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const vpsUrl = `${process.env.VPS_API_BASE}${pathname.replace('/api', '')}`
  
  try {
    const formData = await req.formData()
    const response = await fetch(vpsUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept-Language': req.headers.get('Accept-Language') || 'en'
      }
    })
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'API request failed' },
      { status: 500 }
    )
  }
}
```

---

## 🖥️ VPS 后端部署

### 后端服务地址

**生产环境**: https://svgconvert-server.zeabur.app/

**服务功能**:
- ✅ SVG/PNG/JPG/PDF 转换处理
- ✅ 文件上传接收
- ✅ 任务状态查询
- ✅ 文件下载输出
- ✅ 多语言 i18n 支持

### 后端 API 端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/upload | 上传文件进行转换 |
| GET | /api/status/:taskId | 查询转换任务状态 |
| GET | /api/download/:taskId | 下载转换后的文件 |
| DELETE | /api/cleanup/:taskId | 清理已完成的任务 |
| GET | /health | 健康检查 |

### VPS 部署验证

```bash
# 检查服务健康状态
curl -I https://svgconvert-server.zeabur.app/health

# 测试文件上传
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -H "Accept-Language: zh"
```

---

## 📋 完整部署检查清单

### 本地准备
- [ ] Node.js 版本 >= 18
- [ ] 安装所有依赖：`npm install --legacy-peer-deps`
- [ ] 复制环境变量：`.env.local` 包含 VPS_API_BASE
- [ ] 本地构建测试：`npm run build`

### 前端配置
- [ ] 创建 `wrangler.jsonc`
- [ ] 创建 `open-next.config.ts`
- [ ] 创建 `.dev.vars`
- [ ] 创建 `public/_headers`
- [ ] 更新 `package.json` 脚本
- [ ] 更新 `next.config.mjs`

### 本地测试
- [ ] 运行 `npm run preview` 测试 Worker 环境
- [ ] 访问 http://localhost:8787 验证前端
- [ ] 测试 API 代理功能
- [ ] 验证多语言切换

### 部署到 Cloudflare
- [ ] 运行 `npm run deploy`
- [ ] 验证部署 URL 可访问
- [ ] 检查控制台无错误
- [ ] 测试前端功能
- [ ] 测试后端 API 调用

### Cloudflare 配置
- [ ] 绑定自定义域名
- [ ] 配置 SSL/TLS
- [ ] 设置缓存规则
- [ ] 配置 CORS 策略
- [ ] 启用分析

---

## 🔍 常见问题排查

### 问题 1：404 错误 - 页面未找到

**原因**: 部署时被识别为 Pages 而非 Workers

**解决方案**:
```bash
# 只能使用 CLI 部署，不能使用 GitHub 自动推送
npm run deploy
```

### 问题 2：React Hydration 错误

**原因**: 客户端和服务端 HTML 不匹配

**解决方案**:
- 移除 `if (typeof window !== 'undefined')` 检查
- 使用 `useMemo` 处理 Promise 参数
- 避免 `Date.now()` 等不确定函数

### 问题 3：API 调用失败

**原因**: VPS_API_BASE 环境变量未设置

**解决方案**:
```bash
# 在 wrangler.jsonc 中检查环境变量
# 在 .dev.vars 中配置本地开发变量
# 在 Cloudflare 控制面板配置生产变量
```

### 问题 4：CSS 样式不显示

**原因**: 缺少 PostCSS 配置或 Tailwind CSS 编译

**解决方案**:
1. 确保 `postcss.config.mjs` 包含 tailwindcss
2. 检查 `tailwind.config.ts` 是否正确
3. 清理构建并重新部署：`rm -rf .open-next .next && npm run deploy`

### 问题 5：超时 (504 错误)

**原因**: VPS 后端服务无响应

**解决方案**:
```bash
# 检查 VPS 后端健康状态
curl https://svgconvert-server.zeabur.app/health

# 检查网络连接
ping svgconvert-server.zeabur.app

# 查看 Cloudflare 日志
wrangler tail
```

---

## ✅ 部署验证

### 功能测试检查表

访问前端应用后验证以下功能：

- [ ] 页面加载速度 < 2 秒
- [ ] 支持中文和英文切换
- [ ] 文件拖放上传功能正常
- [ ] 格式选择下拉菜单可用
- [ ] 转换参数设置显示
- [ ] 上传按钮可点击
- [ ] 转换进度显示
- [ ] 下载链接正常工作
- [ ] 主题切换（亮/暗）正常
- [ ] 响应式设计在移动设备上适配

### 性能基准

目标性能指标：

| 指标 | 目标 | 实际 |
|------|------|------|
| 首页加载 | < 2s | |
| API 响应 | < 1s | |
| 文件转换 | < 10s | |
| 文件下载 | < 2s | |

---

## 📊 部署对比

### GitHub 自动推送（❌ 不推荐）
```
结果: ❌ 404 错误
原因: 被识别为 Pages，不支持 Node.js
```

### CLI 本地部署（✅ 推荐）
```
结果: ✅ 正常运行
原因: 部署为 Workers，完全支持 Next.js
命令: npm run deploy
时间: 1-2 分钟
```

---

## 🔗 相关资源

- [OpenNext 官方文档](https://opennext.js.org/cloudflare/get-started)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

---

## 💡 关键要点

1. **不要依赖 GitHub 自动部署** - 必须使用 `npm run deploy`
2. **配置环境变量** - 确保 VPS_API_BASE 正确设置
3. **本地预览很重要** - 使用 `npm run preview` 验证
4. **缓存策略** - 配置 _headers 优化性能
5. **监控日志** - 使用 `wrangler tail` 查看实时日志

---

**记住：前端和后端分离部署，通过 Worker 分发流量！** 🎯

