# NarrFlow 开发日志

## 项目概述
NarrFlow是一个基于区块链技术的去中心化协作小说创作平台，使用React + TypeScript开发前端，Move语言开发智能合约。

## 2024-03-22 项目启动

### 1. 技术栈选择
#### 前端技术
- 核心框架：React 18 + TypeScript
- 样式解决方案：TailwindCSS + CSS Modules
- 动画库：
  - Framer Motion (组件动画)
  - GSAP (复杂动画序列)
  - React Spring (物理动画效果)
- 状态管理：Redux Toolkit
- 构建工具：Vite
- 代码规范：ESLint + Prettier

#### 区块链相关
- 智能合约：Move on Sui
- Web3交互：sui-kit.js
- 钱包连接：Sui Wallet
- 存储解决方案：Walrus

### 2. 项目结构规划
```bash
Demo/
├── public/
│   ├── fonts/
│   └── images/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── features/
│   ├── pages/
│   ├── styles/
│   ├── hooks/
│   ├── store/
│   └── utils/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

### 3. 开发计划

#### Phase 1: 基础框架搭建 (Day 1-2)
- [ ] 项目初始化
- [ ] 依赖安装
- [ ] 基础配置
- [ ] 路由设置
- [ ] 主题配置
- [ ] 动画系统搭建

#### Phase 2: 核心组件开发 (Day 3-4)
- [ ] Button组件
- [ ] Card组件
- [ ] Header组件
- [ ] Input组件
- [ ] Footer组件
- [ ] Sidebar组件

#### Phase 3: 功能组件开发 (Day 5-6)
- [ ] StoryCard组件
- [ ] VotingPanel组件
- [ ] WritingEditor组件
- [ ] WalletConnect组件

#### Phase 4: 页面开发 (Day 7-8)
- [ ] Home页面
- [ ] Story页面
- [ ] Create页面
- [ ] Profile页面

#### Phase 5: 动画优化 (Day 9)
- [ ] 页面转场动画
- [ ] 组件动画
- [ ] 微交互动画
- [ ] 加载动画

#### Phase 6: 测试和优化 (Day 10)
- [ ] 单元测试
- [ ] E2E测试
- [ ] 性能优化
- [ ] 响应式适配

### 4. 下一步工作
1. 完成项目初始化和环境配置
2. 搭建基础项目结构
3. 开始开发基础组件

## 2024-04-17 Phase 1完成

### 完成内容
1. 完成项目初始化和基础配置
   - 创建项目和安装依赖
   - 配置TailwindCSS和主题
   - 设置TypeScript配置
   - 配置ESLint和Prettier

2. 基础UI组件开发
   - 完成导航栏组件
   - 实现书籍组件和翻页动画
   - 添加卡片组件
   - 开发主页布局

3. 国际化功能实现
   - 创建语言上下文
   - 实现中英文切换功能
   - 添加自动检测浏览器语言功能
   - 支持持久化语言偏好

4. 动画系统搭建
   - 实现页面过渡动画
   - 添加元素进入/退出动画
   - 设计导航菜单动画
   - 实现书页翻转效果

### 存在问题
1. 需要完善响应式布局，特别是在小屏幕设备上
2. 部分组件需要进一步优化性能
3. 尚未与区块链集成

## 2024-05-15 区块链智能合约开发完成

### 完成内容
1. 智能合约架构设计
   - 设计三个核心模块：故事模块、代币模块和主业务模块
   - 规划模块间交互和数据流动
   - 确定权限模型和安全机制

2. 故事管理模块（story.move）
   - 实现故事创建功能
   - 开发段落添加和管理功能
   - 实现投票机制
   - 设计段落提案系统
   - 添加事件系统以便前端追踪

3. 代币系统模块（token.move）
   - 创建NARR代币及其特性
   - 实现代币铸造和财库管理
   - 开发奖励分发机制
   - 实现多种奖励类型（创作、投票、获胜提案等）
   - 添加管理员权限控制

4. 主业务逻辑模块（narr_flow.move）
   - 集成故事和代币模块
   - 实现业务复合功能
   - 添加平台管理功能
   - 设计权限控制系统

### 技术亮点
1. 使用Move语言的类型安全特性确保合约安全
2. 实现完善的事件系统供前端订阅链上变更
3. 建立灵活的奖励机制，鼓励用户参与
4. 采用分层架构设计，确保模块间低耦合
5. 实现链上投票和共识机制

### 下一步工作
1. 前端集成
   - 实现钱包连接
   - 开发交易构建和发送功能
   - 监听链上事件并更新UI
   - 实现故事创建和参与流程

2. 测试与优化
   - 单元测试智能合约函数
   - 集成测试前后端交互
   - 安全审计和性能优化

## 2024-05-20 存储策略优化：采用Walrus解决方案

### 完成内容
1. 存储策略设计
   - 评估多种存储方案（全链上、IPFS、Arweave）
   - 确定使用Walrus作为最佳存储解决方案
   - 设计内容存储与检索流程

2. 数据模型优化
   - 修改Paragraph结构，添加walrus_id字段
   - 设计内容哈希验证机制
   - 优化链上存储，减少gas消耗

3. Walrus集成规划
   - 研究Walrus Sites托管前端方案
   - 设计内容上传到Walrus的API流程
   - 规划SuiNS域名集成计划

4. 文档更新
   - 更新README.md和技术文档
   - 创建详细的demonstrate.md演示文档
   - 修订合约相关文档

### 技术亮点
1. 使用Sui生态原生存储方案，无需跨链操作
2. Walrus提供高数据可用性，确保内容不会丢失
3. 为每个故事/段落创建专属可访问页面
4. 大幅降低链上存储成本，同时保持内容完整性验证
5. 通过SuiNS实现人性化域名，简化用户访问

### 特别优势
1. **前端托管**：利用Walrus Sites部署前端，无需维护服务器
2. **内容存储**：Walrus提供可靠的去中心化存储，优于普通IPFS
3. **专属页面**：可创建形如narrflow.wal.app/[故事ID]的专属页面
4. **原生集成**：与Sui智能合约完美融合，操作简便
5. **用户体验**：提供接近传统Web应用的流畅体验

### 下一步工作
1. 实现Walrus SDK集成
   - 添加内容上传到Walrus的功能
   - 实现从Walrus检索内容的函数
   - 开发内容哈希验证系统

2. 部署与测试
   - 使用site-builder部署前端到Walrus Sites
   - 注册SuiNS域名(narrflow.wal.app)
   - 测试完整内容流程

## 注意事项
1. 所有组件必须包含动画效果
2. 确保响应式设计
3. 优化性能和加载速度
4. 保持代码质量和可维护性

# UI 和样式相关
npm install tailwindcss postcss autoprefixer @tailwindcss/forms
npm install framer-motion gsap @react-spring/web
npm install @ant-design/icons

# 状态管理
npm install @reduxjs/toolkit react-redux

# 路由
npm install react-router-dom

# Web3 相关
npm install @mysten/sui-kit @mysten/wallet-kit

# Walrus 相关
npm install walrus-site-builder

# 开发工具
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D husky lint-staged 