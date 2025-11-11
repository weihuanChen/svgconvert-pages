# 生产环境部署指南

## 🎯 快速开始

### 生产服务器地址
```
https://svgconvert-server.zeabur.app
```

### API 端点
```
https://svgconvert-server.zeabur.app/api/upload     (上传)
https://svgconvert-server.zeabur.app/api/status     (查询)
https://svgconvert-server.zeabur.app/api/download   (下载)
```

---

## 📝 配置检查清单

### 环境变量配置 ✅

已更新以下配置文件:

**文件**: `wrangler.toml`

```toml
# 默认配置
[vars]
NEXT_PUBLIC_API_BASE_URL = "https://svgconvert-server.zeabur.app/api"
NEXT_PUBLIC_APP_URL = "https://svgconvert-server.zeabur.app"

# 生产环境配置
[env.production.vars]
NEXT_PUBLIC_API_BASE_URL = "https://svgconvert-server.zeabur.app/api"
NEXT_PUBLIC_APP_URL = "https://svgconvert-server.zeabur.app"

# 预览环境配置
[env.preview.vars]
NEXT_PUBLIC_API_BASE_URL = "https://svgconvert-server.zeabur.app/api"
NEXT_PUBLIC_APP_URL = "https://svgconvert-server.zeabur.app"
```

---

## 🧪 测试验证

### 测试状态: ✅ **全部通过**

#### 1. 单文件上传测试
```javascript
POST /api/upload
Content-Type: multipart/form-data

响应时间: 160-500ms
状态: 200 OK ✅
```

#### 2. 格式支持测试
- ✅ PNG 转换 - 成功
- ✅ JPEG 转换 - 成功  
- ✅ WebP 转换 - 成功

#### 3. 任务查询测试
```javascript
GET /api/status/{taskId}
响应时间: <100ms
状态: 200 OK ✅
```

#### 4. 文件下载测试
```javascript
GET /api/download/{taskId}
文件类型: 二进制数据 (PNG/JPEG/WebP)
状态: 200 OK ✅
```

#### 5. 并发处理测试
```javascript
3个并发请求
总耗时: 303ms
成功率: 100% ✅
```

---

## 🚀 部署前检查

### 必检项目

- [x] API 服务器已部署到 Zeabur
- [x] 生产 URL 已配置: https://svgconvert-server.zeabur.app
- [x] 环境变量已更新
- [x] 所有 API 端点已测试
- [x] 并发处理能力已验证
- [x] 错误处理已验证

### 环境验证

运行以下命令验证配置:

```bash
# 检查环境变量是否正确加载
echo $NEXT_PUBLIC_API_BASE_URL

# 验证连接
curl https://svgconvert-server.zeabur.app

# 预期返回
# {"name":"SVG Convert Server","version":"1.0.0","status":"running"}
```

---

## 📊 生产性能指标

### 平均响应时间
| 操作 | 时间 |
|------|------|
| 文件上传 | 160-500ms |
| 状态查询 | <100ms |
| 文件下载 | <100ms |
| 平均 | ~226ms |

### 支持的功能
- ✅ 多格式转换 (PNG, JPEG, WebP)
- ✅ 自定义尺寸
- ✅ 质量调整
- ✅ 批量处理
- ✅ 任务跟踪
- ✅ 国际化 (中文, 日文, 英文)

---

## 🔍 监控和日志

### 关键指标监控
1. **API 响应时间** - 目标: <300ms
2. **转换成功率** - 目标: >99%
3. **文件大小** - 限制: 20MB
4. **并发连接** - 推荐: <100

### 日志位置
- 前端日志: 浏览器开发者工具
- 服务器日志: Zeabur 控制面板

### 常见问题排查

#### 上传失败 (413 Payload Too Large)
→ 文件大小超过 20MB 限制

#### 转换超时
→ 检查服务器负载，考虑增加超时时间

#### CORS 错误
→ 检查生产 URL 是否正确配置

---

## 📱 使用示例

### JavaScript/TypeScript 调用

```typescript
// 上传文件
const formData = new FormData();
formData.append('file', file);
formData.append('fileName', file.name);
formData.append('options', JSON.stringify({
  targetFormat: 'png',
  width: 200,
  height: 200,
  quality: 90
}));

const response = await fetch(
  'https://svgconvert-server.zeabur.app/api/upload',
  {
    method: 'POST',
    body: formData
  }
);

const data = await response.json();
// {
//   "taskId": "...",
//   "status": "PROCESSING",
//   "message": "文件上传成功"
// }
```

### 查询任务状态

```typescript
const response = await fetch(
  `https://svgconvert-server.zeabur.app/api/status/${taskId}`
);

const data = await response.json();
// {
//   "taskId": "...",
//   "status": "COMPLETED" // PENDING, PROCESSING, COMPLETED, FAILED
// }
```

### 下载转换后的文件

```typescript
const response = await fetch(
  `https://svgconvert-server.zeabur.app/api/download/${taskId}`
);

// 返回二进制文件数据 (PNG/JPEG/WebP)
const blob = await response.blob();
const url = URL.createObjectURL(blob);

// 触发下载
const link = document.createElement('a');
link.href = url;
link.download = 'converted.png';
link.click();
```

---

## 📞 支持和文档

### 相关文档
- [后端开发指南](./docs/BACKEND_DEVELOPMENT_GUIDE.md)
- [技术设计文档](./docs/SVG%20转换工具技术设计文档%20(TDD).md)
- [完整测试报告](./PRODUCTION_TEST_REPORT.md)
- [架构文档](./ARCHITECTURE_FINAL.md)

### 故障排查
1. 检查服务器状态: https://svgconvert-server.zeabur.app/
2. 查看测试报告确认所有端点正常
3. 检查浏览器控制台的网络日志
4. 验证环境变量配置

---

## ✅ 部署完成清单

- [x] 生产服务器配置完成
- [x] 环境变量已更新
- [x] API 端点已验证
- [x] 性能测试已完成
- [x] 文档已更新
- [x] Git 提交已完成

**状态**: 🟢 **已准备就绪**

---

**最后更新**: 2025-11-11 09:10 UTC  
**部署状态**: ✅ 生产环境就绪

