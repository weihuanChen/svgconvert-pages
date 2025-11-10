# 多语言架构迁移指南

## 项目改造总结

本项目已成功从**客户端语言切换**改造为**URL 子路径多语言架构**。

## 核心改变

### 1. URL 结构变化

**之前：**
```
/ 
  ↓ 使用 JavaScript 在客户端切换语言 (ZH/EN dropdown)
```

**现在：**
```
/en/    - 英文版本
/zh/    - 中文版本
/       - 自动重定向到 /en/
```

### 2. 文件结构变化

**新增文件：**
- ✨ `app/i18n.ts` - 国际化配置和翻译
- ✨ `app/[lang]/layout.tsx` - 语言级别布局
- ✨ `app/[lang]/page.tsx` - 主页（接收语言参数）
- ✨ `middleware.ts` - 中间件处理重定向
- ✨ `I18N_ARCHITECTURE.md` - 完整架构文档

**删除文件：**
- ❌ `app/page.tsx` (已移至 `app/[lang]/page.tsx`)

**修改文件：**
- 📝 `app/layout.tsx` - 简化为根布局
- 📝 `next.config.mjs` - 移除过时配置

### 3. 语言切换方式变化

**之前：**
```typescript
// 客户端 dropdown 选择器
const [language, setLanguage] = useState("ZH")
// 需要手动管理状态
```

**现在：**
```typescript
// URL 导航
const router = useRouter()
router.push(`/${newLang}`)  // 例如：/en 或 /zh
```

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install --legacy-peer-deps

# 开发模式
npm run dev

# 访问
http://localhost:3000/en   # 英文
http://localhost:3000/zh   # 中文
http://localhost:3000      # 自动跳转到 /en
```

### 生产构建

```bash
# 构建
npm run build

# 启动
npm run start
```

**构建输出说明：**
```
Route (app)
├ ○ /_not-found
└ ● /[lang]
  ├ /en        ← 预生成的英文页面
  └ /zh        ← 预生成的中文页面

ƒ Proxy (Middleware)  ← 处理重定向
```

## 架构组件详解

### 1. i18n.ts - 翻译配置

```typescript
// 定义支持的语言
export type Locale = 'en' | 'zh'
export const locales: Locale[] = ['en', 'zh']
export const defaultLocale: Locale = 'en'

// 集中管理翻译
export const translations = {
  en: { title: "SVG Conversion Tool", ... },
  zh: { title: "SVG 转换工具", ... }
}

// 获取翻译函数
export function getTranslation(locale: Locale) {
  return translations[locale]
}
```

### 2. middleware.ts - 路由中间件

```typescript
// 处理三种情况：
// 1. /en, /zh → 正常通过
// 2. / → 重定向到 /en
// 3. /other → 重定向到 /en/other
```

### 3. app/[lang]/layout.tsx - 语言级布局

```typescript
// 接收动态的语言参数
export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}

// 设置 HTML lang 属性
<html lang={htmlLang} suppressHydrationWarning>
```

### 4. app/[lang]/page.tsx - 主页

```typescript
// 从 params 获取语言
const { lang } = await params
const t = getTranslation(lang as Locale)

// 使用翻译对象
<h1>{t.title}</h1>
```

## 使用场景示例

### 获取当前语言

```typescript
// 在服务端组件
export default async function Page({ params }: PageProps) {
  const lang = (await params).lang as Locale
  const currentLocale = lang || 'en'
}

// 在客户端组件
'use client'
import { useParams } from 'next/navigation'

export default function Component() {
  const params = useParams()
  const lang = params.lang as Locale
}
```

### 生成语言切换链接

```typescript
// 方式1：Select 组件
<select onChange={(e) => router.push(`/${e.target.value}`)}>
  <option value="en">EN</option>
  <option value="zh">ZH</option>
</select>

// 方式2：Link 组件
import Link from 'next/link'
<Link href="/en">English</Link>
<Link href="/zh">中文</Link>
```

### 生成 hreflang 标签（SEO）

```typescript
// 在 layout.tsx 中
export const metadata: Metadata = {
  alternates: {
    languages: {
      'en': 'https://example.com/en',
      'zh': 'https://example.com/zh',
    }
  }
}
```

## 配置调整

### 更改默认语言

编辑 `app/i18n.ts`：
```typescript
export const defaultLocale: Locale = 'zh'  // 改为中文
```

编辑 `middleware.ts`：
```typescript
const defaultLocale = 'zh'  // 同步更改
```

### 添加新语言

1. 编辑 `app/i18n.ts`：
```typescript
export type Locale = 'en' | 'zh' | 'ja'  // 添加日语

export const locales: Locale[] = ['en', 'zh', 'ja']

export const translations = {
  en: { /* ... */ },
  zh: { /* ... */ },
  ja: {  // 添加日语翻译
    title: "SVG 変換ツール",
    // ...
  }
}
```

2. 重新构建：
```bash
npm run build
```

## 性能指标

### 构建结果
- ✅ 两个预生成的语言页面
- ✅ 静态内容（SSG）
- ✅ 中间件处理重定向
- ✅ 建议时间：~5 秒

### 路由统计
```
Route (app)
├ ○ /_not-found           - 未找到页面
├ ● /en                   - 英文（SSG）
├ ● /zh                   - 中文（SSG）
└ ƒ Proxy (Middleware)    - 中间件
```

## SEO 优化

✅ **已实现：**
- 每个语言有独立 URL
- HTML `lang` 属性正确设置
- 支持 hreflang 标签

**建议实现：**
- 在 `layout.tsx` metadata 中添加 `alternates.languages`
- 在 `robots.txt` 中配置语言版本
- 使用 Google Search Console 配置多区域设置

## 常见问题解决

### Q: 页面显示为空？
A: 确保在 layout 中使用了 `suppressHydrationWarning` 并且 `mounted` 状态已设置。

### Q: 语言切换不工作？
A: 检查 `useRouter` 导入是否来自 `'next/navigation'`（不是 `'next/router'`）。

### Q: 构建失败？
A: 确保使用 `npm install --legacy-peer-deps`（vaul 包版本兼容问题）。

### Q: 中文字体显示异常？
A: 检查 Google Fonts 加载是否成功。可考虑使用本地字体。

## 部署检查清单

- [ ] ✅ 本地构建成功
- [ ] ✅ `/en` 和 `/zh` 路由可访问
- [ ] ✅ `/` 重定向到 `/en`
- [ ] ✅ 语言切换导航工作正常
- [ ] ✅ 深层链接（如 `/en/path`）被正确处理
- [ ] ✅ 生产环境测试完成

## 下一步

1. **集成更多功能**
   - 实现实际的 SVG 转换 API
   - 添加文件上传服务
   - 实现用户认证

2. **增强国际化**
   - 添加更多语言支持
   - 使用专业翻译服务
   - 实现 RTL 语言支持（如阿拉伯语）

3. **SEO 优化**
   - 配置 sitemap.xml
   - 设置 canonical URLs
   - 实现结构化数据 (Schema.org)

4. **分析和监控**
   - 集成 Google Analytics 跟踪语言偏好
   - 监控每个语言版本的性能
   - 收集用户语言偏好数据

## 技术栈

- **Next.js 16.0.0** - 框架
- **React 19.2.0** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **Radix UI** - 组件库
- **next-themes** - 主题管理

## 支持和反馈

如有问题或建议，请参考：
- 📖 完整架构文档：`I18N_ARCHITECTURE.md`
- 🔗 Next.js 文档：https://nextjs.org/docs
- 💬 国际化最佳实践：https://nextjs.org/docs/app/building-your-application/routing/internationalization

