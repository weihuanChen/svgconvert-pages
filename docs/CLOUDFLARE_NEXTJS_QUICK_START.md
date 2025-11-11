# Cloudflare + Next.js 快速启动指南

## 🎯 核心要点（必读）

### Pages vs Workers 区别

| 特性 | Cloudflare Pages | Cloudflare Workers |
|------|-----------------|------------------|
| **代码来源** | GitHub 自动推送 | 本地 CLI 部署 |
| **识别方式** | 需要 `index.html` | 需要 `worker.js` |
| **Next.js 支持** | ❌ 有限 | ✅ 完全支持 |
| **默认识别** | GitHub 推送触发 | CLI 显式部署 |

### 📌 关键决策

```
🚨 GitHub 推送 → Pages → ❌ 404 错误
✅ npm run deploy → Workers → ✅ 正常运行
```

**永远记住：用 CLI deploy，不要依赖 GitHub 自动推送！**

---

## ⚡ 5 分钟快速配置

### 第 1 步：安装依赖
```bash
npm install @opennextjs/cloudflare
npm install --save-dev wrangler@3.99.0
```

### 第 2 步：创建 4 个文件

**wrangler.jsonc**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "my-app",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "my-app"
    }
  ]
}
```

**open-next.config.ts**
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig({});
```

**.dev.vars**
```
NEXTJS_ENV=development
```

**public/_headers**
```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

### 第 3 步：更新 package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
```

### 第 4 步：修复 Layout
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### 第 5 步：部署
```bash
npm run deploy
```

完成！✅

---

## 🔥 常见错误及快速修复

### 错误 1：部署后显示 404

```
❌ 问题: GitHub 推送后 404
✅ 原因: 被识别为 Pages，不是 Workers
✅ 修复: npm run deploy
```

### 错误 2：React Hydration 错误

```
❌ 问题: "Hydration failed"
✅ 原因: SSR 和 CSR 不匹配
✅ 修复: 
  - 移除 if (typeof window !== 'undefined')
  - 使用 useMemo 而不是 useEffect 处理 params
  - 避免 Date.now() 等随机函数
```

### 错误 3：CSS 不显示

```
❌ 问题: 没有样式
✅ 原因: 缺少 tailwind.config.ts
✅ 修复: 创建 tailwind.config.ts，确保 globals.css 被导入
```

### 错误 4：构建超时

```
❌ 问题: 构建失败
✅ 原因: .open-next 太大或缓存问题
✅ 修复: 
  rm -rf .open-next .next
  npm run deploy
```

---

## 📋 部署前检查清单

- [ ] `wrangler.jsonc` ✓
- [ ] `open-next.config.ts` ✓
- [ ] `.dev.vars` ✓
- [ ] `public/_headers` ✓
- [ ] `package.json` 脚本 ✓
- [ ] `app/layout.tsx` 结构正确 ✓
- [ ] 没有 Hydration 错误 ✓
- [ ] `npm run preview` 成功 ✓
- [ ] `.gitignore` 包含 `.open-next` ✓
- [ ] `npm run deploy` 完成 ✓

---

## 🚀 部署流程

```bash
# 1. 开发
npm run dev

# 2. 本地预览（Workers 环境）
npm run preview

# 3. 部署（关键步骤！）
npm run deploy

# ✅ 完成！查看输出的 URL
# https://my-app.my-username.workers.dev
```

---

## 🎓 为什么要这样做？

### Pages 的限制
- 寻找 `index.html` 作为入口
- Next.js 不输出这个
- 导致 404

### Workers 的优势
- OpenNext 生成 Worker 兼容的代码
- Cloudflare 正确识别和运行
- 支持所有 Next.js 功能

### CLI Deploy 的好处
- 绕过 Pages 识别
- 直接部署到 Workers
- 本地构建，更快部署

---

## 💬 常见问题

**Q: 为什么不能用 GitHub 自动部署？**
A: GitHub 推送被 Cloudflare 识别为 Pages，而 Pages 需要静态文件入口。使用 `npm run deploy` 可以正确部署到 Workers。

**Q: `npm run preview` 有什么用？**
A: 在本地 Workers 环境下测试应用，可以提前发现问题。

**Q: 部署后还能从 GitHub 更新吗？**
A: 可以，但需要重新运行 `npm run deploy`。如果要自动化，可以使用 GitHub Actions。

**Q: 环境变量怎么设置？**
A: 在 `wrangler.jsonc` 的 `env` 部分配置，或使用 Cloudflare 控制面板。

---

## 📚 完整指南

更详细的信息请参考：
👉 [CLOUDFLARE_NEXTJS_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_NEXTJS_DEPLOYMENT_GUIDE.md)

---

## ✨ 总结

```
Pages (GitHub) ❌ → 404
Workers (CLI)  ✅ → 🎉

记住：npm run deploy 是救星！
```

祝部署顺利！🚀

