module narr_flow::narr_flow {
    use std::string::{String};
    use narr_flow::story::{Self, Story};
    use narr_flow::token::{Self, Treasury};
    
    const ENotAuthorized: u64 = 0;
    
    // 平台管理员能力结构
    public struct PlatformCap has key, store {
        id: UID,
        admin: address
    }
    
    // 事件
    public struct StoryCreatedWithReward has copy, drop {
        story_id: ID,
        author: address,
        title: String,
        reward_amount: u64
    }
    
    public struct ParagraphAddedWithReward has copy, drop {
        story_id: ID,
        author: address,
        content_preview: String,
        reward_amount: u64
    }
    
    public struct ProposalSubmittedWithReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    public struct VotingReward has copy, drop {
        story_id: ID,
        voter: address,
        reward_amount: u64
    }
    
    public struct WinningProposalReward has copy, drop {
        story_id: ID,
        author: address,
        reward_amount: u64
    }
    
    // === 初始化函数 ===
    
    fun init(ctx: &mut TxContext) {
        let platform_cap = PlatformCap {
            id: object::new(ctx),
            admin: tx_context::sender(ctx)
        };
        
        transfer::transfer(platform_cap, tx_context::sender(ctx));
    }
    
    // === 公共入口函数 ===
    
    // 创建故事并奖励作者
    public entry fun create_story_with_reward(
        _treasury: &mut Treasury,
        title: vector<u8>,
        first_paragraph_hash: vector<u8>,
        first_paragraph_walrus_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(ctx);
        
        // 创建故事
        story::create_story(title, first_paragraph_hash, first_paragraph_walrus_id, ctx);
        
        // 获取故事ID (实际应通过事件或链下索引获取)
        // 这里只做演示，实际链上需通过事件监听获取新ID
        // 奖励作者（此处story_id需链下获取后再调用奖励）
        // token::reward_story_creation(treasury, sender, story_id, ctx);
    }
    
    // 添加段落并奖励作者
    public entry fun add_paragraph_with_reward(
        _treasury: &mut Treasury,
        story: &mut Story,
        content_hash: vector<u8>,
        walrus_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(ctx);
        
        // 添加段落
        story::add_paragraph(story, content_hash, walrus_id, ctx);
        
        // 奖励作者（story_id需链下获取）
        // let story_id = object::id(story);
        // token::reward_paragraph_addition(treasury, sender, story_id, ctx);
    }
    
    // 开始段落投票会话
    public entry fun start_voting_session(
        story: &mut Story,
        proposals_hash: vector<vector<u8>>,
        proposals_walrus_id: vector<vector<u8>>,
        voting_duration: u64,
        ctx: &mut TxContext
    ) {
        story::start_voting(story, proposals_hash, proposals_walrus_id, voting_duration, ctx);
    }
    
    // 提交段落提案并奖励
    /*
    public entry fun submit_proposal_with_reward(
        treasury: &mut Treasury,
        story: &mut Story,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // 提交提案
        // story::submit_proposal(story, content, ctx);
        // 奖励提案者
        // let story_id = object::id(story);
        // token::reward_paragraph_addition(treasury, sender, story_id, ctx);
        // 发出事件
        // event::emit(ProposalSubmittedWithReward {
        //     story_id,
        //     author: sender,
        //     reward_amount: 10_000_000_000 // 10 NARR
        // });
    }
    */
    
    // 投票并奖励投票者
    public entry fun vote_with_reward(
        _treasury: &mut Treasury,
        story: &mut Story,
        proposal_index: u64,
        ctx: &mut TxContext
    ) {
        let _sender = tx_context::sender(ctx);
        
        // 投票
        story::cast_vote(story, proposal_index, ctx);
        
        // 奖励投票者
        // let story_id = object::id(story);
        // token::reward_voter(treasury, sender, story_id, ctx);
    }
    
    // 结束投票并奖励获胜提案的作者
    public entry fun end_voting_with_reward(
        _treasury: &mut Treasury,
        story: &mut Story,
        ctx: &mut TxContext
    ) {
        let _winning_author = story::complete_story(story, ctx);
        // let story_id = object::id(story);
        // token::reward_winning_proposal(treasury, winning_author, story_id, ctx);
    }
    
    // === 管理员功能 ===
    
    // 管理员自定义奖励
    public entry fun admin_custom_reward(
        _treasury: &mut Treasury,
        _platform_cap: &PlatformCap,
        receiver: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // 校验只有平台管理员可以调用
        let sender = tx_context::sender(ctx);
        assert!(sender == _platform_cap.admin, ENotAuthorized);
        let story_id_opt = std::option::none<ID>();
        token::admin_reward(_treasury, receiver, amount, story_id_opt, ctx);
    }
} 