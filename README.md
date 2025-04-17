# NarrFlow - 协作叙事平台

NarrFlow 是一个基于区块链技术的去中心化协作小说创作平台，允许用户共同创作故事并获得代币奖励。平台支持故事创建、段落添加、投票决策，结合了创作自由与社区共识机制。

## 功能特性

- **协作创作**：多人参与故事创作，共同决定情节发展
- **投票机制**：社区投票选出最佳段落提案，确保高质量内容
- **代币奖励**：创作者和参与者可获得NARR代币奖励
- **全链上治理**：投票和决策完全透明，永久记录在区块链上
- **Walrus存储**：故事内容安全存储在Sui生态的Walrus系统中
- **移动友好**：响应式设计，支持多端访问
- **多语言支持**：内置中英文界面切换

## 技术栈

### 前端技术
- **框架**：React 18 + TypeScript
- **样式**：TailwindCSS + CSS Modules
- **动画**：Framer Motion、GSAP、React Spring
- **状态管理**：Redux Toolkit
- **构建工具**：Vite
- **托管**：Walrus Sites

### 区块链技术
- **智能合约**：Move on Sui
- **Web3交互**：sui-kit.js
- **钱包连接**：Sui Wallet
- **内容存储**：Walrus

## 智能合约模块

项目包含三个主要合约模块：

1. **story.move** - 故事创建和投票管理
   - 创建和管理故事
   - 添加段落、提交提案
   - 投票系统和胜出提案选择

2. **token.move** - 代币和奖励系统
   - NARR代币管理
   - 用户奖励发放
   - 财库管理

3. **narr_flow.move** - 核心业务逻辑模块
   - 连接故事和代币模块
   - 处理复合业务逻辑
   - 权限管理

## 存储策略

NarrFlow采用Walrus作为存储解决方案，具有以下优势：

- **前端托管**：使用Walrus Sites部署前端应用，无需管理服务器
- **内容存储**：故事和段落内容存储在Walrus中，确保持久性
- **专属页面**：每个故事拥有专属URL（narrflow.wal.app/[故事ID]）
- **SuiNS集成**：利用SuiNS提供人性化域名，无需传统DNS
- **高数据可用性**：去中心化存储确保内容不会丢失

## 安装与使用

### 前端

```bash
# 克隆仓库
git clone https://github.com/DudeGuuud/NarrFlow-Web3.git
cd NarrFlow-Web3

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 部署到Walrus Sites
npx walrus-site-builder publish
```

### 智能合约

```bash
# 切换到合约目录
cd move

# 编译合约
sui move build

# 部署合约
sui client publish --gas-budget 100000000
```

## 开发状态

项目目前处于积极开发阶段：

- ✅ 前端基础框架搭建
- ✅ 基础UI组件开发
- ✅ 国际化功能实现
- ✅ 智能合约核心功能开发
- ✅ 代币系统实现
- 🔄 Walrus存储集成 (进行中)
- 🔄 用户体验优化 (进行中)
- ⬜ 测试与部署 (计划中)

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请先fork本仓库，创建功能分支，然后提交PR。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。 