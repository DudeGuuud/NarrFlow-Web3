module narr_flow::narr_flow {
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{TreasuryCap};
    use sui::transfer;
    use sui::object::{Self, ID, UID};
    use sui::event;
    use std::string::{String};
    use std::vector;
    
    use narr_flow::story::{Self, Story};
    use narr_flow::token::{Self, Treasury, NARR};
    
    // 错误代码
    const ENotAuthorized: u64 = 0;
    const EInvalidOperation: u64 = 1;
    
    // 平台管理员能力结构
    struct PlatformCap has key, store {
        id: UID
    }
    
    // 事件
    struct StoryCreatedWithReward has copy, drop {
        story_id: ID,
        author: address,
        title: String,
        reward_amount: u64
    }
    
    struct ParagraphAddedWithReward has copy, drop {
        story_id: ID,
        author: address,
        content_preview: String,
        reward_amount: u64
    }
    
    struct ProposalSubmittedWithReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    struct VotingReward has copy, drop {
        story_id: ID,
        voter: address,
        reward_amount: u64
    }
    
    struct WinningProposalReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    // === 初始化函数 ===
    
    fun init(ctx: &mut TxContext) {
        let platform_cap = PlatformCap {
            id: object::new(ctx)
        };
        
        transfer::transfer(platform_cap, tx_context::sender(ctx));
    }
    
    // === 公共入口函数 ===
    
    // 创建故事并奖励作者
    public entry fun create_story_with_reward(
        treasury: &mut Treasury,
        title: vector<u8>,
        first_paragraph: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 创建故事
        story::create_story(title, first_paragraph, ctx);
        
        // 获取故事ID (这里需要在实际环境中获取)
        let story_id = object::uid_to_inner(&object::new(ctx)); // 示例ID
        
        // 奖励作者
        token::reward_story_creation(treasury, sender, story_id, ctx);
        
        // 发出事件
        event::emit(StoryCreatedWithReward {
            story_id,
            author: sender,
            title: string::utf8(title),
            reward_amount: 100_000_000_000 // 100 NARR
        });
    }
    
    // 添加段落并奖励作者
    public entry fun add_paragraph_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 添加段落
        story::add_paragraph(story, content, ctx);
        
        // 奖励作者
        let story_id = object::id(story);
        token::reward_paragraph_addition(treasury, sender, story_id, ctx);
        
        // 提取内容前30个字符作为预览
        let content_str = string::utf8(content);
        let content_preview = if (string::length(&content_str) > 30) {
            string::sub_string(&content_str, 0, 30)
        } else {
            content_str
        };
        
        // 发出事件
        event::emit(ParagraphAddedWithReward {
            story_id,
            author: sender,
            content_preview,
            reward_amount: 20_000_000_000 // 20 NARR
        });
    }
    
    // 开始段落投票会话
    public entry fun start_voting_session(
        story: &mut Story,
        proposals: vector<vector<u8>>,
        voting_duration: u64,
        ctx: &mut TxContext
    ) {
        story::start_voting(story, proposals, voting_duration, ctx);
    }
    
    // 提交段落提案并奖励
    public entry fun submit_proposal_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 提交提案
        story::submit_proposal(story, content, ctx);
        
        // 奖励提案者
        let story_id = object::id(story);
        token::reward_paragraph_addition(treasury, sender, story_id, ctx);
        
        // 发出事件
        event::emit(ProposalSubmittedWithReward {
            story_id,
            author: sender,
            reward_amount: 10_000_000_000 // 10 NARR
        });
    }
    
    // 投票并奖励投票者
    public entry fun vote_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        proposal_index: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // 投票
        story::cast_vote(story, proposal_index, ctx);
        
        // 奖励投票者
        let story_id = object::id(story);
        token::reward_voter(treasury, sender, story_id, ctx);
        
        // 发出事件
        event::emit(VotingReward {
            story_id,
            voter: sender,
            reward_amount: 5_000_000_000 // 5 NARR
        });
    }
    
    // 结束投票并奖励获胜提案的作者
    public entry fun end_voting_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        ctx: &mut TxContext
    ) {
        // 结束投票
        story::complete_story(story, ctx);
        
        // 获取获胜提案作者 (实际应从story模块获取，这里简化处理)
        let sender = tx_context::sender(ctx);
        
        // 奖励获胜提案的作者
        let story_id = object::id(story);
        token::reward_winning_proposal(treasury, sender, story_id, ctx);
        
        // 发出事件
        event::emit(WinningProposalReward {
            story_id,
            author: sender,
            reward_amount: 50_000_000_000 // 50 NARR
        });
    }
    
    // === 管理员功能 ===
    
    // 管理员自定义奖励
    public entry fun admin_custom_reward(
        treasury: &mut Treasury,
        platform_cap: &PlatformCap,
        receiver: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let story_id_opt = std::option::none<ID>();
        
        // 只有平台管理员可以调用此函数
        token::admin_reward(treasury, receiver, amount, story_id_opt, ctx);
    }
} 