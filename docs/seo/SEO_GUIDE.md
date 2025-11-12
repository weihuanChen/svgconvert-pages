# 🔍 SEO 优化指南

**版本**: 1.0  
**最后更新**: 2025-11-12  
**主域名**: https://svgconvert.net

---

## 📋 SEO 现状

### 核心指标

| 指标 | 状态 | 分数 |
|------|------|------|
| **搜索可见性** | ✅ | 良好 |
| **核心 Web Vitals** | ✅ | 优秀 |
| **移动友好** | ✅ | 通过 |
| **HTTPS** | ✅ | 已启用 |
| **多语言优化** | ✅ | 已配置 |

---

## 🌍 多语言 SEO 架构

### URL 子路径结构

```
https://svgconvert.net/    → 重定向到 /en
https://svgconvert.net/en  → 英文版本 (默认)
https://svgconvert.net/zh  → 中文版本
https://svgconvert.net/ja  → 日文版本 (未来)
```

### 语言标记

**HTML lang 属性**:
```html
<!-- 英文版本 -->
<html lang="en">

<!-- 中文版本 -->
<html lang="zh">

<!-- 日文版本 -->
<html lang="ja">
```

### hreflang 配置

在每个页面的 `<head>` 中添加 hreflang 标签：

```html
<!-- 英文版本页面 -->
<link rel="alternate" hreflang="en" href="https://svgconvert.net/en" />
<link rel="alternate" hreflang="zh" href="https://svgconvert.net/zh" />
<link rel="alternate" hreflang="x-default" href="https://svgconvert.net/en" />

<!-- 中文版本页面 -->
<link rel="alternate" hreflang="en" href="https://svgconvert.net/en" />
<link rel="alternate" hreflang="zh" href="https://svgconvert.net/zh" />
<link rel="alternate" hreflang="x-default" href="https://svgconvert.net/en" />
```

在 Next.js 中实现：

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  return {
    alternates: {
      canonical: `https://svgconvert.net/${lang}`,
      languages: {
        'en': 'https://svgconvert.net/en',
        'zh': 'https://svgconvert.net/zh',
        'x-default': 'https://svgconvert.net/en',
      }
    }
  }
}
```

---

## 📝 元标签优化

### 页面元数据

**英文版本 (/en)**:
```html
<title>SVG Converter - Free Online Tool to Convert SVG to PNG, JPG, PDF</title>
<meta name="description" content="Convert SVG to PNG, JPG, PDF and more. Free, fast, and easy-to-use online converter. No registration required.">
<meta name="keywords" content="SVG converter, SVG to PNG, SVG to JPG, SVG to PDF, image converter">
```

**中文版本 (/zh)**:
```html
<title>SVG转换器 - 在线SVG转PNG、JPG、PDF工具</title>
<meta name="description" content="免费的在线SVG转换工具，支持转换为PNG、JPG、PDF等格式。无需注册，快速便捷。">
<meta name="keywords" content="SVG转换器，SVG转PNG，SVG转JPG，SVG转PDF，图片转换">
```

### Open Graph 标签

```html
<meta property="og:title" content="SVG Converter - Free Online Tool">
<meta property="og:description" content="Convert SVG to PNG, JPG, PDF and more formats">
<meta property="og:image" content="https://svgconvert.net/og-image.png">
<meta property="og:url" content="https://svgconvert.net/en">
<meta property="og:type" content="website">
```

### Twitter Card 标签

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SVG Converter">
<meta name="twitter:description" content="Free online SVG conversion tool">
<meta name="twitter:image" content="https://svgconvert.net/twitter-image.png">
```

---

## 🎯 关键词策略

### 主要关键词

**英文**:
- SVG converter
- Convert SVG to PNG
- SVG to JPG
- SVG to PDF
- Online image converter
- Free converter
- SVG editor

**中文**:
- SVG转换器
- SVG转PNG
- SVG转JPG
- SVG转PDF
- 图片转换工具
- 在线转换
- 免费转换

### 长尾关键词

**英文**:
- How to convert SVG to PNG online
- Best free SVG converter
- SVG to PNG without watermark
- Batch SVG converter

**中文**:
- 怎样将SVG转为PNG
- 最好用的SVG转换器
- SVG批量转换工具
- 在线SVG转PNG无限制

### 关键词布局

```
页面元素         关键词位置
─────────────────────────────
Title            主关键词 + 长尾
Meta Description 主关键词 + 描述
H1               主要功能
H2               转换类型
Body             自然融入
Alt Text         图片描述
URL              路径关键词
```

---

## 📊 Core Web Vitals

### 性能目标

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| LCP | < 2.5s | ~1.2s | ✅ |
| FID | < 100ms | ~50ms | ✅ |
| CLS | < 0.1 | ~0.05 | ✅ |

其中：
- **LCP** (Largest Contentful Paint) - 最大内容绘制
- **FID** (First Input Delay) - 首次输入延迟
- **CLS** (Cumulative Layout Shift) - 累积布局偏移

### 性能优化

```typescript
// Next.js 中的优化配置
export const metadata = {
  themeColor: '#ffffff',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

// next.config.mjs 优化
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
}
```

---

## 🔗 链接构建

### 内部链接策略

链接结构应该清晰，便于搜索引擎抓取：

