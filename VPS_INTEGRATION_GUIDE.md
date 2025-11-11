# 🔗 VPS 集成指南

**VPS 地址**: https://svgconvert-server.zeabur.app  
**状态**: ✅ 运行中

---

## 📋 系统架构

```
用户上传文件
    ↓
Cloudflare Pages (前端)
    ├─ /api/upload → 接收文件，上传 R2
    ├─ /api/status → 查询转换状态
    └─ /api/download → 下载转换结果
    ↓ 推送任务
Cloudflare Queue
    ↓ 消费任务
Cloudflare Worker
    ├─ 从 R2 获取源文件
    ├─ 调用 VPS API
    │  └─ https://svgconvert-server.zeabur.app/api/convert
    ├─ 保存结果到 R2
    └─ 更新 KV 状态
```

---

## 🔧 配置信息

### VPS 转换服务

| 项 | 值 |
|----|-----|
| **地址** | https://svgconvert-server.zeabur.app |
| **健康检查** | GET https://svgconvert-server.zeabur.app |
| **API 端点** | POST `/api/convert` |
| **超时** | 120 秒 |
| **状态** | ✅ 运行中 |

### Worker 配置

```toml
# wrangler.workers.toml
VPS_CONVERSION_URL = "https://svgconvert-server.zeabur.app/api/convert"
VPS_CALLBACK_SECRET = "your-secret-here"
```

---

## 📡 VPS API 接口规范

### 请求格式

```http
POST https://svgconvert-server.zeabur.app/api/convert

Content-Type: multipart/form-data
Authorization: Bearer {VPS_CALLBACK_SECRET}
X-Request-ID: {unique-id}

Parameters:
  - file: Binary file data
  - sourceFormat: "svg" | "png" | "jpg" | ...
  - targetFormat: "PNG" | "JPG" | "PDF" | ...
  - quality: 80 (optional)
  - transparency: true (optional)
  - timestamp: 1699686400000
```

### 响应格式

#### 成功 (200)
```
Content-Type: image/png (binary data)

// 返回转换后的二进制图像数据
```

#### 错误 (4xx/5xx)
```json
{
  "error": "UNSUPPORTED_FORMAT",
  "message": "BMP format is not supported",
  "code": 422
}
```

---

## 🧪 测试 VPS 连接

### 1. 健康检查

```bash
curl -s https://svgconvert-server.zeabur.app | jq .
```

**预期响应**:
```json
{
  "name": "SVG Convert Server",
  "version": "1.0.0",
  "status": "running"
}
```

✅ **当前状态**: 运行中

### 2. 测试转换 API

```bash
# 准备测试文件
cat > test.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect width="100" height="100" fill="red"/>
</svg>
EOF

# 发送转换请求
curl -X POST https://svgconvert-server.zeabur.app/api/convert \
  -H "Authorization: Bearer test-secret" \
  -F "file=@test.svg" \
  -F "sourceFormat=svg" \
  -F "targetFormat=PNG" \
  -F "quality=80" \
  -F "transparency=true" \
  -o output.png
```

### 3. 验证 Worker 连接

```bash
# 部署后检查 Worker 日志
wrangler tail -c wrangler.workers.toml

# 应该看到:
# [VPS] 发送转换请求: svg → PNG
# [VPS] ✅ 转换成功, 输出大小: XXXX bytes
```

---

## 🚀 部署步骤

### 第 1 步：配置密钥

```bash
# 设置 VPS 回调密钥
wrangler secret put VPS_CALLBACK_SECRET -c wrangler.workers.toml

# 验证密钥已设置
wrangler secret list -c wrangler.workers.toml
```

### 第 2 步：部署 Worker

```bash
# 构建并部署 Worker
wrangler deploy -c wrangler.workers.toml

# 输出示例:
# ✓ Uploaded svg-converter-api
# ✓ Deployed to svg-converter-api.shendongloving123.workers.dev
```

### 第 3 步：验证部署

```bash
# 检查健康状态
curl -s https://svg-converter-api.workers.dev/health | jq .

# 检查 Worker 日志
wrangler tail -c wrangler.workers.toml
```

### 第 4 步：部署 Pages

```bash
# 部署前端
npm run build
wrangler pages deploy .next --project-name=svg-converter

# 或使用 GitHub 自动部署
# 推送代码后会自动部署
```

---

## ✅ 集成验证清单

- [ ] VPS 服务健康检查通过
- [ ] Worker 配置中 VPS_CONVERSION_URL 正确
- [ ] VPS_CALLBACK_SECRET 已设置
- [ ] Worker 部署成功
- [ ] Pages 部署成功
- [ ] 前端可以访问
- [ ] 能够上传文件
- [ ] Worker 日志显示转换请求
- [ ] VPS 日志显示转换成功
- [ ] 可以下载转换后的文件

---

## 🔍 故障排除

### 问题 1：VPS 连接超时

```
[VPS] 发送转换请求: svg → PNG
❌ VPS Conversion Timeout after 120000ms (retryable)
```

