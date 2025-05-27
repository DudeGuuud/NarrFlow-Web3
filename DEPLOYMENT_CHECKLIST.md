# NarrFlow-Web3 Vercel 部署检查清单

## 🚀 部署前检查

### 1. 代码准备
- [x] 后端代码已迁移到 `/api` 目录
- [x] 前端 API 调用已更新为使用新的 API 客户端
- [x] 环境变量配置文件已创建
- [x] `vercel.json` 配置文件已创建
- [x] 依赖包已安装 (`@vercel/node`)

### 2. 文件结构检查
```
/
├── api/                          ✅ Vercel Functions
│   ├── index.ts                  ✅ 主入口点
│   ├── health.ts                 ✅ 健康检查
│   ├── services/                 ✅ 服务层
│   ├── voting-sessions/          ✅ 投票会话 API
│   ├── proposals/                ✅ 提案 API
│   ├── books/                    ✅ 书籍 API
│   └── cron/                     ✅ 定时任务
├── src/                          ✅ 前端源码
├── dist/                         ✅ 构建输出 (运行 pnpm build 后)
├── vercel.json                   ✅ Vercel 配置
├── package.json                  ✅ 依赖管理
├── .env.example                  ✅ 环境变量示例
└── .env.production               ✅ 生产环境配置
```

### 3. API 端点映射
- [x] `GET /api/health` → 健康检查
- [x] `GET /api/voting-sessions` → 获取投票会话
- [x] `GET /api/voting-sessions/current` → 获取当前投票会话
- [x] `GET /api/proposals` → 获取提案
- [x] `POST /api/proposals` → 创建提案
- [x] `POST /api/proposals/vote` → 投票
- [x] `GET /api/proposals/vote/check/:voter` → 检查投票状态
- [x] `GET /api/proposals/stats/:author` → 获取作者统计
- [x] `GET /api/books` → 获取所有书籍
- [x] `GET /api/books/current` → 获取当前书籍
- [x] `GET /api/books/:index` → 获取指定书籍

### 4. 前端更新
- [x] 创建了 `src/lib/apiClient.ts` 统一 API 调用
- [x] 更新了 `src/pages/Create/index.tsx` 使用新 API 客户端
- [x] 更新了 `src/pages/Home/index.tsx` 使用新 API 客户端
- [x] 更新了 `src/hooks/useSuiStory.ts` 使用新 API 客户端

## 🔧 Vercel 部署步骤

### 1. 环境变量配置
在 Vercel 项目设置中配置以下环境变量：

**必需的后端环境变量:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUI_NETWORK=testnet
PACKAGE_ID=your_package_id
STORYBOOK_ID=your_storybook_id
TREASURY_ID=your_treasury_id
ADMIN_PRIVATE_KEY=your_admin_private_key
VOTING_COUNTDOWN_SECONDS=300
VOTE_THRESHOLD=2
LOG_LEVEL=info
```

**可选的前端环境变量:**
```bash
VITE_SUI_NETWORK=testnet
# VITE_API_BASE_URL 留空，让前端自动检测
```

### 2. 部署命令
```bash
# 方法 1: 使用部署脚本
./deploy-vercel.sh

# 方法 2: 手动部署
vercel --prod
```

### 3. 部署后验证
```bash
# 使用测试脚本验证 API
./test-api.sh https://your-project.vercel.app

# 或手动测试关键端点
curl https://your-project.vercel.app/api/health
curl https://your-project.vercel.app/api/voting-sessions/current
curl https://your-project.vercel.app/api/books/current
```

## 🔍 故障排除

### 常见问题

1. **函数超时**
   - 检查 Vercel 函数日志
   - 优化数据库查询
   - 减少区块链 API 调用

2. **环境变量错误**
   - 确保所有必需变量都已设置
   - 检查变量名拼写
   - 验证变量值格式

3. **CORS 错误**
   - 检查 `vercel.json` 中的 headers 配置
   - 确保前端域名正确

4. **API 调用失败**
   - 检查 API 端点路径
   - 验证请求格式
   - 查看网络请求日志

### 调试工具

1. **Vercel 控制台**
   - Functions 标签页查看函数日志
   - Deployments 标签页查看部署状态

2. **浏览器开发者工具**
   - Network 标签页查看 API 请求
   - Console 标签页查看错误信息

3. **本地测试**
   ```bash
   # 本地运行 Vercel 开发服务器
   vercel dev
   
   # 测试 API 客户端
   node test-api-client.js
   ```

## ✅ 部署成功标志

- [ ] 前端页面正常加载
- [ ] API 健康检查返回正常
- [ ] 投票会话功能正常
- [ ] 提案创建和投票功能正常
- [ ] 书籍数据正常显示
- [ ] 定时任务正常运行
- [ ] 无控制台错误

## 📚 相关文档

- [Vercel Functions 文档](https://vercel.com/docs/functions)
- [Vercel 环境变量](https://vercel.com/docs/projects/environment-variables)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [项目部署指南](./VERCEL_DEPLOYMENT.md)
