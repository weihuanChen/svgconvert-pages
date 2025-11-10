# 多语言架构测试清单

## 本地开发测试

### 前置条件
```bash
npm install --legacy-peer-deps
npm run dev
```

### 1. 路由重定向测试 ✅

- [ ] 访问 `http://localhost:3000/` 
  - **预期：** 自动重定向到 `/en`

- [ ] 访问 `http://localhost:3000/en`
  - **预期：** 显示英文内容
  - **检查：** HTML 的 `lang` 属性为 `en`

- [ ] 访问 `http://localhost:3000/zh`
  - **预期：** 显示中文内容
  - **检查：** HTML 的 `lang` 属性为 `zh`

- [ ] 访问 `http://localhost:3000/invalid-lang`
  - **预期：** 重定向到 `/en/invalid-lang`

### 2. 页面功能测试 ✅

- [ ] 英文页面 `/en`
  - [ ] 标题显示为 "SVG Conversion Tool"
  - [ ] 所有文本为英文
  - [ ] 主题切换按钮工作正常

- [ ] 中文页面 `/zh`
  - [ ] 标题显示为 "SVG 转换工具"
  - [ ] 所有文本为中文
  - [ ] 主题切换按钮工作正常

### 3. 语言切换测试 ✅

- [ ] 在英文页面点击语言选择器
  - [ ] 选择 "ZH"
  - **预期：** 导航到 `/zh`，显示中文内容

- [ ] 在中文页面点击语言选择器
  - [ ] 选择 "EN"
  - **预期：** 导航到 `/en`，显示英文内容

### 4. 文件上传功能测试 ✅

- [ ] 在英文页面上传文件
  - [ ] 拖放 SVG 文件到上传区域
  - **预期：** 文件显示在列表中，状态为 "PENDING"

- [ ] 在中文页面上传文件
  - [ ] 点击"上传文件并开始"按钮选择文件
  - **预期：** 文件显示，所有按钮文本为中文

### 5. 主题切换测试 ✅

- [ ] 在英文页面切换深色/浅色主题
  - [ ] 点击主题按钮（月亮/太阳图标）
  - **预期：** 页面主题切换，语言不变

- [ ] 在中文页面切换主题
  - **预期：** 主题切换成功，中文内容保持

### 6. 浏览器功能测试 ✅

- [ ] 浏览历史
  - [ ] 访问 `/en` 然后切换到 `/zh`
  - [ ] 点击浏览器后退按钮
  - **预期：** 返回到 `/en`，显示英文内容

- [ ] 书签测试
  - [ ] 将 `/en` 和 `/zh` 都加入书签
  - [ ] 稍后打开书签
  - **预期：** 跳转到对应语言版本

- [ ] 共享链接
  - [ ] 在英文页面点击"分享链接"
  - **预期：** 复制 URL 为 `http://localhost:3000/en`
  - [ ] 在中文页面点击"分享链接"
  - **预期：** 复制 URL 为 `http://localhost:3000/zh`

### 7. 响应式设计测试 ✅

- [ ] 桌面视图 (1920x1080)
  - [ ] 所有内容正确显示

- [ ] 平板视图 (768x1024)
  - [ ] 菜单和布局适配

- [ ] 手机视图 (375x667)
  - [ ] 导航可访问
  - [ ] 语言选择器可用

## 构建和部署测试

### 1. 生产构建测试

```bash
# 清理
rm -rf .next

# 构建
npm run build
```

**检查输出：**
```
✓ Compiled successfully
✓ Generating static pages (5/5)

Route (app)
├ ○ /_not-found
└ ● /[lang]
  ├ /en     ← 应该显示 SSG
  └ /zh     ← 应该显示 SSG
```

- [ ] 构建成功完成
- [ ] 没有错误或警告（除了 middleware 弃用警告）
- [ ] 生成了 `/en` 和 `/zh` 两个静态页面

### 2. 生产服务器测试

```bash
npm run start
```

- [ ] 访问 `http://localhost:3000/en`
  - **预期：** 快速加载，显示英文内容

- [ ] 访问 `http://localhost:3000/zh`
  - **预期：** 快速加载，显示中文内容

- [ ] 访问 `http://localhost:3000/`
  - **预期：** 重定向到 `/en`

