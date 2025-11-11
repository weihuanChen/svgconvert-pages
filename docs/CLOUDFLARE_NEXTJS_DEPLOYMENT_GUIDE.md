# Cloudflare + Next.js 完整部署指南

## 📋 核心问题与解决方案

### 问题背景

在部署 Next.js 应用到 Cloudflare 时，存在一个关键的架构差异：

| 部署方式 | 平台识别 | 部署入口 | 要求 | 兼容性 |
|---------|--------|--------|------|-------|
| **GitHub 自动推送** | Pages | 需要 `index.html` | 严格要求静态文件入口 | ❌ 不支持 Workers |
| **npm run deploy** | Workers | `.open-next/worker.js` | 支持 Node.js API | ✅ 完全兼容 |

### 核心问题

1. **GitHub 自动部署识别为 Pages**
   - Cloudflare Pages 严格要求静态文件入口 (`index.html`)
   - Next.js 应用编译后输出 `.next/` 或 `.open-next/` 目录
   - Pages 无法识别这些动态应用结构，导致 **404 错误**

2. **@opennextjs/cloudflare 编译冲突**
   - OpenNext 生成 `.open-next/` 目录（Workers 格式）
   - 而 GitHub 推送被识别为 Pages（需要静态格式）
   - 两种格式不兼容，导致平台编译失败

3. **根本原因**
   - GitHub 自动部署会触发 Cloudflare Pages 构建流程
   - Pages 寻找 `index.html` 或 `public/index.html`
   - 而 OpenNext 输出的是 Workers 兼容格式，不是 Pages 格式

---

## ✅ 解决方案：使用 CLI 部署 + 本地构建

### 架构对比

```
❌ 错误方案：GitHub 自动推送 → Cloudflare Pages (404)
  
  GitHub Push
    ↓
  Cloudflare Pages (自动构建)
    ↓
  寻找 index.html
    ↓
  ❌ 找不到 → 404 错误
```

```
✅ 正确方案：本地构建 + CLI 部署 → Cloudflare Workers (成功)
  
  本地运行 npm run deploy
    ↓
  OpenNext 构建为 .open-next/
    ↓
  Deploy 命令推送到 Cloudflare Workers
    ↓
  ✅ 正确识别 → 正常显示
```

---

## 🚀 完整配置步骤

### 1. 安装必要依赖

```bash
npm install @opennextjs/cloudflare
npm install --save-dev wrangler@3.99.0
```

**版本要求**：Wrangler 必须 >= 3.99.0

### 2. 创建 wrangler.jsonc 配置

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "my-app",
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
      "service": "my-app"
    }
  ],
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production",
        // 其他环境变量
      }
    },
    "preview": {
      "vars": {
        "ENVIRONMENT": "preview",
        // 其他环境变量
      }
    }
  }
}
```

**关键点**：
- `main` 必须指向 `.open-next/worker.js`
- `nodejs_compat` 和 `global_fetch_strictly_public` 必须启用
- 使用 `services` 配置自引用

### 3. 创建 open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 可选的配置选项
});
```

### 4. 创建 .dev.vars 文件

```
NEXTJS_ENV=development
```

### 5. 创建 public/_headers 文件

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

用于静态资源缓存

### 6. 创建 tailwind.config.ts

完整的 Tailwind CSS 配置（确保 PostCSS 能正确编译）

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // 完整配置...
}

export default config
```

### 7. 更新 package.json 脚本

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### 8. 更新 next.config.mjs

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

### 9. 修复 Layout 和页面文件

**app/layout.tsx** - 使用正确的 HTML 结构：
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**app/[lang]/layout.tsx** - 包含字体和主题提供者：
```typescript
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" })

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  // 正确处理 Promise params，避免 hydration 错误
}
```

### 10. 配置 .gitignore

```
.open-next
.next
node_modules
.env.local
.wrangler
```

---

## ⚙️ 部署流程

### 本地测试

```bash
# 开发模式
npm run dev

# 预览模式（在 Workers 环境下运行）
npm run preview
```

### 部署到 Cloudflare Workers

```bash
# 完整部署（构建 + 部署）
npm run deploy

