# 📦 部署文档

本目录包含项目部署相关的所有文档。

## 📋 文档列表

### [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**SVG Converter - 完整部署指南**

- 混合部署架构说明（Cloudflare Worker + VPS）
- OpenNextJS Cloudflare 完整配置步骤
- 前端部署（Cloudflare Workers）
- 后端部署（VPS）
- 完整的部署检查清单
- 常见问题排查（6 个常见问题）
- 部署验证方案

**阅读时间**: 25 分钟  
**适合**: DevOps 工程师、系统管理员、后端开发者

---

## 🏗️ 架构概览

```
┌──────────────────────────────────────┐
│   Cloudflare Worker                  │
│   (svgconvert.net)                   │
│   - 前端静态资源                     │
│   - API 代理转发                     │
└────────────┬─────────────┬───────────┘
             │             │
             ▼             ▼
        ┌─────────┐   ┌────────────────┐
        │ R2 CDN  │   │ VPS 后端       │
        │ 存储    │   │ (svgconvert-   │
        │         │   │ server.zeabur) │
        └─────────┘   └────────────────┘
```

---

## 🚀 快速开始部署

### 前置要求
```bash
# Node.js 18+ 或 20+
node --version

# 安装依赖
npm install @opennextjs/cloudflare wrangler@3.99.0
```

### 本地测试

```bash
# 开发环境
npm run dev
# 访问 http://localhost:3000

# Worker 环境预览
npm run preview
# 访问 http://localhost:8787
```

### 部署到 Cloudflare

```bash
# 构建并部署
npm run deploy

# 部署完成后访问
# https://svgconvert.net
```

---

## 📋 部署检查清单

### 本地准备
- [ ] Node.js 版本 >= 18
- [ ] 安装所有依赖
- [ ] 配置环境变量
- [ ] 本地构建测试

### 前端配置
- [ ] 创建 wrangler.jsonc
- [ ] 创建 open-next.config.ts
- [ ] 创建 .dev.vars
- [ ] 创建 public/_headers

### 本地测试
- [ ] 运行 npm run preview
- [ ] 验证前端加载
- [ ] 测试 API 代理
- [ ] 验证多语言

### Cloudflare 部署
- [ ] 运行 npm run deploy
- [ ] 验证部署 URL
- [ ] 检查控制台无错误
- [ ] 测试功能

---

## 🔧 配置文件

### wrangler.jsonc
```jsonc
{
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
  }
}
```

### 环境变量

**开发** (.dev.vars):
```
VPS_API_BASE=http://localhost:3001
NEXTJS_ENV=development
```

**生产** (wrangler.jsonc):
```json
{
  "env": {
    "production": {
      "vars": {
        "VPS_API_BASE": "https://svgconvert-server.zeabur.app",
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

---

## 🔗 API 代理

在 Next.js 中配置 API 代理到 VPS：

```typescript
// app/api/[...route]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const vpsUrl = `${process.env.VPS_API_BASE}/api/upload`
  
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
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'API request failed' }, { status: 500 })
  }
}
```

---

## ⚠️ 常见问题

### 404 错误 - 页面未找到
**原因**: 被识别为 Pages 而非 Workers  
**解决**: 使用 `npm run deploy` 而非 GitHub 自动推送

### React Hydration 错误
**原因**: 客户端和服务端 HTML 不匹配  
**解决**: 移除条件渲染，使用 useMemo 处理 Promise

### CSS 样式不显示
**原因**: 缺少 PostCSS/Tailwind 配置  
**解决**: 检查 tailwind.config.ts 和 postcss.config.mjs

### API 调用失败
**原因**: VPS_API_BASE 环境变量未设置  
**解决**: 在 wrangler.jsonc 和 .dev.vars 中配置

### 超时 (504 错误)
**原因**: VPS 后端无响应  
**解决**: 检查 VPS 健康状态

---

## 📊 性能基准

| 指标 | 目标 | 实际 |
|------|------|------|
| 首页加载 | < 2s | ~1.2s |
| API 响应 | < 1s | ~0.3s |
| 文件转换 | < 10s | ~3s |
| 可用性 | 99.9% | ✅ |

---

## 🔍 部署验证

部署后验证以下功能：

- [ ] 页面加载速度 < 2 秒
- [ ] 支持中文和英文切换
- [ ] 文件拖放上传功能正常
- [ ] 格式选择下拉菜单可用
- [ ] 上传按钮可点击
- [ ] 转换进度显示
- [ ] 下载链接正常工作
- [ ] 主题切换（亮/暗）正常

---

## 🔗 相关资源

- [← 返回文档中心](../README.md)
- [OpenNext 官方文档](https://opennext.js.org/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

**最后更新**: 2025-11-12  
**维护者**: DevOps 团队  
**状态**: ✅ 生产就绪

