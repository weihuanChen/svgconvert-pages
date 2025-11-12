# 🏗️ SVG Converter - 架构设计文档

**版本**: 1.0  
**最后更新**: 2025-11-12  
**项目**: SVG Converter Web Application

---

## 📐 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                  Cloudflare Edge                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Cloudflare Workers (svgconvert.net)       │  │
│  │                                                    │  │
│  │  ├─ 静态资源路由 → R2 Storage                     │  │
│  │  ├─ API 转发 → VPS 后端                           │  │
│  │  └─ 缓存管理                                      │  │
│  └──────────────┬──────────────────────────────────┘  │
└─────────────────┼──────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌──────────┐         ┌──────────────────┐
   │ R2 Storage       │ VPS Backend       │
   │ (CDN Cache)      │ (svgconvert-     │
   │ - HTML           │  server.zeabur)  │
   │ - CSS/JS         │                   │
   │ - Assets         │ - SVG Processing  │
   │                  │ - File Convert    │
   │                  │ - i18n Support    │
   └──────────┘       └──────────────────┘
```

---

## 🎯 核心组件

### 1. 前端应用（Cloudflare Workers）

**技术栈**:
- Next.js 16.0.0
- React 19.2.0
- TypeScript
- Tailwind CSS 4.1.9
- Radix UI

**职责**:
- 用户界面渲染
- 文件上传前端处理
- API 调用代理
- 国际化支持（i18n）
- 主题管理

**关键文件**:
```
app/
├── layout.tsx              # 根布局
├── i18n.ts                 # 国际化配置
├── middleware.ts           # 路由中间件
└── [lang]/
    ├── layout.tsx          # 语言级布局
    └── page.tsx            # 主页面
```

### 2. 后端服务（VPS）

**地址**: https://svgconvert-server.zeabur.app/

**技术栈**:
- Node.js 后端服务
- SVG 处理库（sharp, svgexport 等）
- 文件系统 API
- RESTful API

**职责**:
- 接收文件上传
- 执行格式转换
- 管理转换任务队列
- 提供文件下载
- 多语言错误消息

**核心端点**:
```
POST   /api/upload          # 上传并启动转换
GET    /api/status/:taskId  # 查询转换状态
GET    /api/download/:taskId # 下载转换文件
DELETE /api/cleanup/:taskId  # 清理过期文件
```

### 3. 存储层（R2 + VPS）

**R2 存储**:
- 所有前端资源
- CSS/JS bundles
- 字体文件
- 图片资源

**VPS 存储**:
- 临时上传文件
- 转换中间文件
- 转换输出文件
- 自动清理逻辑

---

## 🌐 国际化架构

### 支持的语言

| 语言 | 代码 | 状态 | 优先级 |
|------|------|------|--------|
| English | `en` | ✅ | 默认 |
| 中文 | `zh` | ✅ | 高 |
| 日本語 | `ja` | ⏳ | 计划中 |

### 多语言 URL 结构

```
/en/              # 英文版本
/zh/              # 中文版本
/                 # 自动重定向到 /en
```

### i18n 实现

**翻译配置** (`app/i18n.ts`):

```typescript
export type Locale = 'en' | 'zh'

export const locales: Locale[] = ['en', 'zh']

export const translations = {
  en: { /* 英文翻译 */ },
  zh: { /* 中文翻译 */ }
}

export function getTranslation(locale: Locale) {
  return translations[locale] || translations.en
}
```

**使用方式**:

```typescript
// 在服务端组件中
const t = getTranslation(lang)

// 在页面中
<h1>{t.title}</h1>
```

---

## 📊 数据流

### 文件转换流程

```
┌─────────────────────┐
│  用户上传文件       │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│ 前端表单处理          │
│ - 文件验证           │
│ - 参数收集           │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ POST /api/upload         │
│ (Cloudflare Worker)      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ VPS 后端处理             │
│ - 保存上传文件           │
│ - 启动转换任务           │
│ - 返回 taskId            │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 轮询 GET /api/status     │
│ - 查询转换进度           │
│ - 等待完成               │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 转换完成                 │
│ - 生成输出文件           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ GET /api/download        │
│ - 下载转换文件           │
└──────────┬───────────────┘
           │
           ▼
┌─────────────────────────┐
│  用户获得文件            │
└─────────────────────────┘
```

### API 调用流程

```
前端 Request
    ↓
middleware.ts (检查语言)
    ↓
[lang]/page.tsx (渲染)
    ↓
app/api/[...route]/route.ts (代理)
    ↓
VPS Backend API
    ↓
返回响应
    ↓
