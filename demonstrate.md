# NarrFlow 项目演示

## 目录

1. 项目概述
2. 产品架构
3. 技术实现
4. 智能合约设计
5. 存储策略对比
6. 代币经济
7. 用户流程
8. 未来发展

---

## 1. 项目概述

### NarrFlow：去中心化协作叙事平台

**核心理念**：让创作成为集体智慧的结晶

```mermaid
graph LR
    A[创作者] --> B[故事创建]
    C[参与者] --> D[提案贡献]
    E[社区] --> F[投票决策]
    B & D & F --> G[共创故事]
    G --> H[奖励分配]
    H --> A & C & E
```

### 关键特性

- 📝 **协作创作**：多人参与，共同构建
- 🗳️ **社区投票**：决定故事走向
- 💰 **代币激励**：奖励贡献者
- 🔄 **透明公正**：区块链确保过程可信
- 🌍 **全球参与**：打破地域限制

---

## 2. 产品架构

### 系统架构

```mermaid
flowchart TB
    subgraph "前端应用"
        UI[用户界面] --> DappKit[Sui Dapp Kit]
        UI --> State[状态管理]
        UI --> I18n[国际化]
    end
    
    subgraph "后端服务"
        API[API服务] --> IPFS[IPFS/Arweave]
        API --> IndexDB[索引数据库]
    end
    
    subgraph "区块链层"
        SM[故事模块] <--> TM[代币模块]
        SM & TM <--> CM[核心模块]
    end
    
    DappKit <--> CM
    API <--> IndexDB
    CM --> IndexDB
```

### 技术栈

**前端**
- React + TypeScript
- TailwindCSS
- Framer Motion

**区块链**
- Sui Move 智能合约
- Sui Wallet 集成

**存储**
- IPFS/Arweave (内容存储)
- Sui 链上存储 (状态和元数据)

---

## 3. 技术实现

### 前端实现

```mermaid
graph TD
    A[用户界面] --> B[组件库]
    A --> C[页面路由]
    
    B --> D[通用组件]
    B --> E[业务组件]
    
    F[钱包连接] --> G[交易构建]
    F --> H[事件监听]
    
    I[状态管理] --> J[用户状态]
    I --> K[故事状态]
    I --> L[交易状态]
```

### 链上交互流程

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 钱包
    participant 智能合约
    participant 存储服务
    
    用户->>前端: 创建故事/提交段落
    前端->>存储服务: 上传内容
    存储服务-->>前端: 返回内容哈希
    前端->>钱包: 请求签名交易
    钱包->>用户: 确认交易
    用户->>钱包: 批准
    钱包->>智能合约: 提交交易
    智能合约-->>钱包: 返回结果
    钱包-->>前端: 更新状态
    前端-->>用户: 显示结果
```

---

## 4. 智能合约设计

### 模块结构

```mermaid
classDiagram
    class StoryModule {
        +create_story()
        +add_paragraph()
        +start_voting()
        +cast_vote()
        +complete_story()
    }
    
    class TokenModule {
        +reward_story_creation()
        +reward_paragraph_addition()
        +reward_winning_proposal()
        +reward_voter()
        +admin_reward()
    }
    
    class CoreModule {
        +create_story_with_reward()
        +add_paragraph_with_reward()
        +vote_with_reward()
        +end_voting_with_reward()
    }
    
    CoreModule --> StoryModule
    CoreModule --> TokenModule
```

### 数据模型

```mermaid
classDiagram
    class Story {
        +UID id
        +String title
        +address author
        +vector~Paragraph~ paragraphs
        +Option~VotingSession~ current_voting
        +bool completed
    }
    
    class Paragraph {
        +String/Hash content
        +address author
        +u64 timestamp
    }
    
    class VotingSession {
        +vector~ParagraphProposal~ proposals
        +Table~address,u64~ votes
        +u64 start_time
        +u64 end_time
    }
    
    class Treasury {
        +UID id
        +Balance~NARR~ balance
        +address admin
    }
    
    Story "1" *-- "many" Paragraph
    Story "1" *-- "0..1" VotingSession
    VotingSession "1" *-- "many" ParagraphProposal
