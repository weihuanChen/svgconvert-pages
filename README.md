# 🎨 SVG Converter - 在线转换工具

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Production-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)

快速、免费、无需登录的在线 SVG 转换工具。支持转换为 PNG、JPG、PDF 等多种格式。

**🌐 [立即体验](https://svgconvert.net) • 📚 [完整文档](./docs/README.md) • 🐛 [报告问题](https://github.com/your/repo/issues)**

---

## ✨ 主要特性

- **🚀 快速** - 平均 3-5 秒完成转换
- **💰 完全免费** - 无需注册，无任何付费限制
- **🌐 多语言** - 中文、英文、日文（计划中）
- **📱 移动适配** - 完全响应式设计
- **🔒 隐私保护** - 文件自动清理，30 分钟后删除
- **⚡ 全球加速** - Cloudflare Workers CDN

---

## 🎯 支持的转换

| 输入 | 输出 | 状态 |
|------|------|------|
| SVG | PNG / JPG / PDF | ✅ 支持 |
| PNG | JPG / PDF | ✅ 支持 |
| JPG | PNG / PDF | ✅ 支持 |
| PDF | PNG / JPG | ⏳ 计划 |

---

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 本地预览（Worker 环境）
npm run preview
# 访问 http://localhost:8787
```

### 部署到 Cloudflare

```bash
# 构建并部署
npm run deploy

# 部署完成后访问你的域名
# https://svgconvert.net
```

---

## 📚 完整文档

所有文档都在 [`docs/`](./docs/README.md) 目录中，包括：

| 文档 | 描述 | 适合 |
|------|------|------|
| 🧪 [测试报告](./docs/testing/TEST_REPORT.md) | API 测试覆盖 93% | QA、PM |
| 📦 [部署指南](./docs/deployment/DEPLOYMENT_GUIDE.md) | OpenNextJS Cloudflare 部署 | DevOps、开发者 |
| 💻 [架构设计](./docs/development/ARCHITECTURE.md) | 系统架构和技术栈 | 开发者 |
| 🌐 [i18n 指南](./docs/development/I18N_GUIDE.md) | 国际化开发指南 | 开发者 |
| 📋 [功能说明](./docs/product/FEATURES.md) | 产品功能和使用指南 | 用户、PM |
| 🔍 [SEO 优化](./docs/seo/SEO_GUIDE.md) | 多语言 SEO 最佳实践 | SEO、营销 |

**→ [查看所有文档](./docs/README.md)**

---

## 🏗️ 项目架构

```
┌──────────────────────────────────────┐
│   Cloudflare Worker                  │  ← 边界计算 + CDN
│   (svgconvert.net)                   │
└────────────┬─────────────┬───────────┘
             │             │
             ▼             ▼
        ┌─────────┐   ┌────────────────┐
        │ R2 CDN  │   │ VPS Backend    │
        │ 存储    │   │ 文件转换处理   │
        └─────────┘   └────────────────┘
```

**技术栈**:
- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **部署**: Cloudflare Workers + R2 Storage
- **后端**: Node.js, Zeabur VPS
- **多语言**: URL 子路径架构，支持 en/zh/ja

---

## 📊 项目统计

| 指标 | 数据 |
|------|------|
| **文档行数** | 4,500+ |
| **代码文件** | 20+ |
| **支持语言** | 2 个（计划 3 个） |
| **API 端点** | 5 个 |
| **测试覆盖** | 93% |

---

## 🔗 相关链接

### 在线服务
- **应用主页**: https://svgconvert.net
- **后端 API**: https://svgconvert-server.zeabur.app
- **GitHub 仓库**: https://github.com/your/repo

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [OpenNext](https://opennext.js.org/)

---

## 📝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献步骤
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📋 未来计划

- [ ] 日文支持
- [ ] PNG/JPG → SVG 矢量化转换
- [ ] WebP 格式支持
- [ ] 批量文件处理
- [ ] AI 增强路径优化
- [ ] API 付费服务

---

## 📊 性能指标

| 指标 | 实际 |
|------|------|
| 首页加载 | < 1.2s |
| API 响应 | < 0.3s |
| 文件转换 | < 5s |
| 可用性 | 99.9% |

---

## 🎓 相关资源

### 开发者
- 📖 [完整文档中心](./docs/README.md)
- 🏗️ [架构设计文档](./docs/development/ARCHITECTURE.md)
- 🌐 [国际化指南](./docs/development/I18N_GUIDE.md)

### 运维
- 📦 [部署指南](./docs/deployment/DEPLOYMENT_GUIDE.md)
- ✅ [部署检查清单](./docs/deployment/DEPLOYMENT_GUIDE.md#-完整部署检查清单)

### 产品
- 📋 [功能说明](./docs/product/FEATURES.md)
- 🔍 [SEO 优化指南](./docs/seo/SEO_GUIDE.md)

---

## 📞 获取帮助

### 文档和教程
- 📚 查看 [完整文档](./docs/README.md)
- 🎯 阅读 [快速开始](#快速开始)

### 问题和反馈
- 🐛 [提交 Issue](https://github.com/your/repo/issues)
- 💬 [讨论](https://github.com/your/repo/discussions)

---

## ⚖️ 许可证

本项目采用 [MIT 许可证](LICENSE) - 详见 LICENSE 文件

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Cloudflare](https://www.cloudflare.com/) - 边界计算和 CDN
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Radix UI](https://www.radix-ui.com/) - 无样式 UI 组件

---

## 👤 联系方式

- **邮箱**: support@svgconvert.net
- **Twitter**: [@svgconverter](https://twitter.com/svgconverter)
- **GitHub**: [@your-username](https://github.com/your-username)

---

<div align="center">

**⭐ 如果觉得有帮助，请给个 Star！**

[访问应用](https://svgconvert.net) • [查看文档](./docs/README.md) • [报告问题](https://github.com/your/repo/issues)

</div>