**解决**:
1. 检查 VPS 服务是否运行
   ```bash
   curl -s https://svgconvert-server.zeabur.app
   ```

2. 检查网络连接
   ```bash
   ping svgconvert-server.zeabur.app
   ```

3. 检查防火墙规则

4. 增加超时时间（修改 `src/worker.ts` 中的 `TIMEOUT_MS`）

### 问题 2：VPS 返回 422 错误

```
❌ VPS Bad Request 422: Unsupported format (not retryable)
```

**解决**:
1. 检查 VPS 支持的格式
2. 验证请求参数格式
3. 查看 VPS 日志获取详细错误

### 问题 3：Worker 无法读取文件

```
❌ Source file not found: source/task-abc/file.svg
```

**解决**:
1. 检查 R2 Bucket 名称配置
2. 验证文件是否正确上传
3. 检查 R2 权限配置

### 问题 4：内存不足

```
Error: Out of memory
```

**解决**:
1. 限制单个文件大小（目前 20MB）
2. 实现流式处理（如果文件很大）
3. 并发控制（限制同时处理的任务数）

---

## 📊 性能优化建议

### 1. 并发控制

当前 Worker 配置支持同时处理最多 10 个任务（`max_batch_size = 10`）。

如果 VPS 不稳定，可以降低并发：

```toml
# wrangler.workers.toml
[[queues.consumers]]
max_batch_size = 5  # 改为 5
max_batch_timeout = 30
```

### 2. 重试间隔

当前重试没有间隔，立即重试。可以添加指数退避：

```typescript
// src/worker.ts - 可选增强
async function waitWithBackoff(attempt: number) {
  const delayMs = Math.min(1000 * Math.pow(2, attempt), 30000)
  return new Promise(resolve => setTimeout(resolve, delayMs))
}
```

### 3. VPS 负载均衡

如果需要多个 VPS 实例：

```typescript
const VPS_URLS = [
  'https://svgconvert-server.zeabur.app/api/convert',
  'https://svgconvert-server-2.zeabur.app/api/convert'
]

const vpsUrl = VPS_URLS[Math.floor(Math.random() * VPS_URLS.length)]
```

---

## 📈 监控指标

### 关键指标

1. **转换成功率** (%)
   ```
   成功任务 / 总任务 * 100
   ```

2. **平均响应时间** (秒)
   ```
   totalTime / completedTasks
   ```

3. **错误率** (%)
   ```
   失败任务 / 总任务 * 100
   ```

### 查看日志

```bash
# 实时日志
wrangler tail -c wrangler.workers.toml

# 查看特定服务日志
wrangler tail -c wrangler.workers.toml --service svg-converter-api
```

### 关键日志

```
[Queue] 处理任务: task-abc123          ← 任务开始
[VPS] 发送转换请求: svg → PNG         ← VPS 请求
[VPS] ✅ 转换成功, 输出大小: 45678 bytes  ← 成功
[Queue] ✅ 任务完成: task-abc123       ← 任务结束
```

---

## 🔐 安全建议

1. **VPS 密钥管理**
   - 定期更换 VPS_CALLBACK_SECRET
   - 不要在代码中硬编码密钥
   - 使用 Cloudflare Secret 存储

2. **请求验证**
   - VPS 应该验证 Authorization 头
   - 验证 X-Request-ID（防止重放攻击）
   - 验证 Content-Type

3. **文件安全**
   - 限制文件大小（目前 20MB）
   - 验证文件类型
   - 限制转换格式

4. **速率限制**
   - 按 IP 限制请求速率
   - 按用户限制并发任务数
   - 实现 DDoS 保护

---

## 📝 VPS API 返回值预期

根据 Worker 代码，VPS 应该返回：

```typescript
// 成功 (200)
Response 为 ArrayBuffer（二进制图像数据）

// 错误 (4xx/5xx)
Response 为 JSON：{
  error: string,
  message: string,
  code?: number
}
```

---

## 🎯 后续优化

### 短期（1-2 周）
- [ ] 监控初期运行情况
- [ ] 收集转换性能数据
- [ ] 优化并发参数

### 中期（1-2 月）
- [ ] 添加用户反馈机制
- [ ] 支持更多转换格式
- [ ] 实现预处理功能

### 长期（3-6 月）
- [ ] VPS 负载均衡
- [ ] 缓存转换结果
- [ ] 实现高级图像处理

---

## 📞 常见问题

**Q: VPS 故障时会怎样?**  
A: Worker 会自动重试 3 次，失败后进入死信队列 (DLQ)。可以稍后重新处理。

**Q: 转换很慢怎么办?**  
A: 检查 VPS 性能，考虑添加更多 VPS 实例或优化转换算法。

**Q: 能否取消正在进行的转换?**  
A: 当前不支持，但 Worker 会在 120 秒后超时自动停止。

**Q: 如何扩展支持的格式?**  
A: 在 VPS 中添加格式支持，Worker 会自动支持。

---

**最后更新**: 2025-11-11  
**VPS 状态**: ✅ 运行中  
**集成状态**: ✅ 可用

