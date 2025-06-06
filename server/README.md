# NarrFlow 后端服务

这个后端服务负责管理NarrFlow的投票倒计时和自动执行链上交易。

## 功能

1. 自动管理投票会话，包括创建、监控和结束
2. 倒计时结束后自动选出得票最高的提案
3. 使用管理员钱包自动执行链上交易（添加段落、开始新书、归档书籍）
4. 自动奖励提案作者
5. 清理数据库，准备下一轮投票

## 安装

```bash
# 安装依赖
npm install

# 或使用 pnpm
pnpm install
```

## 配置

在项目根目录的 `.env` 文件中设置以下变量：

```
# 管理员钱包配置
ADMIN_PRIVATE_KEY=你的私钥（Base64编码）

# 投票配置
VOTING_COUNTDOWN_SECONDS=300  # 投票倒计时时间（秒）
VOTE_THRESHOLD=2              # 最低投票阈值
```

## 数据库设置

在启动服务器之前，需要先设置数据库表：

```bash
# 运行数据库设置脚本
node setup-db.js
```

这将创建以下表：
- `voting_sessions` - 跟踪投票会话
- `proposal_stats` - 跟踪提案统计信息

## 运行服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器默认在端口 3001 上运行。

## API 端点

- `GET /api/health` - 检查服务器状态

## 自动化任务

服务器使用 cron 任务每分钟检查一次过期的投票会话。当投票会话过期时，它会：

1. 选择得票最高的提案
2. 使用管理员钱包执行相应的链上交易
3. 清理数据库中的提案和投票
4. 开始新的投票会话

## 故障排除

如果遇到问题，请检查：

1. `.env` 文件中的私钥是否正确
2. Supabase 连接是否正常
3. 合约 ID 是否正确
4. 管理员钱包是否有足够的 SUI 代币支付交易费用

## 日志

服务器会在控制台输出详细的日志，包括：

- 投票会话状态变化
- 交易执行结果
- 错误信息

这些日志对于调试问题非常有用。
