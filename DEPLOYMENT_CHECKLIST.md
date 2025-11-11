# ✅ 部署检查清单

## 📦 Cloudflare 资源配置检查清单

### 🔧 已完成的配置

- [x] **R2 Bucket 创建**
  - 名称: `svg-converter`
  - 用途: 文件存储
  - 状态: ✅ 已创建

- [x] **D1 数据库创建**
  - 名称: `svg-converter`
  - 生产 ID: `6762c777-6807-438c-801e-e3f743aa6a5e`
  - 预览 ID: `6762c777-6807-438c-801e-e3f743aa6a5e`
  - 状态: ✅ 已创建

- [x] **KV 命名空间创建**
  - 名称: `SVG_CONVERTER_KV`
  - 生产 ID: `d6f9b75693384b869b13edae0a84f485`
  - 预览 ID: `ecc92269f04f49b49f6bbf2d106e0993`
  - 状态: ✅ 已创建

- [x] **Queue 创建**
  - 主队列: `svg-converter-queue` ✅
  - 死信队列: `svg-converter-dlq` ✅
  - 状态: ✅ 已创建

- [x] **Secrets 设置**
  - `VPS_CALLBACK_SECRET` ✅
  - `R2_ACCESS_KEY_ID` ✅
  - `R2_SECRET_ACCESS_KEY` ✅
  - `D1_DATABASE_ID` ✅
  - `KV_NAMESPACE_ID` ✅

- [x] **wrangler.toml 配置更新**
  - Account ID: ✅
  - D1 数据库 ID: ✅
  - KV 命名空间 ID: ✅
  - Queue 配置: ✅
  - 环境变量: ✅

---

## 🚀 部署前验证步骤

### 第 1 步：验证 wrangler.toml 配置

```bash
# 执行以下命令验证配置
wrangler deploy --dry-run
```

✅ **检查项**:
- [ ] 无错误消息
- [ ] 资源绑定正确
- [ ] 所有 ID 有效

### 第 2 步：验证 Secrets

```bash
# 查看所有 Secrets
wrangler secret list
```

✅ **检查项**:
- [ ] `VPS_CALLBACK_SECRET` 存在
- [ ] `R2_ACCESS_KEY_ID` 存在
- [ ] `R2_SECRET_ACCESS_KEY` 存在
- [ ] `D1_DATABASE_ID` 存在
- [ ] `KV_NAMESPACE_ID` 存在

### 第 3 步：验证资源连接

```bash
# 查看 D1 数据库
wrangler d1 list

# 查看 KV 命名空间
wrangler kv namespace list

# 查看 R2 Buckets
wrangler r2 bucket list

# 查看 Queues
wrangler queues list
```

✅ **检查项**:
- [ ] D1 数据库可见
- [ ] KV 命名空间可见
- [ ] R2 Bucket 可见
- [ ] Queues 可见

---

## 📝 部署步骤

### 生产部署

```bash
# 1. 构建项目
npm run build

# 2. 验证配置
wrangler deploy --dry-run

# 3. 部署到生产
wrangler deploy

# 4. 验证部署
wrangler tail
```

### 部署验证

```bash
# 查看部署历史
wrangler deployments

# 查看当前部署状态
wrangler whoami

# 查看实时日志
wrangler tail
```

---

## 🔄 配置检查矩阵

| 资源 | 创建 | ID 配置 | Secrets | 验证 |
|------|------|--------|--------|------|
| **R2 Bucket** | ✅ | - | ✅ | - |
| **D1 Database** | ✅ | ✅ | ✅ | - |
| **KV Namespace** | ✅ | ✅ | ✅ | - |
| **Queue (Main)** | ✅ | - | - | - |
| **Queue (DLQ)** | ✅ | - | - | - |

---

## 🆘 常见问题排查

### 问题 1：验证失败 - 资源不存在

**症状**: `wrangler deploy --dry-run` 报错找不到资源

**解决方案**:
1. 检查 wrangler.toml 中的 ID 是否正确
2. 运行 `wrangler d1 list` 查看实际 ID
3. 更新 wrangler.toml 中的 ID

### 问题 2：Secret 无法访问

**症状**: Worker 访问 env 变量时出错

**解决方案**:
1. 确认 Secret 已设置: `wrangler secret list`
2. 确认代码中访问的名称正确
3. 重新部署: `wrangler deploy`

### 问题 3：Queue 无法发送消息

**症状**: 消息发送失败

**解决方案**:
1. 检查 Queue 是否存在: `wrangler queues list`
2. 检查 binding 名称是否正确
3. 检查 max_batch_size 配置

---

## 📊 资源成本预估

| 资源 | 免费额度 | 估算成本 |
|------|---------|--------|
| **R2 Storage** | 10GB | ~$0.015/GB (超出) |
| **D1 Database** | 5GB | ~$0.75 (超出) |
| **KV Namespace** | 100K read/day | 需监控 |
| **Queues** | 1M messages/day | 需监控 |
| **Workers Requests** | 100K/day | 需监控 |

---

## 🎯 后续开发计划

### 第 1 阶段：VPS 后端开发
- [ ] 设置 VPS 项目结构
- [ ] 实现 R2 客户端
- [ ] 实现转换器（SVG → PNG/JPG）
- [ ] 实现回调机制
- [ ] 本地测试

### 第 2 阶段：集成测试
- [ ] 前后端集成测试
- [ ] Queue 消息流测试
- [ ] 错误处理测试
- [ ] 性能测试

### 第 3 阶段：生产部署
- [ ] 配置生产环境
- [ ] 设置监控和告警
- [ ] 性能优化
- [ ] 生产验证

---

## 📞 获取帮助

### 参考文档

- 📖 [CLOUDFLARE_CONFIG_REFERENCE.md](./CLOUDFLARE_CONFIG_REFERENCE.md) - 详细配置参考
- 📋 [CLOUDFLARE_SETUP_COMPLETE.md](./CLOUDFLARE_SETUP_COMPLETE.md) - 配置完成总结
- 📚 [BACKEND_DEVELOPMENT_GUIDE.md](./docs/BACKEND_DEVELOPMENT_GUIDE.md) - VPS 后端开发指南

### 官方文档

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)

---

## ✅ 最终检查清单

在进行部署前，请确保所有项都已完成：

- [ ] 所有 Cloudflare 资源已创建
- [ ] wrangler.toml 已更新所有 ID
- [ ] 所有 Secrets 已设置
- [ ] `wrangler deploy --dry-run` 通过验证
- [ ] `wrangler secret list` 显示所有必需的 Secrets
- [ ] `wrangler d1 list` 显示数据库
- [ ] `wrangler kv namespace list` 显示 KV 命名空间
- [ ] 项目根目录有 `wrangler.toml`
- [ ] TypeScript 配置正确
- [ ] 所有依赖已安装

---

**配置日期**: 2025-11-11  
**状态**: ✅ 完成  
**下一步**: VPS 后端开发