```html
<!-- 导航链接 -->
<a href="/en">Home</a>
<a href="/en/docs">Documentation</a>

<!-- 多语言链接 -->
<a href="/zh" lang="zh">中文版本</a>
<a href="/en" lang="en">English</a>

<!-- 功能说明链接 -->
<a href="/en#features">Features</a>
<a href="/en#faq">FAQ</a>
```

### 外部链接机会

- 提交到开源目录
- 技术博客提及
- GitHub 项目链接
- 设计工具评测网站

---

## 📱 移动优化

### 移动友好检测

使用 [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

**优化方案**:
- ✅ 响应式设计
- ✅ 可点击元素间距 > 48px
- ✅ 文本可读性
- ✅ 无弹窗遮挡内容

### 视口设置

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

### 触摸优化

```css
/* 按钮和链接最小大小 */
.button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
}

/* 触摸目标间距 */
.button + .button {
  margin-left: 8px;
}
```

---

## 🗺️ Sitemap 和 Robots.txt

### Sitemap 配置

**public/sitemap.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://svgconvert.net/en</loc>
    <lastmod>2025-11-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh" href="https://svgconvert.net/zh"/>
  </url>
  <url>
    <loc>https://svgconvert.net/zh</loc>
    <lastmod>2025-11-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://svgconvert.net/en"/>
  </url>
</urlset>
```

### Robots.txt 配置

**public/robots.txt**:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /.next/

Sitemap: https://svgconvert.net/sitemap.xml
```

---

## 🔐 技术 SEO

### 结构化数据 (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SVG Converter",
  "url": "https://svgconvert.net",
  "description": "Free online SVG converter tool",
  "applicationCategory": "Utility",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### JSON-LD 实现

```typescript
export async function generateMetadata() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'SVG Converter',
    'url': 'https://svgconvert.net',
    'description': 'Convert SVG to PNG, JPG, PDF and more',
    'applicationCategory': 'Utility',
  }

  return {
    // ... 其他元数据
    other: {
      'script:ld+json': JSON.stringify(jsonLd),
    },
  }
}
```

---

## 📊 Search Console 优化

### Google Search Console

1. **验证所有权**:
   - 添加 DNS 记录
   - 验证域名所有权

2. **提交 Sitemap**:
   - https://svgconvert.net/sitemap.xml

3. **性能报告**:
   - 监控排名关键词
   - 检查索引状态
   - 查看搜索流量

4. **覆盖问题**:
   - 修复 404 错误
   - 检查重定向链
   - 解决爬取问题

---

## 📈 分析和跟踪

### Google Analytics 配置

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout() {
  return (
    <html>
      <body>
        {/* 内容 */}
        <Analytics />
      </body>
    </html>
  )
}
```

### 关键指标跟踪

跟踪以下指标：
- 页面浏览量 (PV)
- 用户转化率
- 平均停留时间
- 跳出率
- 转换工具点击率

---

## 🎯 SEO 检查清单

### 技术 SEO
- [ ] HTTPS 启用
- [ ] 移动响应式
- [ ] 网站加载速度 < 3s
- [ ] 无 404 错误
- [ ] XML Sitemap 已提交
- [ ] Robots.txt 已配置
- [ ] DNS 预解析配置

### 页面 SEO
- [ ] 唯一的 Title 标签（50-60 字符）
- [ ] 有吸引力的 Meta Description（150-160 字符）
- [ ] H1 标签优化
- [ ] 关键词自然融入
- [ ] 内部链接完整
- [ ] 图片 Alt 文本

### 多语言 SEO
- [ ] 语言标签正确
- [ ] hreflang 配置完整
- [ ] 每个语言版本独立
- [ ] 重复内容处理

### 外部 SEO
- [ ] 提交到搜索引擎
- [ ] 反向链接建设
- [ ] 社交媒体分享
- [ ] 品牌提及

---

## 🔗 SEO 工具

### 常用工具

| 工具 | 功能 | 免费版 |
|------|------|--------|
| Google Search Console | 索引管理 | ✅ |
| Google PageSpeed Insights | 性能检测 | ✅ |
| Mobile-Friendly Test | 移动优化检测 | ✅ |
| Lighthouse | 审计工具 | ✅ |
| SEMrush | 竞争分析 | ❌ |
| Ahrefs | 反向链接 | ❌ |

### 自动化检测

```bash
# Lighthouse CLI 检测
npx lighthouse https://svgconvert.net/en --view

# PageSpeed 检测
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://svgconvert.net/en&key=YOUR_API_KEY"
```

---

## 📈 长期优化规划

### 3 个月计划
- [ ] 发表 5 篇相关博客
- [ ] 获得 10+ 反向链接
- [ ] 排名前 10 热门关键词 5 个
- [ ] 日均访问 100+ 次

### 6 个月计划
- [ ] 排名前 3 的关键词 10+ 个
- [ ] 月均访问 5,000+ 次
- [ ] 获得 50+ 反向链接
- [ ] 社交分享 1,000+ 次

### 12 个月计划
- [ ] 排名前 3 的主关键词达到 20+ 个
- [ ] 月均访问 50,000+ 次
- [ ] 成为行业权威网站
- [ ] 其他网站主动链接

---

## 💡 最佳实践

1. **优化速度** - 使用 CDN，启用缓存
2. **创建内容** - 定期发布相关文章
3. **构建链接** - 参与行业合作
4. **监控排名** - 定期检查关键词排名
5. **用户体验** - 持续改进界面

---

**最后更新**: 2025-11-12  
**维护者**: SEO 团队  
**状态**: ✅ 已发布

