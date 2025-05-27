# 定时任务设置指南

由于 Vercel 免费账户的限制，我们需要使用外部服务来实现高频率的投票会话检查。

## 🚨 Vercel 免费账户限制

- ❌ 每分钟运行的定时任务
- ✅ 每天运行一次的定时任务

## 🛠️ 解决方案

### 方案 1: GitHub Actions (推荐，免费)

#### 步骤 1: 设置 GitHub Secrets

1. 进入你的 GitHub 仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 添加以下 Secrets：

```
VERCEL_APP_URL = https://your-project.vercel.app
CRON_AUTH_TOKEN = your-random-secret-token
```

#### 步骤 2: 在 Vercel 中添加环境变量

在 Vercel 项目设置中添加：
```
CRON_AUTH_TOKEN = your-random-secret-token
```
（与 GitHub Secret 中的值相同）

#### 步骤 3: 启用 GitHub Actions

GitHub Actions 工作流已经在 `.github/workflows/cron-trigger.yml` 中配置好了，会自动：
- 每5分钟检查投票会话
- 允许手动触发

### 方案 2: 外部 Cron 服务

#### 免费服务推荐：

1. **cron-job.org** (推荐)
   - 免费账户支持每分钟执行
   - 网址: https://cron-job.org

2. **EasyCron**
   - 免费账户支持每小时执行
   - 网址: https://www.easycron.com

#### 设置步骤：

1. 注册免费账户
2. 创建新的 Cron Job：
   - **URL**: `https://your-project.vercel.app/api/v1/trigger/check-voting`
   - **方法**: POST
   - **频率**: 每5分钟 (*/5 * * * *)
   - **Headers**:
     ```
     Authorization: Bearer your-secret-token
     Content-Type: application/json
     ```

### 方案 3: 手动触发

如果你想手动控制投票检查，可以访问：

```
https://your-project.vercel.app/api/v1/trigger/check-voting?token=your-secret-token
```

## 🔐 安全令牌生成

生成一个随机的安全令牌：

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL
openssl rand -hex 32

# 或者使用在线生成器
# https://www.uuidgenerator.net/
```

## 📊 监控和调试

### 检查 GitHub Actions 状态
1. 进入 GitHub 仓库
2. 点击 `Actions` 标签页
3. 查看工作流运行状态

### 检查 Vercel 函数日志
1. 进入 Vercel 控制台
2. 选择你的项目
3. 点击 `Functions` 标签页
4. 查看函数执行日志

### 手动测试 API
```bash
# 测试投票检查触发器
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  "https://your-project.vercel.app/api/v1/trigger/check-voting"

# 测试健康检查
curl "https://your-project.vercel.app/api/v1/health"
```

## 🎯 推荐配置

对于生产环境，我们推荐：

1. **使用 GitHub Actions** 进行定期检查（每5分钟）
2. **保留 Vercel Cron Jobs** 作为备份（每天运行）
3. **设置监控** 确保系统正常运行

这样可以确保即使 GitHub Actions 出现问题，Vercel 的每日任务仍然可以处理积压的投票会话。

## ❓ 常见问题

**Q: GitHub Actions 会消耗我的免费额度吗？**
A: GitHub Actions 对公共仓库完全免费，私有仓库每月有 2000 分钟免费额度。

**Q: 如果我升级到 Vercel Pro 会怎样？**
A: Pro 账户支持任意频率的 Cron Jobs，可以直接使用 `* * * * *` 每分钟运行。

**Q: 外部 Cron 服务可靠吗？**
A: 大多数服务都很可靠，但建议同时使用多种方案以确保冗余。
