# NarrFlow-Web3 Vercel 部署指南

## 概述

本项目已成功迁移到 Vercel 无服务器架构。后端 Express 应用已转换为 Vercel Functions，前端保持不变。

## 项目结构

```
/
├── api/                          # Vercel Functions (后端 API)
│   ├── index.ts                  # 主入口点和配置
│   ├── health.ts                 # 健康检查端点
│   ├── services/                 # 服务层
│   │   ├── blockchainService.ts  # 区块链交互
│   │   ├── databaseService.ts    # 数据库操作
│   │   └── votingService.ts      # 投票逻辑
│   ├── voting-sessions/          # 投票会话 API
│   │   ├── index.ts              # GET /api/voting-sessions
│   │   └── current.ts            # GET /api/voting-sessions/current
│   ├── proposals/                # 提案 API
│   │   ├── index.ts              # GET/POST /api/proposals
│   │   ├── vote.ts               # POST /api/proposals/vote
│   │   ├── vote/check/[voter].ts # GET /api/proposals/vote/check/:voter
│   │   └── stats/[author].ts     # GET /api/proposals/stats/:author
│   ├── books/                    # 书籍 API
│   │   ├── index.ts              # GET /api/books
│   │   ├── current.ts            # GET /api/books/current
│   │   └── [index].ts            # GET /api/books/:index
│   └── cron/                     # 定时任务
│       ├── check-voting-sessions.ts
│       └── cleanup-old-sessions.ts
├── src/                          # 前端源码 (React + Vite)
├── vercel.json                   # Vercel 配置
└── package.json                  # 依赖管理
```

## API 端点映射

原始 Express 路由已转换为以下 Vercel Functions：

### 投票会话
- `GET /api/voting-sessions` → `/api/voting-sessions/index.ts`
- `GET /api/voting-sessions/current` → `/api/voting-sessions/current.ts`

### 提案
- `GET /api/proposals` → `/api/proposals/index.ts`
- `POST /api/proposals` → `/api/proposals/index.ts`
- `POST /api/proposals/vote` → `/api/proposals/vote.ts`
- `GET /api/proposals/vote/check/:voter` → `/api/proposals/vote/check/[voter].ts`
- `GET /api/proposals/stats/:author` → `/api/proposals/stats/[author].ts`

### 书籍
- `GET /api/books` → `/api/books/index.ts`
- `GET /api/books/current` → `/api/books/current.ts`
- `GET /api/books/:index` → `/api/books/[index].ts`

### 其他
- `GET /api/health` → `/api/health.ts`

## 环境变量

在 Vercel 项目设置中配置以下环境变量：

```bash
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Sui 区块链配置
SUI_NETWORK=testnet
PACKAGE_ID=your_package_id
STORYBOOK_ID=your_storybook_id
TREASURY_ID=your_treasury_id
ADMIN_PRIVATE_KEY=your_admin_private_key

# 投票配置
VOTING_COUNTDOWN_SECONDS=300
VOTE_THRESHOLD=2
LOG_LEVEL=info
```

## 部署步骤

### 1. 准备代码
确保所有文件都已提交到 Git 仓库。

### 2. 连接到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择你的 NarrFlow-Web3 仓库

### 3. 配置项目
1. **Framework Preset**: 选择 "Vite"
2. **Root Directory**: 保持默认 "./"
3. **Build Command**: `pnpm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `pnpm install`

> **注意**: Vercel 会自动检测到 `vercel.json` 配置文件并使用其中的设置。

### 4. 设置环境变量
在 Vercel 项目设置中添加所有必需的环境变量。

### 5. 部署
点击 "Deploy" 按钮开始部署。

## 定时任务 (Cron Jobs)

### Vercel 免费账户限制

⚠️ **重要**: Vercel 免费（Hobby）账户只支持每日运行一次的定时任务。

项目配置了两个定时任务（适用于免费账户）：

1. **检查投票会话**: 每天午夜运行
   - 路径: `/api/cron/check-voting-sessions`
   - 调度: `0 0 * * *`

2. **清理旧会话**: 每天中午运行
   - 路径: `/api/cron/cleanup-old-sessions`
   - 调度: `0 12 * * *`

### 高频率定时任务解决方案

为了实现更频繁的投票检查，我们提供了以下替代方案：

#### 方案 1: GitHub Actions (推荐)
使用 GitHub Actions 每5分钟触发一次投票检查：

1. 在 GitHub 仓库设置中添加 Secrets：
   ```
   VERCEL_APP_URL=https://your-project.vercel.app
   CRON_AUTH_TOKEN=your-secret-token
   ```

2. GitHub Actions 会自动运行 `.github/workflows/cron-trigger.yml`

#### 方案 2: 外部 Cron 服务
使用 cron-job.org、EasyCron 等免费服务：

- URL: `https://your-project.vercel.app/api/trigger/check-voting`
- 方法: POST
- 频率: 每5分钟
- Headers: `Authorization: Bearer your-secret-token`

#### 方案 3: 手动触发
访问以下 URL 手动触发检查：
```
https://your-project.vercel.app/api/trigger/check-voting?token=your-secret-token
```

## 本地开发

### 使用 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 本地开发
vercel dev
```

### 使用 Vite (仅前端)
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 注意事项

1. **无服务器限制**: Vercel Functions 有执行时间限制，复杂操作可能需要优化
2. **冷启动**: 函数可能有冷启动延迟
3. **并发限制**: 免费计划有并发执行限制
4. **数据库连接**: 使用连接池避免连接数过多

## 故障排除

### 常见问题

1. **环境变量未设置**
   - 检查 Vercel 项目设置中的环境变量
   - 确保所有必需变量都已配置

2. **函数超时**
   - 检查函数执行时间
   - 优化数据库查询和区块链调用

3. **CORS 错误**
   - 检查 `api/index.ts` 中的 CORS 配置
   - 确保前端域名在允许列表中

### 日志查看
在 Vercel 控制台的 "Functions" 标签页可以查看函数执行日志。

## 性能优化

1. **缓存策略**: 使用 Vercel 的边缘缓存
2. **数据库优化**: 优化 Supabase 查询
3. **区块链调用**: 减少不必要的区块链 API 调用
4. **函数大小**: 保持函数包大小最小

## 监控

使用 Vercel Analytics 和 Speed Insights 监控应用性能：
- 页面加载时间
- 函数执行时间
- 错误率
- 用户体验指标
