#!/bin/bash

# API 测试脚本
# 用于测试 Vercel 部署后的 API 端点

# 设置基础 URL (部署后替换为实际 URL)
BASE_URL="https://your-project.vercel.app"

if [ "$1" != "" ]; then
    BASE_URL="$1"
fi

echo "🧪 测试 NarrFlow-Web3 API 端点..."
echo "📍 基础 URL: $BASE_URL"
echo ""

# 测试健康检查
echo "1. 测试健康检查端点..."
curl -s "$BASE_URL/api/v1/health" | jq '.' || echo "❌ 健康检查失败"
echo ""

# 测试投票会话
echo "2. 测试投票会话端点..."
echo "   - 获取当前投票会话:"
curl -s "$BASE_URL/api/v1/voting-sessions/current" | jq '.' || echo "❌ 获取当前投票会话失败"
echo ""

echo "   - 获取所有投票会话:"
curl -s "$BASE_URL/api/v1/voting-sessions" | jq '.' || echo "❌ 获取所有投票会话失败"
echo ""

# 测试提案
echo "3. 测试提案端点..."
echo "   - 获取所有提案:"
curl -s "$BASE_URL/api/v1/proposals" | jq '.' || echo "❌ 获取提案失败"
echo ""

echo "   - 获取标题提案:"
curl -s "$BASE_URL/api/v1/proposals?type=title" | jq '.' || echo "❌ 获取标题提案失败"
echo ""

echo "   - 获取段落提案:"
curl -s "$BASE_URL/api/v1/proposals?type=paragraph" | jq '.' || echo "❌ 获取段落提案失败"
echo ""

# 测试书籍
echo "4. 测试书籍端点..."
echo "   - 获取所有书籍:"
curl -s "$BASE_URL/api/v1/books" | jq '.' || echo "❌ 获取所有书籍失败"
echo ""

echo "   - 获取当前书籍:"
curl -s "$BASE_URL/api/v1/books/current" | jq '.' || echo "❌ 获取当前书籍失败"
echo ""

# 测试 CORS
echo "5. 测试 CORS..."
curl -s -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS "$BASE_URL/api/v1/health" -I || echo "❌ CORS 测试失败"
echo ""

echo "✅ API 测试完成！"
echo ""
echo "📝 注意事项："
echo "- 如果某些端点返回错误，请检查环境变量配置"
echo "- 确保 Supabase 和 Sui 网络连接正常"
echo "- 查看 Vercel 函数日志获取详细错误信息"