前端更新 UI
```

---

## 🔧 开发指南

### 项目结构

```
svgconvert.net/
│
├── app/                          # Next.js 应用
│   ├── layout.tsx               # 根布局
│   ├── i18n.ts                  # 国际化配置
│   ├── middleware.ts            # 路由中间件
│   ├── globals.css              # 全局样式
│   └── [lang]/                  # 动态语言路由
│       ├── layout.tsx           # 语言级布局
│       └── page.tsx             # 主页面
│
├── components/                   # React 组件
│   ├── theme-provider.tsx       # 主题提供器
│   └── ui/                      # Shadcn UI 组件
│
├── lib/                          # 工具函数
│   └── utils.ts                 # 通用工具
│
├── public/                       # 静态资源
│   └── *.svg, *.ico             # 图片和图标
│
├── docs/                         # 文档
│   ├── testing/                 # 测试文档
│   ├── deployment/              # 部署文档
│   ├── development/             # 开发文档
│   ├── product/                 # 产品文档
│   └── seo/                     # SEO 文档
│
├── next.config.mjs              # Next.js 配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.ts           # Tailwind CSS 配置
├── postcss.config.mjs           # PostCSS 配置
├── wrangler.jsonc               # Cloudflare 配置
└── package.json                 # 项目依赖
```

### 环境变量

**开发环境** (`.dev.vars`):
```
NEXTJS_ENV=development
VPS_API_BASE=http://localhost:3001
```

**生产环境** (`wrangler.jsonc` env.production):
```json
{
  "vars": {
    "ENVIRONMENT": "production",
    "VPS_API_BASE": "https://svgconvert-server.zeabur.app"
  }
}
```

### 开发工作流

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 本地开发（Next.js dev server）
npm run dev
# 访问 http://localhost:3000

# 3. 本地预览（Worker 环境）
npm run preview
# 访问 http://localhost:8787

# 4. 生产构建
npm run build

# 5. 部署到 Cloudflare
npm run deploy
```

---

## 🎨 前端组件架构

### 页面组件

**app/[lang]/page.tsx**:
- 主页容器
- 文件上传区域
- 转换参数面板
- 结果展示区
- 语言选择器

### UI 组件

使用 Shadcn UI 组件库：
- `Button` - 按钮
- `Select` - 下拉选择
- `Slider` - 滑块
- `Label` - 标签
- `Switch` - 开关
- `Accordion` - 手风琴

### 样式系统

- **Tailwind CSS** - 原子化 CSS 框架
- **CSS Modules** 支持
- **Dark Mode** - 亮暗主题切换
- **响应式设计** - Mobile First

---

## 🔒 安全考虑

### 文件上传安全

- ✅ 文件类型验证（MIME type）
- ✅ 文件大小限制（20MB）
- ✅ 文件清理（自动删除过期文件）
- ✅ 扫描恶意代码

### API 安全

- ✅ CORS 配置正确
- ✅ 请求验证
- ✅ 速率限制（预计划）
- ✅ 错误消息不泄露敏感信息

### 数据隐私

- ✅ HTTPS 加密传输
- ✅ 文件自动清理
- ✅ 无文件持久化
- ✅ 符合 GDPR 要求

---

## 📈 性能优化

### 前端优化

- ✅ 代码分割（Code Splitting）
- ✅ 静态生成（SSG）
- ✅ 图片优化
- ✅ CSS 最小化
- ✅ JS 压缩

### 缓存策略

```
静态资源 (CSS/JS)    → max-age=31536000 (1年)
API 响应             → no-cache
HTML 文件            → max-age=3600 (1小时)
```

### CDN 加速

- ✅ Cloudflare 全球 CDN
- ✅ 自动缓存
- ✅ 边界计算（Workers）
- ✅ DDoS 防护

---

## 🧪 测试策略

### 单元测试

- 组件测试（Jest + React Testing Library）
- 工具函数测试
- i18n 测试

### 集成测试

- API 代理测试
- 后端连接测试
- 完整流程测试

### E2E 测试

- 用户界面测试（Playwright）
- 文件转换端到端
- 多语言切换

---

## 📚 技术栈总结

| 层 | 技术 | 版本 |
|-------|------|--------|
| **前端框架** | Next.js | 16.0.0 |
| **运行时** | React | 19.2.0 |
| **样式** | Tailwind CSS | 4.1.9 |
| **UI 组件** | Radix UI | Latest |
| **类型系统** | TypeScript | ^5 |
| **部署** | Cloudflare Workers | Latest |
| **后端** | Node.js | 18+ |
| **存储** | R2 + VPS | - |

---

## 🔄 扩展指南

### 添加新语言

编辑 `app/i18n.ts`:

```typescript
// 1. 添加语言类型
export type Locale = 'en' | 'zh' | 'ja'

// 2. 添加到列表
export const locales = ['en', 'zh', 'ja']

// 3. 添加翻译
export const translations = {
  // ...
  ja: { /* 日文翻译 */ }
}
```

### 添加新的 API 端点

创建 `app/api/new-endpoint/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // 实现逻辑
  return NextResponse.json({})
}
```

### 修改转换参数

编辑 `[lang]/page.tsx` 中的参数表单，并在后端实现相应处理。

---

## 💡 最佳实践

1. **类型安全** - 使用 TypeScript 类型注解
2. **组件复用** - 使用 Shadcn UI 组件
3. **i18n 集中管理** - 所有翻译在 `i18n.ts`
4. **环境变量** - 使用 `.dev.vars` 和 `wrangler.jsonc`
5. **错误处理** - 为所有 API 调用提供错误处理
6. **性能监控** - 使用 Cloudflare Analytics

---

**最后更新**: 2025-11-12  
**维护者**: 开发团队  
**状态**: ✅ 生产就绪

