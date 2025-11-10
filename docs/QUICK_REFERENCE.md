# 快速参考卡 - 多语言架构

## 🚀 快速开始

```bash
# 安装
npm install --legacy-peer-deps

# 开发
npm run dev
# 访问：http://localhost:3000/en 或 http://localhost:3000/zh

# 构建
npm run build

# 生产
npm run start
```

## 📍 URL 结构

| URL | 说明 |
|-----|------|
| `/` | 重定向到 `/en` |
| `/en` | 英文版本 |
| `/zh` | 中文版本 |

## 📂 关键文件位置

```
app/
├── [lang]/
│   ├── layout.tsx    ← 语言级 layout
│   └── page.tsx      ← 主页（多语言）
├── i18n.ts           ← 翻译配置 ⭐
├── layout.tsx        ← 根 layout
└── globals.css
middleware.ts         ← 重定向处理 ⭐
```

## 🌐 获取翻译

```typescript
import { getTranslation, type Locale } from '@/app/i18n'

// 获取翻译对象
const t = getTranslation('en')

// 使用翻译
<h1>{t.title}</h1>
<p>{t.subtitle}</p>
```

## 🔄 语言切换

```typescript
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const router = useRouter()
  
  const handleSwitch = (lang: string) => {
    router.push(`/${lang}`)
  }
  
  return (
    <button onClick={() => handleSwitch('zh')}>
      切换为中文
    </button>
  )
}
```

## ➕ 添加新语言

### 第1步：编辑 `app/i18n.ts`

```typescript
export type Locale = 'en' | 'zh' | 'ja'  // ➕ 添加

export const locales: Locale[] = ['en', 'zh', 'ja']  // ➕ 添加

export const translations = {
  en: { /* ... */ },
  zh: { /* ... */ },
  ja: {  // ➕ 添加日语
    title: "SVG 変換ツール",
    // ... 其他翻译
  }
}
```

### 第2步：重新构建

```bash
npm run build
# 自动生成 /ja 页面
```

## 🐛 常见问题快速解决

### 问题：`router.push` 不工作
**解决：** 检查导入，必须用 `'next/navigation'` 而非 `'next/router'`
```typescript
import { useRouter } from 'next/navigation'  // ✅ 正确
```

### 问题：构建失败依赖错误
**解决：** 使用 legacy peer deps
```bash
npm install --legacy-peer-deps
```

### 问题：页面显示为空
**解决：** 检查 `mounted` 状态
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

### 问题：中间件警告
**说明：** 这是未来版本的警告，暂时可以忽略

## 📊 构建输出检查

构建成功应该看到：
```
✓ Compiled successfully
✓ Generating static pages (5/5)

Route (app)
├ ○ /_not-found
└ ● /[lang]
  ├ /en     ← 英文
  └ /zh     ← 中文

ƒ Proxy (Middleware)
```

## 🔗 相关文档

| 文档 | 用途 |
|------|------|
| `I18N_ARCHITECTURE.md` | 完整架构说明 |
| `MIGRATION_GUIDE.md` | 详细迁移指南 |
| `TESTING_CHECKLIST.md` | 测试清单 |
| `PROJECT_CHANGES_SUMMARY.md` | 改造总结 |

## ⭐ 最常用命令

```bash
# 安装依赖
npm install --legacy-peer-deps

# 开发
npm run dev

# 构建
npm run build

# 生产运行
npm run start

# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint
```

## 🎯 最常修改的地方

### 1. 添加翻译
编辑 `app/i18n.ts` 中的 `translations` 对象

### 2. 修改默认语言
编辑 `app/i18n.ts` 中的 `defaultLocale`

### 3. 修改路由逻辑
编辑 `middleware.ts`

### 4. 修改页面布局
编辑 `app/[lang]/layout.tsx` 或 `app/[lang]/page.tsx`

## 💡 设计要点

✅ **优点：**
- SEO 友好
- 静态生成，超快
- 支持书签特定语言
- 类型安全
- 易于扩展

❌ **注意事项：**
- 所有链接必须包含语言前缀
- 需要 `--legacy-peer-deps`
- 不能同时用 edge runtime 和 generateStaticParams

## 📈 性能指标

- 编译时间：~5 秒
- 构建页面数：5 个
- 单页加载：< 1 秒
- 支持语言数：可无限扩展

## 🆘 需要帮助？

1. 查看完整文档：`I18N_ARCHITECTURE.md`
2. 查看测试清单：`TESTING_CHECKLIST.md`
3. 查看迁移指南：`MIGRATION_GUIDE.md`
4. 查看 Next.js 官方文档：https://nextjs.org/docs

---

**更新时间：** 2025-11-10  
**状态：** ✅ 完成并验证