```

---

## 5. 存储策略对比

### 方案比较

| 特性 | 链上存储全文 | 链上存储哈希 |
|------|--------------|--------------|
| Gas成本 | 高 | 低 |
| 去中心化程度 | 完全去中心化 | 部分去中心化 |
| 内容大小限制 | 严格受限 | 几乎无限制 |
| 读取性能 | 较慢 | 较快 |
| 实现复杂度 | 简单 | 中等 |
| 多媒体支持 | 困难 | 容易 |
| 长期存储风险 | 低 | 中等 |

### 链上全文存储

```mermaid
graph LR
    A[用户] --> B[创建内容]
    B --> C[交易提交]
    C --> D[区块链存储]
    D --> E[前端读取]
    E --> F[显示内容]
```

**优点**：
- 完全去中心化，无需外部依赖
- 内容永久存储在链上
- 简单直接的实现方式

**缺点**：
- 极高的Gas成本
- 内容长度严格受限
- 链上空间浪费
- 不适合多媒体内容

### 链上哈希存储

```mermaid
graph TB
    subgraph "链下流程"
        A[创建内容] --> B[IPFS/Arweave存储]
        B --> C[获取内容哈希]
    end
    
    subgraph "链上流程"
        C --> D[提交哈希到链上]
        D --> E[智能合约记录]
    end
    
    subgraph "读取流程"
        E --> F[获取内容哈希]
        F --> G[从IPFS/Arweave读取]
        G --> H[验证哈希匹配]
        H --> I[显示内容]
    end
```

**优点**：
- 大幅降低Gas成本 (减少85-95%)
- 内容大小无限制
- 支持多媒体（图片、音频等）
- 更好的读取性能

**缺点**：
- 依赖外部存储系统
- 架构复杂度增加
- 需确保外部存储的持久性
- 完整内容验证需额外步骤

### 成本对比实例

假设一个标准段落为500字节：

**全文存储**：
- 每个段落约500字节
- 10个段落 = 5000字节
- Gas成本: ~0.05-0.1 SUI/段落

**哈希存储**：
- 每个哈希约32字节
- 10个段落 = 320字节
- Gas成本: ~0.003-0.008 SUI/段落

**成本节省**：约87-94%

---

## 6. 代币经济

### NARR代币奖励系统

```mermaid
flowchart LR
    A[财库] --> B{奖励类型}
    B -->|故事创建| C[100 NARR]
    B -->|段落添加| D[20 NARR]
    B -->|获胜提案| E[50 NARR]
    B -->|投票参与| F[5 NARR]
    B -->|自定义奖励| G[管理员设定]
    
    C & D & E & F & G --> H[用户钱包]
```

### 代币分配

```mermaid
pie
    title "NARR代币分配"
    "创作奖励" : 50
    "社区治理" : 20
    "平台发展" : 15
    "投资者" : 10
    "团队" : 5
```

---

## 7. 用户流程

### 故事创建流程

```mermaid
stateDiagram-v2
    [*] --> 创建故事
    创建故事 --> 链上记录元数据
    链上记录元数据 --> 发放创作奖励
    发放创作奖励 --> 开始收集段落
    开始收集段落 --> 提交新段落
    提交新段落 --> 发起投票
    发起投票 --> 社区投票
    社区投票 --> 确定获胜段落
    确定获胜段落 --> 奖励获胜者
    奖励获胜者 --> 更新故事
    更新故事 --> 开始收集段落
    更新故事 --> 故事完成
    故事完成 --> [*]
```

### 用户参与激励循环

```mermaid
graph TD
    A[参与创作] --> B[获得代币]
    B --> C[提升声誉]
    C --> D[获得更多权重]
    D --> E[影响力增加]
    E --> A
```

---

## 8. 未来发展

### 路线图

```mermaid
timeline
    title NarrFlow 发展路线图
    section 阶段1
        完成智能合约开发 : 故事和代币模块
        前端基础框架 : 用户界面和钱包集成
        基础功能测试 : 创作和投票机制
    section 阶段2
        实现混合存储方案 : IPFS集成
        完善代币经济 : 完善奖励机制
        社区治理 : DAO投票系统
    section 阶段3
        多媒体支持 : 图片和音频集成
        NFT功能 : 故事NFT化
        跨链桥接 : 多链互操作
    section 阶段4
        生态系统拓展 : 第三方应用集成
        AI辅助创作 : 智能推荐和辅助
        元宇宙整合 : 3D故事体验
