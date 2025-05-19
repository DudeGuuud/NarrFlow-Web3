# NarrFlow-Web3 部署指南

本文档提供了两种部署 NarrFlow-Web3 项目的方法：
1. 交互式本地部署（适合开发环境或需要定制化配置）
2. 自动化远程服务器部署（适合生产环境）

## 前置条件

### 必要条件
- Git
- Node.js 18+
- npm 或 pnpm
- Supabase 账户和项目
- 管理员钱包私钥（用于执行链上交易）

### 可选条件
- Sui CLI（如需部署智能合约）
- PM2（进程管理）
- Nginx（Web服务器）

## 1. 交互式本地部署

交互式部署脚本 `deploy.sh` 提供了一个引导式的部署过程，适合开发环境或需要定制化配置的场景。

### 使用方法

1. 下载部署脚本：
   ```bash
   curl -O https://raw.githubusercontent.com/DudeGuuud/NarrFlow-Web3/main/deploy.sh
   chmod +x deploy.sh
   ```

2. 运行部署脚本：
   ```bash
   ./deploy.sh
   ```

3. 按照提示输入必要的配置信息：
   - 区块链配置（PACKAGE_ID, STORYBOOK_ID, TREASURY_ID, SUI_NETWORK）
   - 数据库配置（SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY）
   - 管理员钱包私钥（ADMIN_PRIVATE_KEY）
   - 投票配置（VOTING_COUNTDOWN_SECONDS, VOTE_THRESHOLD）
   - 服务端口（PORT）

4. 脚本将自动执行以下步骤：
   - 检查必要工具
   - 克隆仓库
   - 创建环境变量文件
   - 设置数据库（需手动执行SQL）
   - 构建前端和后端
   - 部署后端服务
   - 部署前端（支持Nginx或serve）
   - 部署智能合约（可选）
   - 设置定时任务（可选）

### 注意事项

- 脚本会提示您在Supabase控制台中执行SQL语句来创建必要的数据库表
- 如果选择使用Nginx部署前端，可能需要root权限
- 智能合约部署需要安装Sui CLI并配置好钱包

## 2. 自动化远程服务器部署

自动化部署脚本 `remote_deploy.sh` 适用于在全新的远程服务器上快速部署NarrFlow-Web3项目，适合生产环境。

### 使用方法

1. 准备环境变量：
   在运行脚本前，需要设置以下环境变量：
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-anon-key"
   export SUPABASE_SERVICE_KEY="your-service-role-key"
   export ADMIN_PRIVATE_KEY="your-admin-wallet-private-key"
   
   # 可选配置（有默认值）
   export PACKAGE_ID="0xa47599a6525da242f712bec2601dceab88f4785c6f549bb412eee30f15ed623d"
   export STORYBOOK_ID="0x67cea7bae77db8331e56858125809f578d46b17156e8ad5aaf5bb44a3bea416d"
   export TREASURY_ID="0xffca3c14c8273a07dccdd84b3c35529ad796063814eb031d2cdd6b66b6b079e9"
   export SUI_NETWORK="testnet"
   export VOTING_COUNTDOWN_SECONDS="300"
   export VOTE_THRESHOLD="10"
   export PORT="3001"
   ```

2. 下载并运行部署脚本：
   ```bash
   curl -O https://raw.githubusercontent.com/DudeGuuud/NarrFlow-Web3/main/remote_deploy.sh
   chmod +x remote_deploy.sh
   sudo ./remote_deploy.sh
   ```

3. 脚本将自动执行以下步骤：
   - 安装系统依赖
   - 安装Node.js、pnpm和PM2
   - 克隆仓库
   - 创建环境变量文件
   - 构建前端和后端
   - 部署后端服务
   - 配置Nginx
   - 设置定时任务
   - 配置防火墙
   - 显示部署信息

### 注意事项

- 此脚本需要root权限运行
- 脚本假设使用的是基于Debian/Ubuntu的Linux系统
- 部署完成后，应该在Supabase控制台中手动创建必要的数据库表
- 脚本会自动配置防火墙，开放SSH、HTTP和HTTPS端口

## 数据库设置

无论使用哪种部署方法，都需要在Supabase中创建以下表：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建投票会话表
CREATE TABLE IF NOT EXISTS public.voting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('title', 'paragraph')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建提案表
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('title', 'paragraph')),
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建投票表
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  voter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(voter)
);

-- 创建提案统计表
CREATE TABLE IF NOT EXISTS public.proposal_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author TEXT NOT NULL UNIQUE,
  proposals_submitted INTEGER NOT NULL DEFAULT 0,
  proposals_won INTEGER NOT NULL DEFAULT 0,
  votes_received INTEGER NOT NULL DEFAULT 0,
  tokens_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建允许服务角色完全访问的策略
CREATE POLICY "允许服务角色完全访问投票会话" ON public.voting_sessions USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问提案" ON public.proposals USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问投票" ON public.votes USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问提案统计" ON public.proposal_stats USING (auth.role() = 'service_role');
```

## 故障排除

### 常见问题

1. **部署脚本执行失败**
   - 检查是否有足够的权限
   - 确保所有必要的环境变量都已设置
   - 查看错误日志，定位具体问题

2. **前端无法连接后端**
   - 确认后端服务正在运行：`pm2 status`
   - 检查Nginx配置是否正确
   - 验证防火墙设置是否允许相应端口的流量

3. **数据库连接问题**
   - 验证Supabase URL和密钥是否正确
   - 确认数据库表已正确创建
   - 检查RLS策略是否正确设置

4. **智能合约交互问题**
   - 确认管理员钱包私钥格式正确
   - 检查钱包是否有足够的SUI代币支付交易费用
   - 验证合约ID是否正确

### 日志查看

- 查看后端日志：`pm2 logs narrflow-backend`
- 查看Nginx日志：`tail -f /var/log/nginx/error.log`
- 查看系统日志：`journalctl -u nginx`

## 更新部署

要更新已部署的应用程序：

1. 进入项目目录：`cd /var/www/NarrFlow-Web3`
2. 拉取最新代码：`git pull`
3. 重新构建前端：`pnpm install && pnpm build`
4. 重新构建后端：`cd server && npm install && npm run build`
5. 重启后端服务：`pm2 restart narrflow-backend`
6. 如果使用Nginx，无需重启；如果使用serve，重启前端：`pm2 restart narrflow-frontend`

## 安全建议

1. 定期更新系统和依赖包
2. 使用HTTPS而非HTTP（可使用Let's Encrypt配置SSL）
3. 保护好管理员钱包私钥
4. 定期备份数据库
5. 监控服务器资源使用情况

## 支持

如有问题，请提交GitHub Issue或联系项目维护者。
