#!/bin/bash

# NarrFlow-Web3 Vercel 部署脚本

echo "🚀 开始部署 NarrFlow-Web3 到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 检查是否已登录
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "📝 请登录 Vercel..."
    vercel login
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建前端
echo "🔨 构建前端..."
pnpm build

# 检查必要文件
echo "✅ 检查部署文件..."
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json 文件不存在"
    exit 1
fi

if [ ! -d "api" ]; then
    echo "❌ api 目录不存在"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "❌ dist 目录不存在，请先运行构建"
    exit 1
fi

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "📋 部署后检查清单："
echo "1. 检查环境变量是否正确设置"
echo "2. 测试 API 端点是否正常工作"
echo "3. 验证前端功能是否正常"
echo "4. 设置高频率定时任务（见下方说明）"
echo ""
echo "⚠️  重要：定时任务设置"
echo "Vercel 免费账户只支持每日运行的定时任务。"
echo "为了实现每5分钟的投票检查，请选择以下方案之一："
echo ""
echo "🚀 方案 1: GitHub Actions (推荐)"
echo "1. 在 GitHub 仓库设置中添加 Secrets:"
echo "   VERCEL_APP_URL=https://your-project.vercel.app"
echo "   CRON_AUTH_TOKEN=your-random-secret-token"
echo "2. 在 Vercel 项目中添加环境变量:"
echo "   CRON_AUTH_TOKEN=your-random-secret-token"
echo "3. GitHub Actions 会自动每5分钟运行"
echo ""
echo "🌐 方案 2: 外部 Cron 服务"
echo "使用 cron-job.org 等服务调用:"
echo "POST https://your-project.vercel.app/api/trigger/check-voting"
echo "Headers: Authorization: Bearer your-secret-token"
echo ""
echo "📚 详细设置指南: ./CRON_SETUP_GUIDE.md"
echo ""
echo "🔗 有用的链接："
echo "- Vercel 控制台: https://vercel.com/dashboard"
echo "- 函数日志: https://vercel.com/dashboard -> 项目 -> Functions"
echo "- 环境变量: https://vercel.com/dashboard -> 项目 -> Settings -> Environment Variables"
