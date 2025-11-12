# 🌐 国际化（i18n）开发指南

**版本**: 1.0  
**最后更新**: 2025-11-12  
**支持语言**: English (en), 中文 (zh), 日本語 (ja - 计划中)

---

## 📋 概述

SVG Converter 采用 **URL 子路径多语言架构**，支持：
- ✅ `/en/` - 英文版本
- ✅ `/zh/` - 中文版本
- ⏳ `/ja/` - 日文版本（计划中）

所有翻译集中管理在 `app/i18n.ts`。

---

## 🔧 核心实现

### 1. i18n 配置文件 (`app/i18n.ts`)

```typescript
export type Locale = 'en' | 'zh'

export const locales: Locale[] = ['en', 'zh']
export const defaultLocale: Locale = 'en'

export const translations = {
  en: {
    title: "SVG Converter",
    subtitle: "Fast. Free. No limit.",
    // ... 更多翻译
  },
  zh: {
    title: "SVG 转换器",
    subtitle: "快速。免费。无限制。",
    // ... 更多翻译
  }
}

export function getTranslation(locale: Locale) {
  return translations[locale] || translations[defaultLocale]
}
```

### 2. 中间件 (`middleware.ts`)

处理根路径重定向：

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 检查是否已有语言前缀
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
```

### 3. 动态路由 (`app/[lang]/layout.tsx`)

```typescript
import { locales } from '@/app/i18n'

export async function generateStaticParams() {
  return locales.map((lang) => ({
    lang,
  }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  )
}
```

### 4. 页面组件 (`app/[lang]/page.tsx`)

```typescript
import { getTranslation, Locale } from '@/app/i18n'

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const t = getTranslation(lang as Locale)
  
  return (
    <div>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  )
}
```

---

## 🌍 URL 路由

### 访问模式

| URL | 语言 | 效果 |
|-----|------|------|
| `/` | EN | 自动重定向到 `/en` |
| `/en` | EN | 英文版本 |
| `/zh` | ZH | 中文版本 |
| `/en/...` | EN | 英文子页面 |
| `/zh/...` | ZH | 中文子页面 |

### 路由匹配

```
访问 /zh/about
  ↓
[lang]/page.tsx 匹配 lang='zh'
  ↓
getTranslation('zh') 获取中文翻译
  ↓
渲染中文页面
```

---

## 📝 翻译管理

### 翻译结构示例

```typescript
export const translations = {
  en: {
    // 页面标题
    title: "SVG Converter",
    subtitle: "Convert SVG to PNG, JPG, PDF and more",
    
    // 按钮和操作
    buttons: {
      upload: "Upload File",
      convert: "Start Conversion",
      download: "Download",
      cancel: "Cancel",
    },
    
    // 表单标签
    labels: {
      format: "Output Format",
      quality: "Quality",
      width: "Width",
      height: "Height",
      backgroundColor: "Background Color",
    },
    
    // 消息和提示
    messages: {
      uploading: "Uploading...",
      converting: "Converting...",
      completed: "Conversion completed!",
      error: "An error occurred",
    },
    
    // 错误信息
    errors: {
      fileToLarge: "File size exceeds 20MB",
      invalidFormat: "Invalid file format",
      uploadFailed: "Upload failed",
    }
  },
  
  zh: {
    // 相同的结构，中文翻译
    title: "SVG 转换器",
    subtitle: "将 SVG 转换为 PNG、JPG、PDF 等格式",
    
    buttons: {
      upload: "上传文件",
      convert: "开始转换",
      download: "下载",
      cancel: "取消",
    },
    
    // ... 更多中文翻译
  }
}
```

### 翻译最佳实践

1. **分组组织** - 按功能分组翻译
2. **一致性** - 使用相同的术语
3. **简洁性** - 避免过长的翻译
4. **上下文** - 保留足够的信息
5. **格式一致** - 标点符号、大小写保持一致

---

## 🔄 添加新语言

### 步骤 1：编辑 `app/i18n.ts`

```typescript
// 1. 添加语言类型
export type Locale = 'en' | 'zh' | 'ja'

// 2. 添加到支持列表
export const locales: Locale[] = ['en', 'zh', 'ja']

// 3. 添加翻译
export const translations = {
  en: { /* ... */ },
  zh: { /* ... */ },
  ja: {  // 新增日语
    title: "SVG 変換ツール",
    subtitle: "高速。無料。手数料なし。",
    buttons: {
      upload: "ファイルをアップロード",
      convert: "変換を開始",
      download: "ダウンロード",
      cancel: "キャンセル",
    },
    // ... 更多日文翻译
  }
}
```

### 步骤 2：重新构建

```bash
npm run build
# 自动生成 /ja 页面
```

### 步骤 3：验证

访问 `http://localhost:3000/ja` 检查日文页面。

---

