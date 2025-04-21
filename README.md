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

1. **story.move** - 故事与段落管理
   - 创建和管理故事（Book）
   - 添加段落（Paragraph），链上仅存 walrus_id 或内容哈希，正文链下存储
   - 投票系统和归档机制，所有元数据链上透明可查

2. **token.move** - 代币和奖励系统
   - NARR代币管理与财库
   - 用户奖励发放（创作、投票、获胜等）
   - 管理员权限控制

3. **narr_flow.move** - 核心业务逻辑模块
   - 连接故事和代币模块，聚合业务流程
   - 所有合约接口均为 entry fun，便于前端直接调用
   - 奖励逻辑与事件系统分离，便于扩展

### 最新数据结构（2024-06）
- **StoryBook**：全局唯一对象，管理所有 Book，current_book_index 指示当前活跃书本
- **Book**：包含标题、作者、状态、段落列表等
- **Paragraph**：链上仅存 walrus_id（或内容哈希）与投票数，正文链下存储

## 存储策略

NarrFlow采用Walrus作为存储解决方案，具有以下优势：

- **链上存元数据，链下存正文**：正文内容全部存储于 Walrus，链上仅存 walrus_id 或内容哈希，极大降低链上成本
- **内容哈希校验**：前端上传内容到 Walrus 前先计算内容哈希，链上可存储哈希值用于一致性校验，防止内容被篡改
- **内容可追溯**：每个段落的 walrus_id 唯一，用户可通过 narrflow.wal.app/[walrus_id] 访问原文
- **高可用性**：Walrus 多节点分布式存储，内容永不丢失
- **SuiNS集成**：利用SuiNS提供人性化域名，无需传统DNS

### 内容上链流程
1. 前端输入正文，计算哈希并上传到 Walrus，获得 walrus_id
2. 前端调用合约，将 walrus_id、作者地址、内容哈希等写入链上 Paragraph
3. 任何人可通过链上哈希与 Walrus 返回内容比对，验证内容未被篡改

## 前端集成与Provider体系
- 采用 @mysten/dapp-kit 和 @tanstack/react-query，统一管理 SuiClient 和钱包上下文
- 所有合约调用均通过官方 Provider 体系封装，保证类型安全和上下文一致性
- hooks 路径规范，统一为 src/hooks/useSuiStoryWithWalrus

## 安装与使用

### 前端

```bash
# 克隆仓库
git clone https://github.com/DudeGuuud/NarrFlow-Web3.git
cd NarrFlow-Web3

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 部署到Walrus Sites
pnpx walrus-site-builder publish
```

### 智能合约

```bash
# 切换到合约目录
cd move

# 编译合约
sui move build

# 部署合约
sui client publish
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

##了解更多信息请看
NarrFlow-Web3/demonstrate.md
NarrFlow-Web3/dev_log.md

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请先fork本仓库，创建功能分支，然后提交PR。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。 