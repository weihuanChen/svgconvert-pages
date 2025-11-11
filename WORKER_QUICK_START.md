# 🚀 Worker 快速开始指南

## 📌 核心改进点

你的 Worker 现在具备以下功能：

| 功能 | 说明 |
|------|------|
| **超时控制** | 120 秒超时，自动中止过长请求 |
| **智能重试** | 根据错误类型决定是否重试 |
| **错误分类** | 5xx/4xx/timeout 自动分类 |
| **任务追踪** | 详细的任务状态和时间记录 |
| **文件安全** | 文件名规范化，防止路径问题 |
| **定时清理** | 每小时自动清理过期文件 |

---

## ⚙️ 配置 VPS 地址

### 方式 1：环境变量（推荐）

```bash
# 在 wrangler.workers.toml 中配置
[vars]
VPS_CONVERSION_URL = "https://your-vps.example.com/api/convert"
```

### 方式 2：使用 Secret

```bash
wrangler secret put VPS_CONVERSION_URL -c wrangler.workers.toml
```

---

## 🔄 工作流程

```
1. Pages API 接收文件 (/api/upload)
   ↓
2. 上传文件到 R2
   ↓
3. 创建任务到 KV
   ↓
4. 推送消息到 Queue
   ↓
5. Worker Queue Consumer 启动 (后台)
   ├─ 从 R2 获取文件
   ├─ 调用 VPS 转换
   ├─ 保存结果到 R2
   └─ 更新 KV 状态
   ↓
6. 前端查询状态 (/api/status/:taskId)
   ↓
7. 下载转换结果 (/api/download/:taskId)
```

---

## 📝 VPS API 接口规范

### 请求格式

```http
POST https://your-vps.example.com/api/convert

Headers:
  Authorization: Bearer {VPS_CALLBACK_SECRET}
  X-Request-ID: {unique-id}
  Content-Type: multipart/form-data

Body (FormData):
  file: [binary]
  sourceFormat: "svg"
  targetFormat: "PNG"
  quality: 80
  transparency: true
  timestamp: 1699686400000
```

### 响应格式

**成功 (200)**:
```json
// 返回二进制图像数据
// Content-Type: image/png
```

**错误 (400)**:
```json
{
  "error": "Unsupported format",
  "message": "PNG is not supported"
}
```

**服务器错误 (500)**:
```json
{
  "error": "Server error",
  "message": "Processing failed"
}
```

---

## 🧪 测试转换任务

### 查看实时日志

```bash
wrangler tail -c wrangler.workers.toml
```

### 模拟任务消息

```bash
# 使用 Cloudflare Dashboard
# 或手动发送 Queue 消息进行测试
```

---

## 🔍 监控和调试

### 健康检查

```bash
curl https://svg-converter-api.workers.dev/health
```

**响应**:
```json
{
  "status": "ok",
  "service": "svg-converter-worker",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "environment": "production"
}
```

### 查看任务状态

```bash
# 在 Pages API 中查询
GET /api/status/task-abc123

# 返回的状态
{
  "taskId": "task-abc123",
  "status": "completed",
  "fileName": "image.svg",
  "sourceFormat": "svg",
  "targetFormat": "PNG",
  "outputKey": "task-abc123/image.PNG",
  "createdAt": 1699686400000,
  "completedAt": 1699686430000
}
```

---

## ❌ 错误处理

### 可重试的错误（自动重试）

```
✅ Timeout 超时
✅ Server Error 500/502/503/504
✅ Network ECONNREFUSED/ENOTFOUND
```

**处理**:
- 最多重试 3 次
- 失败后发送到死信队列 (DLQ)

### 不可重试的错误（立即失败）

```
❌ Bad Request 400
❌ Validation Error 422
❌ Invalid format
```

**处理**:
- 直接发送到死信队列
- 记录详细错误信息到 KV

---

## 📊 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 响应时间 | < 5 分钟 | 配置中 |
| 超时时间 | 120 秒 | ✅ |
| 重试次数 | 3 次 | ✅ |
| 清理间隔 | 1 小时 | ✅ |
| TTL 设置 | 1 小时 | ✅ |

---

## 🔐 安全考虑

1. **验证 VPS_CALLBACK_SECRET**
   - 所有请求都需要正确的密钥
   - VPS 应该验证 Authorization 头

2. **文件名规范化**
   - 所有特殊字符已转换为 `_`
   - 防止路径穿越攻击

3. **超时保护**
   - 120 秒超时防止无限等待
   - 自动释放资源

4. **错误信息**
   - 不泄露内部路径
   - 仅记录有用的诊断信息

---

## 🚀 部署清单

- [ ] 配置 `VPS_CONVERSION_URL` 环境变量
- [ ] 设置 `VPS_CALLBACK_SECRET` Secret
- [ ] 验证 R2 Bucket 绑定
- [ ] 验证 KV 命名空间绑定
- [ ] 验证 Queue 绑定
- [ ] 测试 Queue 消费
- [ ] 监控 Cron 清理任务
- [ ] 检查死信队列 (DLQ)

---

## 📞 常见问题

### Q: 转换超时了怎么办？
A: 自动重试（最多 3 次）。如果 VPS 响应慢，可以：
   - 增加 `TIMEOUT_MS` （目前 120 秒）
   - 优化 VPS 性能
   - 按优先级处理任务

### Q: 如何跳过清理任务？
A: 删除 `wrangler.workers.toml` 中的 `[triggers]` 部分

### Q: 错误消息在哪里？
A: 存储在 KV 中，任务状态包含 `error` 字段

### Q: 能并发处理多个任务吗？
A: 可以，最多同时 10 个（`max_batch_size = 10`）

### Q: 如何禁用重试？
A: 修改 `isRetryableError()` 函数，总是返回 `false`

---

## 🔗 相关链接

- [WORKER_IMPROVEMENTS.md](./WORKER_IMPROVEMENTS.md) - 详细改进说明
- [ARCHITECTURE_FINAL.md](./ARCHITECTURE_FINAL.md) - 系统架构
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Queue 文档](https://developers.cloudflare.com/queues/)

---

**最后更新**: 2025-11-11  
**状态**: ✅ 可用