## 💡 使用示例

### 在服务端组件中使用

```typescript
// app/[lang]/page.tsx
import { getTranslation, Locale } from '@/app/i18n'

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const t = getTranslation(lang as Locale)
  
  return (
    <div>
      <h1>{t.title}</h1>
      <button>{t.buttons.upload}</button>
      <p>{t.messages.uploading}</p>
    </div>
  )
}
```

### 在客户端组件中使用

```typescript
'use client'

import { getTranslation, Locale } from '@/app/i18n'
import { useParams } from 'next/navigation'

export function UploadButton() {
  const params = useParams<{ lang: string }>()
  const t = getTranslation(params.lang as Locale)
  
  return <button>{t.buttons.upload}</button>
}
```

### 在 TypeScript 中使用

```typescript
type TranslationKey = keyof typeof translations.en

function formatMessage(key: TranslationKey, lang: Locale) {
  return getTranslation(lang)[key]
}
```

---

## 🎨 语言选择器组件

### 基础实现

```typescript
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { locales } from '@/app/i18n'

export function LanguageSwitcher() {
  const params = useParams<{ lang: string }>()
  const currentLang = params.lang
  
  return (
    <div className="flex gap-2">
      {locales.map((lang) => (
        <Link
          key={lang}
          href={`/${lang}`}
          className={currentLang === lang ? 'font-bold' : ''}
        >
          {lang.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
```

### 在页面中使用

```typescript
import { LanguageSwitcher } from '@/components/language-switcher'

export default function Layout() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  )
}
```

---

## 🔍 SEO 优化

### 每个语言版本都是独立的页面

```
/en/     ← 独立索引
/zh/     ← 独立索引
```

### 设置 hreflang 标签

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  return {
    alternates: {
      languages: {
        en: 'https://svgconvert.net/en',
        zh: 'https://svgconvert.net/zh',
      }
    }
  }
}
```

### 每个页面设置正确的 lang 属性

```typescript
<html lang={lang}>
  {/* 页面内容 */}
</html>
```

---

## 🧪 测试 i18n

### 手动测试

```bash
# 开发模式
npm run dev

# 访问不同语言版本
# 英文: http://localhost:3000/en
# 中文: http://localhost:3000/zh

# 测试根路径重定向
# http://localhost:3000 → 应重定向到 /en
```

### 验证清单

- [ ] 访问 `/en` 显示英文
- [ ] 访问 `/zh` 显示中文
- [ ] 访问 `/` 自动重定向到 `/en`
- [ ] 语言选择器正常工作
- [ ] 所有翻译显示正确
- [ ] 特殊字符正确显示
- [ ] 响应式设计在各语言下都正常

---

## 📊 翻译覆盖检查

创建脚本检查翻译完整性：

```typescript
// scripts/check-i18n.ts
import { translations, locales } from '@/app/i18n'

function checkTranslations() {
  const enKeys = Object.keys(translations.en).sort()
  
  locales.forEach((lang) => {
    if (lang === 'en') return
    
    const langKeys = Object.keys(translations[lang]).sort()
    const missing = enKeys.filter((key) => !langKeys.includes(key))
    
    if (missing.length > 0) {
      console.warn(`Missing translations in ${lang}:`, missing)
    }
  })
}

checkTranslations()
```

运行检查：

```bash
npx ts-node scripts/check-i18n.ts
```

---

## 🔗 API 国际化

### 发送语言到后端

```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Accept-Language': lang, // 传递语言信息
  },
})
```

### 后端返回本地化消息

后端应根据 `Accept-Language` 返回相应语言的错误消息。

---

## 📚 完整翻译检查表

翻译需要包含的所有部分：

- [ ] 页面标题和副标题
- [ ] 所有按钮文本
- [ ] 表单标签
- [ ] 占位符文本
- [ ] 帮助提示
- [ ] 成功消息
- [ ] 错误消息
- [ ] 加载状态
- [ ] 空状态提示
- [ ] 菜单项
- [ ] 对话框内容

---

## 💾 性能考虑

### 构建时翻译注入

所有翻译在构建时注入，运行时无需加载额外资源。

### 优点

- ✅ 零运行时开销
- ✅ 最小化 bundle size
- ✅ 无需客户端翻译库
- ✅ SSG 友好

### 缺点

- ❌ 添加新语言需要重新构建
- ❌ 不支持动态翻译加载

---

## 🚀 生产部署

### 部署前检查

- [ ] 所有语言翻译完整
- [ ] 本地测试通过
- [ ] 构建无错误
- [ ] SEO 标签正确
- [ ] 性能指标正常

### 部署命令

```bash
npm run build
npm run deploy
```

---

## 📖 参考资源

- [Next.js 国际化指南](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**最后更新**: 2025-11-12  
**维护者**: 开发团队  
**状态**: ✅ 完整

