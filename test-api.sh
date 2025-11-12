#!/bin/bash

# =============================================================================
# SVG 转换服务 API 测试脚本
# =============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_URL="${API_URL:-http://localhost:3000}"
TEST_DIR="${TEST_DIR:-.}"

# 函数：打印标题
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

# 函数：打印成功
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 函数：打印错误
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 函数：打印警告
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 函数：打印信息
print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# 测试：健康检查
# =============================================================================

test_health_check() {
  print_header "测试 1: 健康检查"

  print_info "发送请求: GET $API_URL/health"

  response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    print_success "HTTP $http_code"
    print_success "响应: $body"
    return 0
  else
    print_error "HTTP $http_code"
    print_error "响应: $body"
    return 1
  fi
}

# =============================================================================
# 测试：服务信息
# =============================================================================

test_service_info() {
  print_header "测试 2: 获取服务信息"

  print_info "发送请求: GET $API_URL/"

  response=$(curl -s -w "\n%{http_code}" "$API_URL/")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    print_success "HTTP $http_code"
    print_success "服务信息已获取"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    return 0
  else
    print_error "HTTP $http_code"
    return 1
  fi
}

# =============================================================================
# 测试：本地上传
# =============================================================================

test_local_upload() {
  print_header "测试 3: 本地文件上传"

  # 创建测试 SVG 文件
  test_file="$TEST_DIR/test-$(date +%s).svg"
  cat > "$test_file" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="80" fill="#4CAF50" stroke="#333" stroke-width="2"/>
  <text x="100" y="110" text-anchor="middle" font-size="24" fill="white" font-weight="bold">SVG</text>
</svg>
EOF

  print_info "创建测试文件: $test_file"

  # 上传文件
  print_info "发送请求: POST $API_URL/api/upload"
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -F "file=@$test_file" \
    -F "outputFormat=png" \
    -F "width=200" \
    -F "height=200" \
    "$API_URL/api/upload")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    print_success "HTTP $http_code"
    print_success "文件上传成功"
    
    # 提取 taskId
    task_id=$(echo "$body" | jq -r '.taskId' 2>/dev/null)
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # 保存 taskId 用于后续测试
    echo "$task_id" > "$TEST_DIR/.last_task_id"
    print_info "任务 ID: $task_id"
    
    # 清理测试文件
    rm -f "$test_file"
    return 0
  else
    print_error "HTTP $http_code"
    print_error "响应: $body"
    rm -f "$test_file"
    return 1
  fi
}

# =============================================================================
# 测试：查询状态
# =============================================================================

test_status_query() {
  print_header "测试 4: 查询转换状态"

  # 读取上次保存的 taskId
  if [ ! -f "$TEST_DIR/.last_task_id" ]; then
    print_warning "未找到任务 ID，跳过此测试"
    return 0
  fi

  task_id=$(cat "$TEST_DIR/.last_task_id")
  print_info "任务 ID: $task_id"

  # 查询状态（重试最多 30 秒）
  print_info "发送请求: GET $API_URL/api/status/$task_id"
  
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    response=$(curl -s -w "\n%{http_code}" "$API_URL/api/status/$task_id")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
      status=$(echo "$body" | jq -r '.status' 2>/dev/null)
      print_info "状态: $status"
      
      if [ "$status" = "COMPLETED" ]; then
        print_success "转换完成！"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
      elif [ "$status" = "ERROR" ]; then
        print_error "转换失败"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
      else
        print_info "正在处理... ($attempt/$max_attempts)"
        sleep 1
      fi
    else
      print_error "HTTP $http_code"
      return 1
    fi
    
    attempt=$((attempt + 1))
  done

  print_error "查询超时"
  return 1
}

# =============================================================================
# 测试：下载文件
# =============================================================================

test_download() {
  print_header "测试 5: 下载转换后的文件"

  # 读取上次保存的 taskId
  if [ ! -f "$TEST_DIR/.last_task_id" ]; then
    print_warning "未找到任务 ID，跳过此测试"
    return 0
  fi

  task_id=$(cat "$TEST_DIR/.last_task_id")
  print_info "任务 ID: $task_id"

  output_file="$TEST_DIR/result-$task_id.png"
  
  print_info "发送请求: GET $API_URL/api/download/$task_id"
  
  response_code=$(curl -s -w "%{http_code}" \
    -o "$output_file" \
    "$API_URL/api/download/$task_id")

  if [ "$response_code" = "200" ]; then
    file_size=$(ls -lh "$output_file" | awk '{print $5}')
    print_success "HTTP $response_code"
    print_success "文件下载成功"
    print_info "输出文件: $output_file ($file_size)"
    return 0
  else
    print_error "HTTP $response_code"
    rm -f "$output_file"
    return 1
  fi
}

# =============================================================================
# 队列模式测试
# =============================================================================

test_queue_mode() {
  print_header "测试 6: 队列模式检查"

  print_info "发送请求: POST $API_URL/api/queue/process"

  # 检查队列端点是否可用
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{"test": "data"}' \
    "$API_URL/api/queue/process" 2>&1)

  http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" = "400" ] || [ "$http_code" = "401" ] || [ "$http_code" = "202" ]; then
    print_success "队列端点可用 (HTTP $http_code)"
    return 0
  elif [ "$http_code" = "404" ]; then
    print_warning "队列模式未启用"
    return 0
  else
    print_error "HTTP $http_code"
    return 1
  fi
}

# =============================================================================
# 主函数
# =============================================================================

main() {
  print_header "SVG 转换服务 API 测试"
  
  print_info "API 地址: $API_URL"
  echo ""

  # 检查 API 是否可访问
  if ! curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    print_error "无法连接到 API，请确保服务已启动"
    echo ""
    print_info "启动服务: pnpm run dev"
    exit 1
  fi

  # 运行测试
  passed=0
  failed=0

  if test_health_check; then ((passed++)); else ((failed++)); fi
  if test_service_info; then ((passed++)); else ((failed++)); fi
  if test_local_upload; then ((passed++)); else ((failed++)); fi
  if test_status_query; then ((passed++)); else ((failed++)); fi
  if test_download; then ((passed++)); else ((failed++)); fi
  if test_queue_mode; then ((passed++)); else ((failed++)); fi

  # 清理
  rm -f "$TEST_DIR/.last_task_id"

  # 输出总结
  print_header "测试结果"
  print_success "通过: $passed"
  if [ $failed -gt 0 ]; then
    print_error "失败: $failed"
  else
    print_success "失败: $failed"
  fi

  echo ""
  if [ $failed -eq 0 ]; then
    print_success "所有测试通过！"
    exit 0
  else
    print_error "部分测试失败"
    exit 1
  fi
}

# 执行
main "$@"

