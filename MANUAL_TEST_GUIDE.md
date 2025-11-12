# 手动测试指南 - JPG 下载修复

## 快速测试 (5 分钟)

### 测试 1: JPG 格式转换

1. **打开应用**: http://localhost:3000/en
2. **上传文件**: 任意 SVG 或 PNG 文件
3. **选择格式**: 在右侧设置面板选择 **JPG**
4. **设置质量**: 调整质量为 80%
5. **开始转换**: 点击"Start Conversion"
6. **等待完成**: 等待状态变为 "COMPLETED"
7. **下载**: 点击"Download"按钮

### 预期结果

✅ 下载的文件应该：
- 文件名以 `.jpg` 结尾（而不是 `.png`）
- 能在图片查看器中打开
- Content-Type 为 `image/jpeg`

---

## 详细测试 (15 分钟)

### 测试 2: PDF 格式转换

1. 重复上述步骤，但选择 **PDF** 格式
2. 验证下载的文件：
   - ✅ 文件名以 `.pdf` 结尾
   - ✅ 能在 PDF 阅读器中打开
   - ✅ Content-Type 为 `application/pdf`

### 测试 3: PNG 格式转换

1. 重复上述步骤，但选择 **PNG** 格式
2. 验证下载的文件：
   - ✅ 文件名以 `.png` 结尾
   - ✅ 能在图片查看器中打开
   - ✅ Content-Type 为 `image/png`

### 测试 4: 使用浏览器开发者工具检查响应头

1. 打开浏览器 DevTools (F12)
2. 转到 "Network" 标签
3. 上传文件并下载
4. 在网络请求中查找 `/api/download/*/file`
5. 检查 "Response Headers":

```
Content-Type: image/jpeg    ✅ (对于 JPG)
Content-Disposition: attachment; filename="converted_xxxx.jpg"  ✅
Content-Length: 15234       ✅
```

---

## 调试输出检查

### 查看服务器日志

在开发终端中查找以下日志：

```
[Download/File] Detected format from file content: jpg
[Download/File] ✅ VPS file download successful: xxx (15234 bytes, format: jpg, content-type: image/jpeg)
```

✅ 如果看到这些日志，说明修复已正常工作

---

## 测试检查清单

### 基础功能
- [ ] JPG 文件下载名称正确（`.jpg`）
- [ ] PDF 文件下载名称正确（`.pdf`）
- [ ] PNG 文件下载名称正确（`.png`）
- [ ] 文件可以在相应应用中打开

### HTTP 响应头
- [ ] Content-Type 为正确的 MIME 类型
- [ ] Content-Disposition 包含正确的文件扩展名
- [ ] Content-Length 正确

### 浏览器行为
- [ ] 下载时浏览器自动保存文件（而不是打开对话框）
- [ ] 文件保存时使用正确的扩展名

---

## 问题排查

### 问题: 文件仍显示为 .png

**解决方案**：
1. 清除浏览器缓存
2. 重新启动开发服务器
3. 检查是否使用了新代码

### 问题: Content-Type 仍然错误

**解决方案**：
1. 检查日志是否显示格式检测成功
2. 尝试不同的文件类型
3. 检查网络请求的完整响应头

---

## 自动化测试脚本

运行完整的自动化测试：

```bash
# 在项目根目录运行
/tmp/test-download-fix-v2.sh
```

预期输出：
```
✅✅✅ SUCCESS! Downloaded file is JPEG format
✅ Correct Content-Type header: image/jpeg
```

---

## 测试完成

当所有上述测试都通过时，修复已验证可行 ✅

报告任何问题或异常情况给开发团队。