```

### 存储策略演进计划

**短期**：实施混合存储方案
- 内容存储在IPFS/Arweave
- 链上存储元数据和哈希

**中期**：优化存储机制
- 实现Sui原生对象感知存储
- 建立去中心化缓存层

**长期**：构建专用存储解决方案
- 开发NarrFlow专用存储协议
- 提供针对叙事内容的优化存储

---

## 对比分析：链上存储策略

### 详细技术对比

| 特性 | 全链上存储 | 混合存储（链上哈希） |
|------|------------|----------------------|
| **技术实现** | 直接使用Move字符串类型 | 结合IPFS/Arweave和链上哈希 |
| **数据大小** | 严格限制（通常<10KB） | 几乎无限制 | 
| **Gas成本** | 非常高，线性增长 | 大幅降低，仅存储哈希值 |
| **查询效率** | 适中（单一查询） | 更高（分布式内容检索） |
| **扩展性** | 有限，受链容量限制 | 高度可扩展 |
| **多媒体支持** | 几乎不可能 | 完全支持 |
| **实现复杂度** | 低 | 中 |
| **分叉风险** | 可能因数据大小触发分叉风险 | 极低分叉风险 |
| **外部依赖** | 无 | 依赖IPFS/Arweave |
| **去中心化程度** | 完全去中心化 | 依赖外部存储的去中心化程度 |

### 代码实现对比

**全链上存储实现**：

```move
struct Paragraph has store {
    content: String, // 直接存储全文
    author: address,
    timestamp: u64
}

// 添加段落函数
public fun add_paragraph(
    story: &mut Story, 
    content: String,
    ctx: &mut TxContext
) {
    let paragraph = Paragraph {
        content,  // 直接存储，占用大量链上空间
        author: tx_context::sender(ctx),
        timestamp: tx_context::epoch(ctx)
    };
    vector::push_back(&mut story.paragraphs, paragraph);
}
```

**混合存储实现**：

```move
struct Paragraph has store {
    content_hash: vector<u8>, // 仅存储内容哈希（32字节）
    content_uri: String,      // IPFS/Arweave URI
    content_preview: String,  // 短预览（约50字节）
    author: address,
    timestamp: u64
}

// 添加段落函数
public fun add_paragraph(
    story: &mut Story, 
    content_hash: vector<u8>,
    content_uri: String,
    content_preview: String,
    ctx: &mut TxContext
) {
    let paragraph = Paragraph {
        content_hash,  // 仅存储哈希，大幅节省空间
        content_uri,
        content_preview,
        author: tx_context::sender(ctx),
        timestamp: tx_context::epoch(ctx)
    };
    vector::push_back(&mut story.paragraphs, paragraph);
}
```

### 推荐：优化的混合存储模型

```mermaid
graph TD
    subgraph "内容创建流程"
        A[用户创建内容] --> B[前端计算内容哈希]
        B --> C[上传到IPFS/Arweave]
        C --> D[获取内容URI]
        D --> E[提交交易到Sui链]
    end
    
    subgraph "链上存储内容"
        E --> F[故事元数据]
        E --> G[内容哈希]
        E --> H[URI引用]
        E --> I[创作者信息]
        E --> J[投票数据]
    end
    
    subgraph "内容获取流程"
        K[用户请求内容] --> L[获取链上元数据]
        L --> M[通过URI获取内容]
        M --> N[验证内容哈希]
        N --> O[缓存并显示]
    end
```

这种混合模型为NarrFlow项目提供了最佳的平衡：

1. **成本效益**：显著降低gas成本，使创作更加经济
2. **内容自由**：不受链上存储限制，支持丰富内容
3. **可验证性**：通过哈希保证内容完整性
4. **用户体验**：快速内容加载与显示
5. **技术可行性**：利用现有成熟技术实现

---

总结：混合存储模型代表了NarrFlow项目的最佳存储策略，既保持了区块链的核心价值（去中心化、透明、不可篡改），又解决了链上存储的局限性，为创作者提供更经济、更灵活的叙事平台。
