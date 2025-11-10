# 多语言架构说明 (i18n Architecture)

## 概述

本项目已从简单的客户端语言选择器改造为使用 **语言子路径 (Language Subdirectory)** 的架构，这是一种标准的 Next.js 多语言实现方式。

## URL 结构

### 新架构 (当前)

```
/en/           - 英文版本（默认）
/zh/           - 中文版本
/              - 自动重定向到 /en/
```

### 旧架构

之前使用客户端语言选择器 (dropdown)，需要手动切换语言。

## 文件结构

```
app/
├── layout.tsx                 # 根 layout（简单包装）
├── [lang]/
│   ├── layout.tsx            # 语言级别 layout（处理语言参数）
│   └── page.tsx              # 主页（接收语言参数）
├── globals.css               # 全局样式
└── i18n.ts                   # i18n 配置和翻译

middleware.ts                  # 中间件（处理根路径重定向）
```

## 核心特性

### 1. 动态路由参数

- 使用 Next.js 13+ 的 `[lang]` 动态路由参数
- 自动在 URL 中传递语言代码

### 2. 静态生成

```typescript
export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}
```

- 在构建时预生成所有语言版本的页面
- 支持 `/en` 和 `/zh` 两个版本

### 3. 中间件重定向

**middleware.ts** 处理：
- 根路径 (`/`) → 重定向到 `/en` (默认语言)
- 非有效语言的路径 → 重定向到默认语言
- 有效语言路径 → 正常流程

### 4. i18n 配置 (i18n.ts)

```typescript
export type Locale = 'en' | 'zh'

export const locales: Locale[] = ['en', 'zh']
export const defaultLocale: Locale = 'en'

export const translations = {
  en: { /* 英文翻译 */ },
  zh: { /* 中文翻译 */ }
}

export function getTranslation(locale: Locale) {
  return translations[locale]
}
```

## 在页面中使用

### 获取当前语言

```typescript
interface PageProps {
  params: Promise<{ lang: string }>
}

export default function Page({ params }: PageProps) {
  const { lang } = await params as { lang: Locale }
  const t = getTranslation(lang)
  
  // 使用 t.title, t.subtitle 等
}
```

### 客户端切换语言

```typescript
'use client'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const router = useRouter()
  
  const handleLanguageChange = (newLang: string) => {
    router.push(`/${newLang}`)
  }
  
  return (
    <select onChange={(e) => handleLanguageChange(e.target.value)}>
      <option value="en">EN</option>
      <option value="zh">ZH</option>
    </select>
  )
}
```

## 优势

### 1. SEO 友好
- 每个语言版本都有独立的 URL
- 搜索引擎可以正确索引多语言内容
- 支持 `hreflang` 标签（可选）

### 2. 性能优化
- 静态生成所有语言版本
- 预加载字体和资源
- 更好的缓存策略

### 3. 用户体验
- 清晰的 URL 结构
- 可分享的语言特定链接
- 浏览器历史记录支持正确的语言

### 4. 开发体验
- 类型安全（TypeScript）
- 集中化翻译管理
- 易于添加新语言

## 添加新语言

1. 更新 `app/i18n.ts`：

```typescript
export type Locale = 'en' | 'zh' | 'fr'  // 添加新语言代码

export const locales: Locale[] = ['en', 'zh', 'fr']

export const translations = {
  en: { /* ... */ },
  zh: { /* ... */ },
  fr: {  // 添加法语翻译
    title: "Outil de conversion SVG",
    // ... 更多翻译
  }
}
```

2. 重新构建项目
   - 新语言页面将被自动生成

## 环境变量

无需特殊的环境变量配置。所有设置都在 `i18n.ts` 中。

## 部署

### Vercel

```bash
# 自动检测到静态生成
npm run build
npm run start
```

页面被自动预生成为静态 HTML，无需特殊配置。

### 其他平台

确保支持静态路由和中间件（Middleware）功能。

## 测试

### 本地测试

```bash
# 开发模式
npm run dev

# 访问
http://localhost:3000/en   # 英文
http://localhost:3000/zh   # 中文
http://localhost:3000      # 自动重定向到 /en
```

### 生产测试

```bash
npm run build
npm run start
```

## 常见问题

### Q: 如何改变默认语言？

A: 在 `app/i18n.ts` 中修改 `defaultLocale`：
```typescript
export const defaultLocale: Locale = 'zh'  // 改为中文默认
```

然后更新 `middleware.ts` 中的对应值。

### Q: 如何在服务端获取语言？

A: 通过 `params` prop：
```typescript
export default function Page({ params }: { params: Promise<{ lang: string }> }) {
  // params 是一个 Promise，在 Next.js 15 中需要 await
}
```

### Q: URL 重定向何时发生？

A: 在 middleware 阶段（请求进入应用之前）。

## 迁移注意事项

从旧的客户端选择器到新的 URL 子路径架构的变更：

1. ✅ 所有链接必须包含语言前缀
2. ✅ 书签/收藏需要更新
3. ✅ 分享的链接现在包含语言信息
4. ✅ SEO 改进（独立语言页面）
5. ✅ 无需客户端 JavaScript 来处理语言切换

## 参考

- [Next.js 国际化文档](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js 动态路由](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

