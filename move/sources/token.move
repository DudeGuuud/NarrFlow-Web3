module narr_flow::token {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    
    // 错误代码
    const EInsufficientBalance: u64 = 0;
    const ENotAuthorized: u64 = 1;
    const EInvalidAmount: u64 = 2;
    
    // === 类型 ===
    
    // TOKEN 代币类型
    public struct TOKEN has drop {}
    
    // 平台财务管理结构
    public struct Treasury has key {
        id: UID,
        balance: Balance<TOKEN>,
        admin: address
    }
    
    // === 事件 ===
    
    public struct TokensRewarded has copy, drop {
        receiver: address,
        amount: u64,
        reward_type: u8,
        story_id: Option<ID>
    }
    
    // 奖励类型常量
    const REWARD_TYPE_STORY_CREATION: u8 = 0;
    const REWARD_TYPE_PARAGRAPH_ADDITION: u8 = 1;
    const REWARD_TYPE_WINNING_PROPOSAL: u8 = 2;
    const REWARD_TYPE_VOTING: u8 = 3;
    const REWARD_TYPE_CUSTOM: u8 = 4;
    
    // === 初始化函数 ===
    
    // 一次性初始化函数，创建代币并设置财库
    fun init(witness: TOKEN, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        
        // 创建TOKEN代币
        let (mut treasury_cap, metadata) = coin::create_currency(
            witness, // 见证者模式
            9, // 小数位
            b"NARR", // 符号
            b"NARR", // 名称
            b"Coin For Narrflow", // 描述
            option::none(), // 图标URL
            ctx
        );
        
        // 创建平台财库
        let mut treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            admin: sender
        };
        
        // 初始铸造1,000,000,000枚代币到财库中
        let initial_supply = 1_000_000_000_000_000_000; // 1 billion tokens with 9 decimals
        let minted_coins = coin::mint(&mut treasury_cap, initial_supply, ctx);
        let minted_balance = coin::into_balance(minted_coins);
        balance::join(&mut treasury.balance, minted_balance);
        
        // 转移资产给部署者
        transfer::share_object(treasury);
        transfer::public_transfer(treasury_cap, sender);
        transfer::public_transfer(metadata, sender);
    }
    
    // === 公共函数 ===
    
    // 奖励故事创建者
    public fun reward_story_creation(
        treasury: &mut Treasury,
        receiver: address,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        // 故事创建奖励: 100 TOKEN
        let reward_amount = 100_000_000_000; // 100 tokens with 9 decimals
        
        // 发放奖励
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        
        // 发出事件
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_STORY_CREATION,
            story_id: option::some(story_id)
        });
    }
    
    // 奖励段落添加者
    public fun reward_paragraph_addition(
        treasury: &mut Treasury,
        receiver: address,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        // 段落添加奖励: 20 TOKEN
        let reward_amount = 20_000_000_000; // 20 tokens with 9 decimals
        
        // 发放奖励
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        
        // 发出事件
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_PARAGRAPH_ADDITION,
            story_id: option::some(story_id)
        });
    }
    
    // 奖励获胜提案作者
    public fun reward_winning_proposal(
        treasury: &mut Treasury,
        receiver: address,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        // 获胜提案奖励: 50 TOKEN
        let reward_amount = 50_000_000_000; // 50 tokens with 9 decimals
        
        // 发放奖励
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        
        // 发出事件
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_WINNING_PROPOSAL,
            story_id: option::some(story_id)
        });
    }
    
    // 奖励投票者
    public fun reward_voter(
        treasury: &mut Treasury,
        receiver: address,
        story_id: ID,
        ctx: &mut TxContext
    ) {
        // 投票奖励: 5 TOKEN
        let reward_amount = 5_000_000_000; // 5 tokens with 9 decimals
        
        // 发放奖励
        let reward_coins = extract_from_treasury(treasury, reward_amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        
        // 发出事件
        event::emit(TokensRewarded {
            receiver,
            amount: reward_amount,
            reward_type: REWARD_TYPE_VOTING,
            story_id: option::some(story_id)
        });
    }
    
    // 管理员自定义奖励
    public fun admin_reward(
        treasury: &mut Treasury,
        receiver: address,
        amount: u64,
        story_id: Option<ID>,
        ctx: &mut TxContext
    ) {
        // 检查调用者是否为管理员
        let sender = tx_context::sender(ctx);
        assert!(sender == treasury.admin, ENotAuthorized);
        
        // 检查金额有效性
        assert!(amount > 0, EInvalidAmount);
        
        // 发放奖励
        let reward_coins = extract_from_treasury(treasury, amount, ctx);
        transfer::public_transfer(reward_coins, receiver);
        
        // 发出事件
        event::emit(TokensRewarded {
            receiver,
            amount,
            reward_type: REWARD_TYPE_CUSTOM,
            story_id
        });
    }
    
    // 更改财库管理员
    public fun change_admin(
        treasury: &mut Treasury,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        // 检查调用者是否为当前管理员
        let sender = tx_context::sender(ctx);
        assert!(sender == treasury.admin, ENotAuthorized);
        
        // 更新管理员
        treasury.admin = new_admin;
    }
    
    // === 内部辅助函数 ===
    
    // 从财库中提取代币
    fun extract_from_treasury(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<TOKEN> {
        // 检查财库余额是否足够
        assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);
        
        // 从财库余额中提取代币
        let extracted_balance = balance::split(&mut treasury.balance, amount);
        
        // 将余额转换为硬币对象并返回
        coin::from_balance(extracted_balance, ctx)
    }
    
    // === 访问器函数 ===
    
    // 获取财库余额
    public fun get_treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }
    
    // 检查地址是否为财库管理员
    public fun is_admin(treasury: &Treasury, addr: address): bool {
        addr == treasury.admin
    }
} 