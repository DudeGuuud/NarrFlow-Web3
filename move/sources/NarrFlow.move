module narr_flow::story {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // 错误码
    const ENotAuthor: u64 = 0;
    const EInvalidState: u64 = 1;
    const EVotingClosed: u64 = 2;
    const EAlreadyVoted: u64 = 3;
    const ECannotVoteOwn: u64 = 4;
    const EStoryComplete: u64 = 5;

    // 故事状态
    const STATE_COLLECTING: u8 = 0;
    const STATE_VOTING: u8 = 1;
    const STATE_COMPLETED: u8 = 2;

    // 段落结构
    struct Paragraph has store {
        content: String,
        author: address,
        vote_count: u64
    }

    // 故事结构
    struct Story has key {
        id: UID,
        title: String,
        paragraphs: vector<Paragraph>,
        state: u8,
        max_paragraphs: u64,
        votes: Table<address, address>, // 投票人 -> 被投段落作者
        owner: address
    }

    // 管理员凭证
    struct AdminCap has key {
        id: UID
    }

    // 事件
    struct StoryCreated has copy, drop {
        story_id: ID,
        title: String,
        creator: address
    }

    struct ParagraphAdded has copy, drop {
        story_id: ID,
        author: address,
        content_preview: String
    }

    struct VoteCast has copy, drop {
        story_id: ID,
        voter: address,
        vote_for: address
    }

    struct StoryCompleted has copy, drop {
        story_id: ID,
        title: String,
        paragraphs_count: u64
    }

    // === 初始化函数 ===
    fun init(ctx: &mut TxContext) {
        // 创建管理员凭证并发送给部署者
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // === 公共函数 ===
    
    // 创建新故事
    public fun create_story(
        title: String,
        max_paragraphs: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        let story = Story {
            id: object::new(ctx),
            title,
            paragraphs: vector::empty(),
            state: STATE_COLLECTING,
            max_paragraphs,
            votes: table::new(ctx),
            owner: sender
        };
        
        let story_id = object::uid_to_inner(&story.id);
        
        event::emit(StoryCreated {
            story_id,
            title: story.title,
            creator: sender
        });
        
        transfer::share_object(story);
    }
    
    // 添加段落
    public fun add_paragraph(
        story: &mut Story,
        content: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 检查故事状态是否为收集阶段
        assert!(story.state == STATE_COLLECTING, EInvalidState);
        
        // 检查段落数量是否已达到最大值
        assert!(vector::length(&story.paragraphs) < story.max_paragraphs, EStoryComplete);
        
        // 创建新段落
        let paragraph = Paragraph {
            content,
            author: sender,
            vote_count: 0
        };
        
        // 添加到故事中
        vector::push_back(&mut story.paragraphs, paragraph);
        
        // 提取内容前30个字符作为预览
        let content_preview = if (string::length(&content) > 30) {
            string::sub_string(&content, 0, 30)
        } else {
            content
        };
        
        // 发出事件
        event::emit(ParagraphAdded {
            story_id: object::uid_to_inner(&story.id),
            author: sender,
            content_preview
        });
    }
    
    // 开始投票阶段
    public fun start_voting(
        story: &mut Story,
        _: &AdminCap,
        _ctx: &mut TxContext
    ) {
        // 检查故事状态是否为收集阶段
        assert!(story.state == STATE_COLLECTING, EInvalidState);
        
        // 更改状态为投票阶段
        story.state = STATE_VOTING;
    }
    
    // 投票
    public fun vote(
        story: &mut Story,
        paragraph_author: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 检查故事状态是否为投票阶段
        assert!(story.state == STATE_VOTING, EVotingClosed);
        
        // 检查是否已经投过票
        assert!(!table::contains(&story.votes, sender), EAlreadyVoted);
        
        // 不能给自己的段落投票
        assert!(sender != paragraph_author, ECannotVoteOwn);
        
        // 检查作者是否有段落
        let mut found = false;
        let paragraphs_len = vector::length(&story.paragraphs);
        let i = 0;
        
        while (i < paragraphs_len) {
            let paragraph = vector::borrow_mut(&mut story.paragraphs, i);
            if (paragraph.author == paragraph_author) {
                // 增加投票计数
                paragraph.vote_count = paragraph.vote_count + 1;
                found = true;
                break;
            };
            i = i + 1;
        };
        
        assert!(found, ENotAuthor);
        
        // 记录投票
        table::add(&mut story.votes, sender, paragraph_author);
        
        // 发出事件
        event::emit(VoteCast {
            story_id: object::uid_to_inner(&story.id),
            voter: sender,
            vote_for: paragraph_author
        });
    }
    
    // 完成故事
    public fun complete_story(
        story: &mut Story,
        _: &AdminCap,
        ctx: &mut TxContext
    ) {
        // 检查故事状态是否为投票阶段
        assert!(story.state == STATE_VOTING, EInvalidState);
        
        // 更改状态为已完成
        story.state = STATE_COMPLETED;
        
        // 发出事件
        event::emit(StoryCompleted {
            story_id: object::uid_to_inner(&story.id),
            title: story.title,
            paragraphs_count: vector::length(&story.paragraphs)
        });
    }

    // === 查询函数 ===
    
    // 获取故事标题
    public fun title(story: &Story): String {
        story.title
    }
    
    // 获取故事状态
    public fun state(story: &Story): u8 {
        story.state
    }
    
    // 获取段落数量
    public fun paragraphs_count(story: &Story): u64 {
        vector::length(&story.paragraphs)
    }
    
    // 获取段落内容
    public fun paragraph_content(story: &Story, index: u64): String {
        assert!(index < vector::length(&story.paragraphs), EInvalidState);
        let paragraph = vector::borrow(&story.paragraphs, index);
        paragraph.content
    }
    
    // 获取段落作者
    public fun paragraph_author(story: &Story, index: u64): address {
        assert!(index < vector::length(&story.paragraphs), EInvalidState);
        let paragraph = vector::borrow(&story.paragraphs, index);
        paragraph.author
    }
    
    // 获取段落投票数
    public fun paragraph_votes(story: &Story, index: u64): u64 {
        assert!(index < vector::length(&story.paragraphs), EInvalidState);
        let paragraph = vector::borrow(&story.paragraphs, index);
        paragraph.vote_count
    }
    
    // 检查用户是否已投票
    public fun has_voted(story: &Story, user: address): bool {
        table::contains(&story.votes, user)
    }
}

module narr_flow::token {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    
    // 错误码
    const EInsufficientFunds: u64 = 0;
    const ENotOwner: u64 = 1;
    
    // 代币管理器
    struct TokenManager has key {
        id: UID,
        token_price: u64,
        token_balance: Table<address, u64>,
        owner: address
    }
    
    // 管理员凭证
    struct AdminCap has key {
        id: UID
    }
    
    // 事件
    struct TokensMinted has copy, drop {
        user: address,
        amount: u64
    }
    
    struct TokensUsed has copy, drop {
        user: address,
        amount: u64,
        purpose: String
    }
    
    // === 初始化函数 ===
    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        
        // 创建代币管理器
        let token_manager = TokenManager {
            id: object::new(ctx),
            token_price: 10000000, // 0.01 SUI
            token_balance: table::new(ctx),
            owner: sender
        };
        
        // 创建管理员凭证
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        
        transfer::share_object(token_manager);
        transfer::transfer(admin_cap, sender);
    }
    
    // === 公共函数 ===
    
    // 使用SUI购买代币
    public fun mint_tokens(
        manager: &mut TokenManager,
        payment: &mut Coin<SUI>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let price = amount * manager.token_price;
        
        // 检查支付金额是否足够
        assert!(coin::value(payment) >= price, EInsufficientFunds);
        
        // 计算用户当前代币余额
        let user_balance = if (table::contains(&manager.token_balance, sender)) {
            *table::borrow(&manager.token_balance, sender)
        } else {
            0
        };
        
        // 更新用户余额
        if (table::contains(&manager.token_balance, sender)) {
            let balance = table::borrow_mut(&mut manager.token_balance, sender);
            *balance = *balance + amount;
        } else {
            table::add(&mut manager.token_balance, sender, amount);
        };
        
        // 支付SUI到合约拥有者
        let paid = coin::split(payment, price, ctx);
        transfer::public_transfer(paid, manager.owner);
        
        // 发出事件
        event::emit(TokensMinted {
            user: sender,
            amount
        });
    }
    
    // 使用代币
    public fun use_tokens(
        manager: &mut TokenManager,
        amount: u64,
        purpose: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 检查用户是否有足够的代币
        assert!(table::contains(&manager.token_balance, sender), EInsufficientFunds);
        let balance = table::borrow_mut(&mut manager.token_balance, sender);
        assert!(*balance >= amount, EInsufficientFunds);
        
        // 扣除代币
        *balance = *balance - amount;
        
        // 发出事件
        event::emit(TokensUsed {
            user: sender,
            amount,
            purpose
        });
    }
    
    // 修改代币价格 (仅管理员)
    public fun set_token_price(
        manager: &mut TokenManager,
        _: &AdminCap,
        new_price: u64,
        _ctx: &mut TxContext
    ) {
        manager.token_price = new_price;
    }
    
    // === 查询函数 ===
    
    // 获取用户代币余额
    public fun balance(manager: &TokenManager, user: address): u64 {
        if (table::contains(&manager.token_balance, user)) {
            *table::borrow(&manager.token_balance, user)
        } else {
            0
        }
    }
    
    // 获取代币价格
    public fun token_price(manager: &TokenManager): u64 {
        manager.token_price
    }
} 