## 代码检查

### 1. TypeScript 检查

```bash
npx tsc --noEmit
```

- [ ] 没有类型错误

### 2. ESLint 检查

```bash
npm run lint
```

- [ ] 没有关键错误

### 3. 文件结构验证

```
app/
├── [lang]/
│   ├── layout.tsx       ✓ 应该存在
│   └── page.tsx         ✓ 应该存在
├── i18n.ts              ✓ 应该存在
├── layout.tsx           ✓ 应该存在
└── globals.css          ✓ 应该存在

middleware.ts            ✓ 应该存在
next.config.mjs          ✓ 应该存在
```

- [ ] 所有必要文件都存在
- [ ] 旧的 `app/page.tsx` 已删除

## 浏览器开发者工具检查

### Network 标签

- [ ] 访问 `/en`
  - [ ] 主文档是 HTML
  - [ ] 没有 4xx 或 5xx 错误
  - [ ] 资源加载时间 < 2 秒

### Elements 标签

- [ ] 检查 HTML `<html>` 标签
  - [ ] `/en` 时 `lang="en"`
  - [ ] `/zh` 时 `lang="zh"`

### Console 标签

- [ ] 没有 JavaScript 错误
- [ ] 没有警告（除了预期的 Next.js 警告）

## 性能检查

### Lighthouse 审计

```bash
# 使用 Chrome DevTools Lighthouse
# 或者在线工具：https://pagespeed.web.dev/
```

检查项：
- [ ] Performance 分数 > 90
- [ ] Accessibility 分数 > 90
- [ ] Best Practices 分数 > 90
- [ ] SEO 分数 > 90

**特别检查：**
- [ ] 每个语言版本都被正确审计
- [ ] `lang` 属性被识别

## SEO 检查

### 1. 元标签验证

- [ ] 访问 `/en`，查看页面源代码
  - [ ] `<html lang="en">` 存在
  - [ ] `<title>` 包含英文

- [ ] 访问 `/zh`，查看页面源代码
  - [ ] `<html lang="zh">` 存在
  - [ ] `<title>` 包含中文

### 2. 结构化数据（可选）

```bash
# 使用 Google 结构化数据测试工具
# https://search.google.com/structured-data/testing-tool
```

- [ ] 检查是否有错误

## 已知限制

- ⚠️ middleware 警告：建议迁移到 Proxy（Next.js 15+ 特性）
- ⚠️ vaul 包：需要 `--legacy-peer-deps`
- ⚠️ Google Fonts：需要网络连接

## 测试环境清单

### 系统要求
- [ ] Node.js 18+ 安装
- [ ] npm 或 yarn 可用
- [ ] 至少 1GB 空闲磁盘空间

### 测试浏览器
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] 移动浏览器（iOS Safari、Android Chrome）

## 问题排查

### 问题：页面显示为空

**原因：** `mounted` 状态未初始化

**解决方案：**
```typescript
if (!mounted) return null  // 等待客户端挂载

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // ...
}
```

### 问题：语言切换不工作

**原因：** 使用了错误的 `useRouter`

**解决方案：**
```typescript
// ❌ 错误 - 这是 Pages Router 的 API
import { useRouter } from 'next/router'

// ✅ 正确 - 这是 App Router 的 API
import { useRouter } from 'next/navigation'
```

### 问题：构建失败

**原因：** 依赖版本冲突

**解决方案：**
```bash
npm install --legacy-peer-deps
```

### 问题：中间件重定向不工作

**原因：** Matcher 配置不正确

**解决方案：** 检查 `middleware.ts` 的 matcher 配置：
```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icon-.*\\.png).*)',
  ],
}
```

## 最后验证清单

部署前最终检查：

- [ ] ✅ 所有路由测试通过
- [ ] ✅ 构建成功无错误
- [ ] ✅ 生产服务器正常工作
- [ ] ✅ 浏览器开发者工具无错误
- [ ] ✅ 响应式设计在所有设备工作
- [ ] ✅ 语言切换流畅
- [ ] ✅ SEO 配置正确
- [ ] ✅ 文档已更新
- [ ] ✅ 团队成员已知晓改变

## 测试完成

当所有测试通过时，项目可以部署到生产环境！🚀