# 或仅更新应用版本
npm run upload
```

**输出示例**：
```
✨ Success! Uploaded 15 files (3.89 sec)
Deployed svgconvert-next (26.29 sec)
https://my-app.my-username.workers.dev
```

---

## 🔍 常见问题排查

### 问题 1：GitHub 推送后显示 404

**原因**：被识别为 Pages，而不是 Workers

**解决方案**：
```bash
# ❌ 不要依赖 GitHub 自动部署
# ✅ 使用本地 CLI 部署
npm run deploy
```

### 问题 2：React Hydration 错误

**原因**：客户端和服务端 HTML 不匹配

**解决方案**：
- 移除 `if (typeof window !== 'undefined')` 检查
- 避免在 SSR 阶段使用 `Date.now()` 等不确定函数
- 使用 `useMemo` 处理 Promise 参数，而非 `useEffect`

### 问题 3：CSS 样式不显示

**原因**：缺少 `tailwind.config.ts` 或 PostCSS 配置

**解决方案**：
1. 创建 `tailwind.config.ts`
2. 确保 `postcss.config.mjs` 包含 `@tailwindcss/postcss`
3. 在 layout 中导入 `globals.css`

### 问题 4：构建时超时

**原因**：`.open-next` 太大或 node_modules 问题

**解决方案**：
```bash
# 清理构建
rm -rf .open-next .next

# 重新部署
npm run deploy
```

---

## 📊 部署结果对比

### GitHub 自动部署（❌ 不推荐）

```
状态: ❌ 404 错误
原因: Pages 格式不兼容 Next.js
时间: 2-5 分钟
调试: 困难
```

### CLI Deploy 部署（✅ 推荐）

```
状态: ✅ 正常运行
原因: Workers 格式完全支持 Next.js
时间: 1-2 分钟
调试: 本地即时反馈
```

---

## 🎯 最佳实践

### 开发工作流

```bash
# 1. 本地开发
npm run dev

# 2. 本地预览（Workers 模式）
npm run preview

# 3. 测试无误后部署
npm run deploy
```

### CI/CD 集成（可选）

如果要自动化部署，可在 GitHub Actions 中：

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run deploy
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

但要注意：GitHub Actions 部署需要 API Token，可能存在 Pages/Workers 识别问题。**强烈建议本地部署**。

---

## 📋 部署检查清单

- [ ] 安装 `@opennextjs/cloudflare` 和 `wrangler@3.99.0`
- [ ] 创建 `wrangler.jsonc`
- [ ] 创建 `open-next.config.ts`
- [ ] 创建 `.dev.vars`
- [ ] 创建 `public/_headers`
- [ ] 创建 `tailwind.config.ts`
- [ ] 更新 `package.json` 脚本
- [ ] 更新 `next.config.mjs`
- [ ] 修复 `app/layout.tsx`（正确 HTML 结构）
- [ ] 修复 `app/[lang]/layout.tsx`（处理 Promise params）
- [ ] 修复 React Hydration 错误
- [ ] 测试 `npm run preview`
- [ ] 运行 `npm run deploy`
- [ ] 验证部署 URL 可访问

---

## 🔗 相关资源

- [OpenNext 官方文档](https://opennext.js.org/cloudflare/get-started)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Next.js 部署](https://nextjs.org/docs/deployment)

---

## 📝 版本信息

- Next.js: 16.0.0
- @opennextjs/cloudflare: ^1.12.0
- Wrangler: ^3.99.0
- Tailwind CSS: ^4.1.9

---

## 💡 关键要点总结

1. **不要依赖 GitHub 自动部署** - 会被识别为 Pages，导致 404
2. **始终使用 `npm run deploy`** - 正确将应用部署为 Workers
3. **本地测试很重要** - 使用 `npm run preview` 验证
4. **环境变量要分离** - Pages/Workers 环境变量管理不同
5. **React Hydration 要处理好** - SSR 和 CSR 必须一致
6. **CSS 和字体配置要完整** - Tailwind、PostCSS、字体都要正确

---

**记住：`npm run deploy` 是部署 Cloudflare + Next.js 的黄金法则！** 🏆

