# Vercel 环境变量设置指南

## 🚨 重要：立即设置环境变量

部署成功了，但需要在 Vercel 控制台中设置环境变量才能正常工作。

## 📍 访问链接

- **项目主页**: https://narr-flow-web3-ikg2lbv0j-hexos-projects-08fd0872.vercel.app
- **Vercel 控制台**: https://vercel.com/hexos-projects-08fd0872/narr-flow-web3

## 🔧 设置步骤

### 1. 进入 Vercel 控制台
1. 访问: https://vercel.com/dashboard
2. 找到项目: `narr-flow-web3`
3. 点击项目名称进入项目页面

### 2. 配置环境变量
1. 点击 `Settings` 标签页
2. 点击左侧菜单中的 `Environment Variables`
3. 添加以下环境变量：

```bash
# 必需的区块链配置
PACKAGE_ID=0xa47599a6525da242f712bec2601dceab88f4785c6f549bb412eee30f15ed623d
STORYBOOK_ID=0x67cea7bae77db8331e56858125809f578d46b17156e8ad5aaf5bb44a3bea416d
TREASURY_ID=0xffca3c14c8273a07dccdd84b3c35529ad796063814eb031d2cdd6b66b6b079e9
SUI_NETWORK=testnet

# 数据库配置
SUPABASE_URL=https://qkulpswpdqcuazgtnbqv.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWxwc3dwZHFjdWF6Z3RuYnF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM1NjczMywiZXhwIjoyMDYxOTMyNzMzfQ.yJiO9FaXcp4sdTZd3FSX7lEW0kI_0LBEl0DQ_3dKjHw

# 管理员钱包
ADMIN_PRIVATE_KEY=suiprivkey1qz3ayksckrdl9xamm5rtd64fdh782kxexcdsdckm3u69eqxu3h24udnu5jq

# 应用配置
VOTING_COUNTDOWN_SECONDS=300
VOTE_THRESHOLD=2
LOG_LEVEL=info

# 定时任务认证（可选）
CRON_AUTH_TOKEN=your-random-secret-token
```

### 3. 环境设置
对于每个环境变量：
- **Name**: 变量名（如 `PACKAGE_ID`）
- **Value**: 变量值
- **Environment**: 选择 `Production`, `Preview`, `Development` 或全选

### 4. 重新部署
设置完环境变量后：
1. 回到项目主页
2. 点击 `Deployments` 标签页
3. 点击最新部署右侧的三个点 `...`
4. 选择 `Redeploy`
5. 确认重新部署

## 🧪 测试 API

重新部署完成后，测试以下端点：

### 健康检查
```bash
curl https://narr-flow-web3-ikg2lbv0j-hexos-projects-08fd0872.vercel.app/api/v1/health
```

### 投票会话
```bash
curl https://narr-flow-web3-ikg2lbv0j-hexos-projects-08fd0872.vercel.app/api/v1/voting-sessions/current
```

### 提案列表
```bash
curl https://narr-flow-web3-ikg2lbv0j-hexos-projects-08fd0872.vercel.app/api/v1/proposals
```

## 🔍 调试步骤

如果 API 仍然不工作：

### 1. 检查函数日志
1. 在 Vercel 控制台中点击 `Functions` 标签页
2. 点击函数名称查看日志
3. 查找错误信息

### 2. 检查环境变量
1. 确保所有必需的环境变量都已设置
2. 检查变量值是否正确（没有多余的空格）
3. 确保选择了正确的环境（Production）

### 3. 重新部署
```bash
cd /home/linuxuser/NarrFlow-Web3
vercel --prod
```

## 📱 前端测试

环境变量设置完成后，前端应该能够：
1. 正常加载页面
2. 连接钱包
3. 获取投票会话
4. 创建和投票提案
5. 查看书籍数据

## 🎯 成功标志

当一切正常工作时，你应该看到：
- ✅ API 健康检查返回 JSON 响应
- ✅ 前端页面正常显示
- ✅ 钱包连接功能正常
- ✅ 投票和提案功能正常

## 🆘 如果遇到问题

1. **检查 Vercel 函数日志**：在控制台查看详细错误信息
2. **验证环境变量**：确保所有值都正确设置
3. **重新部署**：有时需要重新部署才能生效
4. **联系支持**：如果问题持续存在，可以查看 Vercel 文档或联系支持

---

**下一步**: 设置完环境变量并重新部署后，项目就完全可以正常使用了！
