#!/usr/bin/env node

/**
 * 生产服务器测试脚本
 * 
 * 用法: node scripts/production-test.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const PRODUCTION_URL = 'https://svgconvert-server.zeabur.app';
const API_BASE_URL = `${PRODUCTION_URL}/api`;
const TEST_SVG = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1760442748479" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="16001" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M141.02 880.21c-28.015 0-34.004-0.913-34.95-1.104-3.65-1.063-6.634-3.226-8.416-6.105L58.02 808.587c-27.948-45.553-36.122-98.873-23.009-150.132 13.689-53.512 48.682-98.687 98.533-127.203l1.573-0.9 243.72-348.526 0.208-0.208 0.235-0.282c1.631-1.957 3.487-3.464 5.516-4.478 1.578-0.789 3.149-1.225 5.059-1.4h2.076c0.221 0.049 0.433 0.087 0.635 0.117a9.69 9.69 0 0 0 1.851 0.305l0.302 0.06 0.187 0.047c0.329 0.118 0.621 0.204 0.855 0.267l1.116 0.37c0.632 0.211 1.447 0.601 2.224 1.066l0.257 0.154 0.299 0.15c0.087 0.065 0.184 0.136 0.291 0.212l0.473 0.473 0.903 0.677 0.301 0.301a11.224 11.224 0 0 0 1.284 1.51c0.339 0.571 0.665 1.14 0.98 1.741l0.213 0.635 0.113 0.226c0.045 0.129 0.099 0.28 0.164 0.448 0.195 0.795 0.334 1.678 0.477 2.661v0.312l0.011 0.214c1.7 32.037 16.463 61.508 41.569 82.986 23.512 19.934 53.78 30.899 85.255 30.898 1.975 0 3.978-0.042 5.955-0.127 34.641-1.55 67.495-16.746 90.156-41.694 21.155-23.289 31.968-52.933 30.46-83.497 0.011-1.548 0.166-2.939 0.483-4.361l0.22-0.987-0.031-1.011c-0.134-4.552 2.424-8.717 6.842-11.142 17.927-9.734 37.404-14.678 57.859-14.678 36.41 0 76.341 15.909 115.474 46.008 40.286 30.986 79.923 77.203 114.625 133.656l39.649 64.435c2.085 3.398 1.886 6.668 1.351 8.811-0.86 3.444-3.248 6.545-6.562 8.526l-802.351 435.41 3.858 15.196h252.552c3.263 0 6.194 1.206 8.478 3.49 2.243 2.247 3.482 5.337 3.482 8.696 0 6.721-5.365 12.19-11.96 12.19H141.02z m699.494-481.141L88.883 806.856l26.054 42.415 847.584-459.878-26.057-42.415-95.95 52.091zM133.205 562.224c-70.688 49.818-95.794 138.122-61.054 214.74l3.589 7.916 153.238-83.245-88.733-144.374-7.04 4.963z m67.1 40.773l52.256 85.884 215.175-116.753-125.757-48.906c-3.577-1.358-6.257-3.881-7.608-7.127a11.356 11.356 0 0 1 0.12-9.072c2.173-4.86 7.313-8.004 13.093-8.004 1.881 0 3.729 0.339 5.49 1.009l144.23 56.076 57.422-31.042-133.825-52.047c-3.43-1.416-6.042-3.956-7.358-7.156-1.202-2.923-1.186-6.152 0.042-9.104 2.253-4.832 7.353-7.948 13.025-7.948a14.9 14.9 0 0 1 5.311 0.978l141.428 54.948c1.518 0.608 2.712 1.301 3.685 2.152l4.236 3.708 54.771-29.709-127.054-49.325c-3.426-1.415-6.037-3.952-7.353-7.148-1.204-2.923-1.189-6.156 0.039-9.115 2.255-4.83 7.354-7.945 13.025-7.945 1.818 0 3.606 0.329 5.315 0.979l141.068 54.814 3.885 1.947 149.968-81.407-3.394-6.96c-12.924-26.494-19.574-54.559-19.767-83.414-0.193-28.876 6.095-57.05 18.685-83.739l2.931-6.214-5.657-3.898c-29.338-20.213-57.463-30.462-83.593-30.462-11.37 0-22.365 1.988-32.679 5.908l-5.181 1.969-0.034 5.543c-0.213 35.741-14.366 69.924-39.853 96.254-27.883 28.742-65.961 45.634-107.213 47.558l-0.292 0.019c-2.37 0.197-4.834 0.197-7.442 0.197-37.579 0-73.753-12.784-101.858-35.997l-6.756-5.58-222.526 318.129z m-38.759-63.293l23.409 38.268L404.35 263.997l-3.273-4.64c-4.477-6.346-8.536-13.596-12.774-22.819l-5.893-12.824-220.864 315.99z m669.183-307.843c-16.001 42.129-14.363 89.818 4.493 130.839l3.61 7.853 83.882-45.528-4.932-7.374c-23.149-34.606-48.731-65.325-73.98-88.837l-8.803-8.197-4.27 11.244z m-268.42 648.125c-3.258 0-6.188-1.206-8.472-3.49-2.25-2.25-3.489-5.34-3.489-8.702 0-6.833 5.155-12.186 11.735-12.186h60.834c6.433 0 11.782 5.496 11.96 12.268-0.04 6.797-5.181 12.11-11.736 12.11h-60.832z" p-id="16002" fill="#99e600"></path></svg>`;

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 辅助函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, url, body = null, retries = 3) {
  const fetch = require('node-fetch');
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const options = { method };
      if (body) {
        options.body = body;
      }
      
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}

// 测试函数
async function testServerHealth() {
  log('\n📍 测试 1: 服务器健康检查', 'cyan');
  try {
    const response = await makeRequest('GET', PRODUCTION_URL);
    const data = await response.json();
    
    if (response.ok && data.status === 'running') {
      log(`✅ 服务器正常运行: ${JSON.stringify(data)}`, 'green');
      return true;
    } else {
      log(`❌ 服务器异常: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 连接失败: ${error.message}`, 'red');
    return false;
  }
}

async function testFileUpload() {
  log('\n📍 测试 2: 文件上传 (PNG 格式)', 'cyan');
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', Buffer.from(TEST_SVG, 'utf8'), {
      filename: 'test.svg',
      contentType: 'image/svg+xml'
    });
    formData.append('fileName', 'test.svg');
    formData.append('options', JSON.stringify({
      targetFormat: 'png',
      width: 200,
      height: 200
    }));
    
    const startTime = Date.now();
    const response = await makeRequest('POST', `${API_BASE_URL}/upload`, formData);
    const endTime = Date.now();
    
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ 上传成功`, 'green');
      log(`   TaskID: ${data.taskId}`, 'green');
      log(`   响应时间: ${endTime - startTime}ms`, 'green');
      return data.taskId;
    } else {
      log(`❌ 上传失败: ${JSON.stringify(data)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ 上传错误: ${error.message}`, 'red');
    return null;
  }
}

async function testTaskStatus(taskId) {
  log('\n📍 测试 3: 任务状态查询', 'cyan');
  try {
    // 等待任务处理
    log(`   等待任务处理...`, 'yellow');
    await sleep(2000);
    
    const startTime = Date.now();
    const response = await makeRequest('GET', `${API_BASE_URL}/status/${taskId}`);
    const endTime = Date.now();
    
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ 状态查询成功`, 'green');
      log(`   状态: ${data.status}`, 'green');
      log(`   响应时间: ${endTime - startTime}ms`, 'green');
      return data.status === 'COMPLETED' || data.status === 'PROCESSING';
    } else {
      log(`❌ 查询失败: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 查询错误: ${error.message}`, 'red');
    return false;
  }
}

async function testFileDownload(taskId) {
  log('\n📍 测试 4: 文件下载', 'cyan');
  try {
    const startTime = Date.now();
    const response = await makeRequest('GET', `${API_BASE_URL}/download/${taskId}`);
    const endTime = Date.now();
    
    if (response.ok) {
      log(`✅ 下载成功`, 'green');
      log(`   响应时间: ${endTime - startTime}ms`, 'green');
      return true;
    } else {
      log(`❌ 下载失败: HTTP ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 下载错误: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function runTests() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('🧪 生产服务器测试套件', 'blue');
  log(`📅 时间: ${new Date().toISOString()}`, 'blue');
  log(`🌍 服务器: ${PRODUCTION_URL}`, 'blue');
  log('═══════════════════════════════════════════════════════════\n', 'blue');
  
  const results = [];
  
  // 测试 1: 服务器健康检查
  results.push({
    name: '服务器健康检查',
    passed: await testServerHealth()
  });
  
  // 测试 2: 文件上传
  const taskId = await testFileUpload();
  results.push({
    name: '文件上传',
    passed: taskId !== null
  });
  
  if (taskId) {
    // 测试 3: 任务状态查询
    results.push({
      name: '任务状态查询',
      passed: await testTaskStatus(taskId)
    });
    
    // 测试 4: 文件下载
    results.push({
      name: '文件下载',
      passed: await testFileDownload(taskId)
    });
  }
  
  // 输出总结
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('📊 测试总结', 'blue');
  log('═══════════════════════════════════════════════════════════\n', 'blue');
  
  let passedCount = 0;
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${index + 1}. ${icon} ${result.name}`, color);
    if (result.passed) passedCount++;
  });
  
  log(`\n总体: ${passedCount}/${results.length} 测试通过`, passedCount === results.length ? 'green' : 'yellow');
  log('═══════════════════════════════════════════════════════════\n', 'blue');
  
  process.exit(passedCount === results.length ? 0 : 1);
}

// 检查依赖
const requiredModules = ['node-fetch', 'form-data'];
const missingModules = [];

requiredModules.forEach(module => {
  try {
    require.resolve(module);
  } catch (e) {
    missingModules.push(module);
  }
});

if (missingModules.length > 0) {
  log(`\n⚠️  缺少依赖: ${missingModules.join(', ')}`, 'yellow');
  log(`请运行: npm install ${missingModules.join(' ')}`, 'yellow');
  process.exit(1);
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试异常: ${error.message}`, 'red');
  process.exit(1);
});

