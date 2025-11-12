# 💻 开发文档

本目录包含所有关于项目开发的技术文档。

## 📋 文档列表

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**SVG Converter - 架构设计文档**

- 完整的系统架构图
- 核心组件说明
- 数据流程详解
- 项目文件结构
- 开发工作流指南
- 国际化架构
- 技术栈说明

**阅读时间**: 20 分钟  
**适合**: 后端开发者、架构师、新加入开发者

---

### [I18N_GUIDE.md](./I18N_GUIDE.md)
**国际化（i18n）开发指南**

- i18n 核心实现详解
- URL 路由配置方式
- 翻译管理和更新
- 添加新语言完整步骤
- 实际代码示例
- SEO 优化（hreflang）
- 测试方法

**阅读时间**: 15 分钟  
**适合**: 全栈开发者、前端工程师、i18n 维护者

---

## 🏗️ 项目结构

```
svgconvert.net/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── i18n.ts                 # 国际化配置 🌟
│   ├── middleware.ts           # 路由中间件 🌟
│   └── [lang]/
│       ├── layout.tsx          # 语言级布局
│       └── page.tsx            # 主页面
│
├── components/
│   ├── theme-provider.tsx
│   └── ui/                     # Shadcn UI 组件
│
├── lib/
│   └── utils.ts
│
├── docs/
└── public/
```

---

## 💡 核心概念

### 多语言架构

```
URL: /zh/
  ↓
middleware.ts 检查
  ↓
[lang]/layout.tsx 提取 'zh'
  ↓
getTranslation('zh') 获取中文翻译
  ↓
渲染中文页面
```

### 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| **框架** | Next.js | 16.0.0 |
| **运行时** | React | 19.2.0 |
| **样式** | Tailwind CSS | 4.1.9 |
| **类型** | TypeScript | ^5 |
| **UI** | Radix UI | Latest |
| **部署** | Cloudflare Workers | Latest |

---

## 🚀 开发工作流

### 本地开发

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 3. 在浏览器打开
# http://localhost:3000/en
# http://localhost:3000/zh
```

### 构建和预览

```bash
# 构建项目
npm run build

# Worker 环境本地预览
npm run preview
# 访问 http://localhost:8787

# 生产模式运行
npm run start
```

### 部署

```bash
npm run deploy
```

---

## 📝 添加新功能

### 添加新的 API 端点

1. 创建 `app/api/new-endpoint/route.ts`
2. 实现 GET/POST/PUT/DELETE 方法
3. 确保正确处理 Accept-Language 头
4. 在文档中记录端点

### 添加新组件

1. 创建 `components/NewComponent.tsx`
2. 使用 Shadcn UI 组件库
3. 支持主题切换（亮/暗）
4. 编写 TypeScript 类型

### 修改样式

1. 编辑 `app/globals.css` (全局)
2. 或创建 CSS Module
3. 使用 Tailwind CSS 类名
4. 支持亮/暗主题

---

## 🌐 国际化开发

### 添加新语言

编辑 `app/i18n.ts`:

```typescript
// 1. 添加语言类型
export type Locale = 'en' | 'zh' | 'ja'

// 2. 添加到列表
export const locales = ['en', 'zh', 'ja']

// 3. 添加翻译
export const translations = {
  ja: {
    title: "SVG 変換ツール",
    // ... 更多翻译
  }
}
```

重新构建:
```bash
npm run build
```

### 使用翻译

```typescript
// 获取翻译
const t = getTranslation(lang)

// 在 JSX 中使用
<h1>{t.title}</h1>
<button>{t.buttons.upload}</button>
```

---

## 🧪 开发测试

### 多语言测试

```bash
# 访问不同语言版本
curl http://localhost:3000/en
curl http://localhost:3000/zh

# 测试根路径重定向
curl -i http://localhost:3000/
# 应该重定向到 /en
```

### 类型检查

```bash
# TypeScript 编译检查
npx tsc --noEmit

# ESLint 检查
npm run lint
```

---

## 📊 文件大小和性能

| 部分 | 大小 | 说明 |
|------|------|------|
| app/ | ~200 KB | 应用代码 |
| components/ | ~300 KB | UI 组件 |
| public/ | ~50 KB | 静态资源 |
| node_modules/ | ~500 MB | 依赖包 |

---

## 🔍 常见开发问题

### React Hydration 错误
**原因**: 服务端和客户端渲染不一致  
**解决**: 使用 useMemo 或 useEffect

### TypeScript 类型错误
**原因**: 类型不匹配  
**解决**: 检查类型定义，使用 `as` 类型断言

### CSS 样式冲突
**原因**: Tailwind CSS 冲突  
**解决**: 检查类名，使用 CSS Modules

### i18n 翻译缺失
**原因**: 没有添加对应语言的翻译  
**解决**: 在 i18n.ts 中添加翻译

---

## 🎨 设计系统

### 颜色
- **主色**: 蓝色 (#3b82f6)
- **辅助**: 灰色 (#6b7280)
- **成功**: 绿色 (#10b981)
- **错误**: 红色 (#ef4444)

### 排版
- **标题**: Inter Bold
- **正文**: Inter Regular
- **代码**: Roboto Mono

### 间距
- **基准**: 8px
- **标准**: 16px, 24px, 32px

---

## 🔗 相关资源

- [← 返回文档中心](../README.md)
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

---

## 💡 最佳实践

1. **类型安全** - 使用 TypeScript 完整类型
2. **组件复用** - 使用 Shadcn UI 组件
3. **i18n 集中** - 所有翻译在 i18n.ts
4. **错误处理** - 所有 API 调用都要 try-catch
5. **性能优化** - 使用代码分割和图片优化
6. **可访问性** - 支持键盘导航和屏幕阅读器

---

**最后更新**: 2025-11-12  
**维护者**: 开发团队  
**状态**: ✅ 完整

