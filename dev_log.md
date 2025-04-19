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

## 2025-04-18 NarrFlow后端开发与Walrus主网托管实施计划

### 一、后端（链上）逻辑开发计划

1. 智能合约结构与分工
   - story.move：负责故事的创建、段落管理、投票机制、事件通知。
   - token.move：负责NARR代币的发行、奖励分发、财库管理、权限控制。
   - narr_flow.move：作为业务聚合层，负责跨模块复合逻辑、平台管理、权限校验。

2. 合约开发与测试
   - 开发原则：模块化、权限最小化、事件驱动、错误码详尽、类型安全。
   - 流程：
     1. 以move/README.md为蓝本，逐步实现/完善每个模块的核心功能。
     2. 链上只存元数据和Walrus引用，内容本体全部走Walrus存储，降低Gas。
     3. 每个合约函数都要有单元测试（sui move test），并覆盖边界和异常场景。
     4. 事件系统完善，便于前端监听链上变更。
     5. 权限与安全：敏感操作需严格校验调用者身份，防止越权和滥用。
   - 合约部署：
     - 使用最新Sui CLI，主网部署前务必在测试网全流程验证。
     - 部署流程：sui move build → sui move test → sui client publish --gas-budget 100000000
     - 记录合约包ID、模块ID，供前端和Walrus集成使用。

### 二、前后端与Walrus存储集成

1. 内容存储与链上引用
   - 内容上传：前端将段落/故事内容上传到Walrus，获得walrus_id和content_hash。
   - 链上引用：合约仅存储walrus_id、content_hash、作者、时间戳等元数据。
   - 内容校验：前端展示内容时，需用content_hash校验Walrus返回内容的完整性。

2. 前端与合约交互
   - 使用sui-kit.js或@suiet/wallet-kit等最新Sui官方SDK，配合钱包实现链上交互。
   - 通过React Hooks封装合约调用，保证代码复用和类型安全。
   - 事件监听：前端订阅合约事件，实时刷新故事、投票、奖励等状态。

3. Walrus存储与前端托管
   - 内容存储：通过Walrus SDK或API上传内容，获取ID和哈希。
   - 前端托管：使用walrus-site-builder（最新主网版）将前端静态资源一键部署到Walrus Sites。
   - SuiNS集成：为每个故事/站点分配人性化域名（如 narrflow.wal.app/xxx）。
   - 高可用性：内容多节点分布式存储，确保数据不丢失。

### 三、CI/CD与自动化部署

- CI/CD工具链：推荐用GitHub Actions或GitLab CI，集成walrus-site-builder和合约自动测试/部署脚本。
- 自动化流程：
  1. 代码push后自动运行前端构建、合约测试。
  2. 前端产物自动上传Walrus Sites，合约自动部署到Sui测试网/主网。
  3. 自动化校验合约事件、前端与链上数据一致性。

### 四、Walrus Sites主网托管流程（最新）

1. 准备工作：
   - 安装最新版walrus-site-builder和walrus-cli。
   - 确保有主网$WAL和$SUI代币。
2. 前端构建：
   - npm run build 生成静态资源。
3. 发布到Walrus Sites：
   - npx walrus-site-builder publish 或 walrus site publish，按官方文档操作。
   - 获取网站Object ID。
4. 绑定SuiNS域名（可选）：
   - 访问 http://suins.io，将Object ID绑定到自定义域名。
5. 内容上传与链上引用：
   - 前端内容上传到Walrus，链上只存引用。
6. 主网访问与推广：
   - 通过 http://wal.app 或自定义SuiNS域名访问。
   - 可将站点加入 Walrus Scan 目录，提升曝光。

### 五、技术选型与可行性保障

- Move合约：采用Sui主网最新Move标准，兼容性强，安全性高。
- 前端：React 18+、TypeScript 5+、TailwindCSS、@suiet/wallet-kit、@mysten/sui等最新生态组件。
- 存储与托管：Walrus Sites主网+Walrus内容存储，官方推荐方案，安全高可用。
- CI/CD：主流自动化工具，支持一键部署和回滚。
- 安全与合规：合约权限、内容校验、事件追踪、数据完整性验证全流程保障。

### 六、后续优化与生态拓展

- 持续关注Walrus和Sui生态的最新升级，及时适配新特性。
- 逐步引入AI写作辅助、NFT集成、DAO治理等创新功能。
- 推动社区共建，吸引更多创作者和开发者参与NarrFlow生态。

---

本实施计划结合NarrFlow业务需求、Sui+Walrus最新技术生态、Web3开发最佳实践，可行性高、扩展性强、安全合规。后续可根据主网进展和社区反馈持续优化细节，确保NarrFlow成为Web3协作叙事领域的标杆项目。 