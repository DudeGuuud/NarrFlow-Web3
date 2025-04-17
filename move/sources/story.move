module narr_flow::story {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_object_field as dof;
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    
    // 错误代码
    const ENotAuthor: u64 = 0;
    const EInvalidParagraphIndex: u64 = 1;
    const EVotingNotStarted: u64 = 2;
    const EVotingEnded: u64 = 3;
    const EVotingActive: u64 = 4;
    
    // 故事结构
    struct Story has key, store {
        id: UID,
        title: String,
        author: address,
        paragraphs: vector<Paragraph>,
        current_voting: Option<VotingSession>,
        completed: bool
    }
    
    // 段落结构
    struct Paragraph has store {
        content: String,
        author: address,
        timestamp: u64
    }
    
    // 投票会话
    struct VotingSession has store {
        proposals: vector<ParagraphProposal>,
        votes: Table<address, u64>,
        start_time: u64,
        end_time: u64
    }
    
    // 段落提案
    struct ParagraphProposal has store {
        content: String,
        author: address,
        vote_count: u64
    }
    
    // 用于存储可选值
    struct Option<T: store> has store {
        value: vector<T>
    }
    
    // 事件
    struct StoryCreated has copy, drop {
        story_id: ID,
        title: String,
        author: address
    }
    
    struct ParagraphAdded has copy, drop {
        story_id: ID,
        author: address
    }
    
    struct VotingStarted has copy, drop {
        story_id: ID,
        proposals_count: u64
    }
    
    struct VoteSubmitted has copy, drop {
        story_id: ID,
        voter: address,
        proposal_index: u64
    }
    
    struct StoryCompleted has copy, drop {
        story_id: ID
    }
    
    // === 公共函数 ===
    
    // 创建新故事
    public entry fun create_story(
        title: vector<u8>,
        first_paragraph: vector<u8>,
        ctx: &mut TxContext
    ) {
        let story = Story {
            id: object::new(ctx),
            title: string::utf8(title),
            author: tx_context::sender(ctx),
            paragraphs: vector::empty(),
            current_voting: none(),
            completed: false
        };
        
        // 添加第一个段落
        let paragraph = Paragraph {
            content: string::utf8(first_paragraph),
            author: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx)
        };
        vector::push_back(&mut story.paragraphs, paragraph);
        
        // 发送事件
        event::emit(StoryCreated {
            story_id: object::uid_to_inner(&story.id),
            title: story.title,
            author: story.author
        });
        
        // 转移故事对象到创建者
        transfer::share_object(story);
    }
    
    // 添加段落（仅故事作者）
    public entry fun add_paragraph(
        story: &mut Story,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 检查调用者是否为作者
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        // 确保故事未完成
        assert!(!story.completed, EVotingEnded);
        // 确保没有进行中的投票
        assert!(is_none(&story.current_voting), EVotingActive);
        
        let paragraph = Paragraph {
            content: string::utf8(content),
            author: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx)
        };
        vector::push_back(&mut story.paragraphs, paragraph);
        
        // 发送事件
        event::emit(ParagraphAdded {
            story_id: object::uid_to_inner(&story.id),
            author: tx_context::sender(ctx)
        });
    }
    
    // 开始投票（仅故事作者）
    public entry fun start_voting(
        story: &mut Story,
        proposals: vector<vector<u8>>,
        voting_duration: u64,
        ctx: &mut TxContext
    ) {
        // 检查调用者是否为作者
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        // 确保故事未完成
        assert!(!story.completed, EVotingEnded);
        // 确保没有进行中的投票
        assert!(is_none(&story.current_voting), EVotingActive);
        
        let current_time = tx_context::epoch(ctx);
        let end_time = current_time + voting_duration;
        
        let paragraph_proposals = vector::empty<ParagraphProposal>();
        let i = 0;
        while (i < vector::length(&proposals)) {
            let proposal = ParagraphProposal {
                content: string::utf8(*vector::borrow(&proposals, i)),
                author: tx_context::sender(ctx),
                vote_count: 0
            };
            vector::push_back(&mut paragraph_proposals, proposal);
            i = i + 1;
        };
        
        let voting_session = VotingSession {
            proposals: paragraph_proposals,
            votes: table::new(ctx),
            start_time: current_time,
            end_time
        };
        
        story.current_voting = some(voting_session);
        
        // 发送事件
        event::emit(VotingStarted {
            story_id: object::uid_to_inner(&story.id),
            proposals_count: vector::length(&proposals)
        });
    }
    
    // 投票
    public entry fun cast_vote(
        story: &mut Story,
        proposal_index: u64,
        ctx: &mut TxContext
    ) {
        // 确保故事未完成
        assert!(!story.completed, EVotingEnded);
        // 确保有进行中的投票
        assert!(is_some(&story.current_voting), EVotingNotStarted);
        
        let voting_ref = borrow_mut(&mut story.current_voting);
        
        // 检查当前时间是否在投票期内
        let current_time = tx_context::epoch(ctx);
        assert!(current_time <= voting_ref.end_time, EVotingEnded);
        
        // 检查提案索引有效性
        assert!(proposal_index < vector::length(&voting_ref.proposals), EInvalidParagraphIndex);
        
        let sender = tx_context::sender(ctx);
        
        // 如果用户已经投过票，先移除旧票
        if (table::contains(&voting_ref.votes, sender)) {
            let old_vote = table::remove(&mut voting_ref.votes, sender);
            let old_proposal = vector::borrow_mut(&mut voting_ref.proposals, old_vote);
            old_proposal.vote_count = old_proposal.vote_count - 1;
        };
        
        // 添加新票
        table::add(&mut voting_ref.votes, sender, proposal_index);
        let proposal = vector::borrow_mut(&mut voting_ref.proposals, proposal_index);
        proposal.vote_count = proposal.vote_count + 1;
        
        // 发送事件
        event::emit(VoteSubmitted {
            story_id: object::uid_to_inner(&story.id),
            voter: sender,
            proposal_index
        });
    }
    
    // 完成故事，结束投票并添加获胜的段落
    public entry fun complete_story(
        story: &mut Story,
        ctx: &mut TxContext
    ) {
        // 检查调用者是否为作者
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        // 确保故事未完成
        assert!(!story.completed, EVotingEnded);
        // 确保有进行中的投票
        assert!(is_some(&story.current_voting), EVotingNotStarted);
        
        let voting_ref = borrow_mut(&mut story.current_voting);
        
        // 检查投票是否已结束
        let current_time = tx_context::epoch(ctx);
        assert!(current_time > voting_ref.end_time, EVotingActive);
        
        // 找出票数最高的提案
        let proposals = &voting_ref.proposals;
        let winning_index = 0;
        let max_votes = 0;
        let i = 0;
        
        while (i < vector::length(proposals)) {
            let proposal = vector::borrow(proposals, i);
            if (proposal.vote_count > max_votes) {
                max_votes = proposal.vote_count;
                winning_index = i;
            };
            i = i + 1;
        };
        
        // 只有在有人投票的情况下才添加获胜段落
        if (max_votes > 0) {
            let winning_proposal = vector::borrow(proposals, winning_index);
            let paragraph = Paragraph {
                content: winning_proposal.content,
                author: winning_proposal.author,
                timestamp: current_time
            };
            vector::push_back(&mut story.paragraphs, paragraph);
        };
        
        // 清除投票会话
        story.current_voting = none();
        story.completed = true;
        
        // 发送事件
        event::emit(StoryCompleted {
            story_id: object::uid_to_inner(&story.id)
        });
    }
    
    // === 辅助函数 ===
    
    // 创建Option<T>
    fun some<T: store>(value: T): Option<T> {
        let v = vector::empty();
        vector::push_back(&mut v, value);
        Option { value: v }
    }
    
    // 创建空Option<T>
    fun none<T: store>(): Option<T> {
        Option { value: vector::empty() }
    }
    
    // 检查Option<T>是否为空
    fun is_none<T: store>(opt: &Option<T>): bool {
        vector::is_empty(&opt.value)
    }
    
    // 检查Option<T>是否非空
    fun is_some<T: store>(opt: &Option<T>): bool {
        !vector::is_empty(&opt.value)
    }
    
    // 从Option<T>借用值
    fun borrow<T: store>(opt: &Option<T>): &T {
        vector::borrow(&opt.value, 0)
    }
    
    // 从Option<T>可变借用值
    fun borrow_mut<T: store>(opt: &mut Option<T>): &mut T {
        vector::borrow_mut(&mut opt.value, 0)
    }
} 