# 🚀 手动创建 Cloudflare Pages 项目并部署

## ⚠️ 重要提示

Wrangler CLI 无法直接创建 Pages 项目，**必须通过 Cloudflare 控制面板手动创建**。

---

## 📋 第 1 步：在 Cloudflare 控制面板创建项目

### 1. 访问 Cloudflare 控制面板
```
https://dash.cloudflare.com/
```

### 2. 导航到 Pages
- 点击左侧菜单 **Workers & Pages**
- 选择 **Pages** 标签
- 点击 **Create project** 按钮

### 3. 创建项目
有两种方式：

#### **方式 A：直接上传（推荐）**
- 点击 **Upload assets**
- 输入项目名称：**svg-converter**
- 点击 **Create**
- 在弹出的文件选择器中选择 `.next` 文件夹中的所有文件

#### **方式 B：连接 GitHub（可选）**
- 如果想每次推送代码时自动部署，选择这个选项
- 连接 GitHub 账户
- 选择仓库和分支
- 配置构建命令

---

## 📋 第 2 步：确认项目创建成功

创建后，你应该看到：
- 项目名称：**svg-converter**
- 项目 URL：**svg-converter.pages.dev**
- 部署历史页面

![](https://i.imgur.com/placeholder.png)

---

## 📋 第 3 步：验证部署

```bash
# 验证项目存在
wrangler pages project info
# 应该显示 svg-converter 项目信息

# 查看部署列表
wrangler pages deployment list
```

---

## 📋 第 4 步：设置 Secrets（密钥）

项目创建后，为 Pages 项目设置所需的 secrets：

```bash
# 设置 VPS 回调密钥
wrangler pages secret create VPS_CALLBACK_SECRET
# 输入你的 VPS 回调密钥

# 设置 R2 访问密钥（如需要）
wrangler pages secret create R2_ACCESS_KEY_ID
# 输入你的 R2 Access Key ID

wrangler pages secret create R2_SECRET_ACCESS_KEY
# 输入你的 R2 Secret Access Key

# 验证 Secrets 已创建
wrangler pages secret list
```

---

## 📋 第 5 步：部署应用

### 方式 1：使用 CLI 部署（推荐）

```bash
# 构建项目
npm run build

# 部署到 Pages
wrangler pages deploy .next
```

这会上传 `.next` 目录中的所有内容到已创建的 `svg-converter` 项目。

### 方式 2：通过控制面板部署

- 在 Pages 项目页面
- 点击 **Create a project**
- 选择 **Upload assets**
- 上传 `.next` 文件夹

---

## ✅ 验证部署成功

部署完成后，检查以下内容：

```bash
# 1. 查看最新部署
wrangler pages deployment list

# 2. 查看项目信息
wrangler pages project info

# 3. 访问应用
# https://svg-converter.pages.dev/[lang]
```

你应该能看到：
- ✅ 前端页面加载
- ✅ 语言选择（en, zh, ja）
- ✅ 文件上传功能

---

## 🔒 配置 Secrets 后的验证

```bash
# 验证 Secrets 已设置
wrangler pages secret list

# 输出应该显示：
# VPS_CALLBACK_SECRET
# R2_ACCESS_KEY_ID
# R2_SECRET_ACCESS_KEY
```

---

## 🔄 后续更新部署

一旦项目创建完成，后续更新很简单：

```bash
# 1. 修改代码
git add .
git commit -m "Your changes"

# 2. 构建
npm run build

# 3. 部署
wrangler pages deploy .next
```

或者如果连接了 GitHub，每次推送代码时会自动部署。

---

## 📊 Pages vs Workers 明确说明

| 功能 | Pages | Workers |
|------|-------|---------|
| **前端部署** | ✅ | ❌ |
| **API Routes** | ✅ | ✅ |
| **Secrets** | ✅ | ✅ |
| **R2 绑定** | ⚠️ | ✅ |
| **D1 绑定** | ⚠️ | ✅ |
| **Cron** | ❌ | ✅ |
| **Queue** | ⚠️ | ✅ |

**注**：Pages 的 API Routes 可以通过环境变量和 Secrets 访问 R2 等资源。

---

## 🆘 故障排除

### 问题 1：部署后 404 错误

**原因**：`.next` 文件夹结构不正确

**解决**：
```bash
# 确保构建完成
npm run build

# 检查 .next 目录
ls -la .next/

# 应该包含：
# - .next/static/
# - .next/server/
# - .next/public/（如有）
```

### 问题 2：API Routes 不工作

**原因**：需要 Pages Functions 配置

**解决**：
```bash
# Pages 会自动处理 .next/server 中的 API Routes
# 如果不工作，检查 wrangler.toml 中的 pages_build_output_dir

# 应该是：
pages_build_output_dir = ".next"
```

### 问题 3：Secrets 无法访问

**原因**：Secrets 设置不正确或未应用

**解决**：
```bash
# 重新设置 Secrets
wrangler pages secret delete VPS_CALLBACK_SECRET
wrangler pages secret create VPS_CALLBACK_SECRET
# 重新输入值

# 重新部署
wrangler pages deploy .next
```

### 问题 4：自定义域名连接失败

**在 Cloudflare 控制面板**：
1. 进入 Pages 项目
2. 点击 **Settings** → **Domains**
3. 点击 **Add custom domain**
4. 输入你的域名（如 svgconvert.net）
5. 按照提示更新 DNS 记录

---

## 📞 需要帮助？

- **Cloudflare Pages 文档**：https://developers.cloudflare.com/pages/
- **Wrangler 命令参考**：https://developers.cloudflare.com/workers/wrangler/install-and-update/
- **API Routes 指南**：https://developers.cloudflare.com/pages/functions/

---

## 📝 快速命令参考

```bash
# 构建
npm run build

# 部署
wrangler pages deploy .next

# 查看部署列表
wrangler pages deployment list

# 查看项目信息
wrangler pages project info

# 设置 Secrets
wrangler pages secret create SECRET_NAME

# 查看 Secrets
wrangler pages secret list

# 删除 Secret
wrangler pages secret delete SECRET_NAME
```

---

**完成创建 Pages 项目后，上述所有命令都会正常工作！** ✨

