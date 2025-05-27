#!/usr/bin/env node

// 简单的 API 客户端测试脚本
// 用于测试本地开发环境的 API 端点

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`\n🧪 测试: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ 成功 (${response.status}):`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ 失败 (${response.status}):`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`💥 错误:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 开始测试 NarrFlow API 端点...');
  console.log(`📍 API 基础 URL: ${API_BASE_URL}`);
  
  // 测试健康检查
  await testApi('/api/health');
  
  // 测试投票会话
  await testApi('/api/voting-sessions');
  await testApi('/api/voting-sessions/current');
  
  // 测试提案
  await testApi('/api/proposals');
  await testApi('/api/proposals?type=title');
  await testApi('/api/proposals?type=paragraph');
  
  // 测试书籍
  await testApi('/api/books');
  await testApi('/api/books/current');
  
  console.log('\n✅ API 测试完成！');
}

// 如果是直接运行这个脚本
if (require.main === module) {
  // 检查是否有 fetch
  if (typeof fetch === 'undefined') {
    console.log('❌ 需要 Node.js 18+ 或安装 node-fetch');
    process.exit(1);
  }
  
  runTests().catch(console.error);
}

module.exports = { testApi, runTests };
