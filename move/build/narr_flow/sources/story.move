module narr_flow::story {
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};

    // 错误代码
    const ENotAuthor: u64 = 0;
    const EInvalidParagraphIndex: u64 = 1;
    const EVotingNotStarted: u64 = 2;
    const EVotingEnded: u64 = 3;
    const EVotingActive: u64 = 4;
    
    // 故事结构
    public struct Story has key, store {
        id: UID,
        title: String,
        author: address,
        paragraphs: vector<Paragraph>,
        current_voting: Option<VotingSession>,
        completed: bool
    }
    
    // 段落结构
    /// 段落结构体，链上仅存内容哈希和Walrus存储ID，内容本体走Walrus
    public struct Paragraph has store {
        content_hash: String, // 内容哈希，前端需校验
        walrus_id: String,   // Walrus存储ID
        author: address,
        timestamp: u64
    }
    
    // 投票会话
    public struct VotingSession has store {
        proposals: vector<ParagraphProposal>,
        votes: Table<address, u64>,
        start_time: u64,
        end_time: u64
    }
    
    // 段落提案
    /// 段落提案结构体，链上仅存内容哈希和Walrus存储ID
    public struct ParagraphProposal has store {
        content_hash: String,
        walrus_id: String,
        author: address,
        vote_count: u64
    }
    
    // 事件
    public struct StoryCreated has copy, drop {
        story_id: ID,
        title: String,
        author: address
    }
    
    public struct ParagraphAdded has copy, drop {
        story_id: ID,
        author: address,
        content_hash: String,
        walrus_id: String
    }
    
    public struct VotingStarted has copy, drop {
        story_id: ID,
        proposals_count: u64
    }
    
    public struct VoteSubmitted has copy, drop {
        story_id: ID,
        voter: address,
        proposal_index: u64
    }
    
    public struct StoryCompleted has copy, drop {
        story_id: ID,
        winning_author: address,
        content_hash: String,
        walrus_id: String
    }
    
    // === 公共函数 ===
    
    // 创建新故事
    /// 创建新故事，链上仅存元数据，内容本体走Walrus
    public entry fun create_story(
        title: vector<u8>,
        first_paragraph_hash: vector<u8>,
        first_paragraph_walrus_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let mut story = Story {
            id: object::new(ctx),
            title: string::utf8(title),
            author: tx_context::sender(ctx),
            paragraphs: vector::empty(),
            current_voting: option::none<VotingSession>(),
            completed: false
        };
        // 校验哈希格式（示例：长度为64的hex字符串）
        assert!(vector::length(&first_paragraph_hash) == 64, 100);
        let paragraph = Paragraph {
            content_hash: string::utf8(first_paragraph_hash),
            walrus_id: string::utf8(first_paragraph_walrus_id),
            author: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx)
        };
        vector::push_back(&mut story.paragraphs, paragraph);
        event::emit(StoryCreated {
            story_id: object::uid_to_inner(&story.id),
            title: story.title,
            author: story.author
        });
        transfer::share_object(story);
    }
    
    // 添加段落（仅故事作者）
    /// 仅作者可添加段落，需传入内容哈希和Walrus ID
    public entry fun add_paragraph(
        story: &mut Story,
        content_hash: vector<u8>,
        walrus_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        assert!(!story.completed, EVotingEnded);
        assert!(option::is_none(&story.current_voting), EVotingActive);
        assert!(vector::length(&content_hash) == 64, 101); // 101: 哈希格式错误
        let paragraph = Paragraph {
            content_hash: string::utf8(content_hash),
            walrus_id: string::utf8(walrus_id),
            author: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx)
        };
        vector::push_back(&mut story.paragraphs, paragraph);
        event::emit(ParagraphAdded {
            story_id: object::uid_to_inner(&story.id),
            author: tx_context::sender(ctx),
            content_hash: string::utf8(content_hash),
            walrus_id: string::utf8(walrus_id)
        });
    }
    
    // 开始投票（仅故事作者）
    /// 作者发起投票，提案需传入哈希和Walrus ID
    public entry fun start_voting(
        story: &mut Story,
        proposals_hash: vector<vector<u8>>,
        proposals_walrus_id: vector<vector<u8>>,
        voting_duration: u64,
        ctx: &mut TxContext
    ) {
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        assert!(!story.completed, EVotingEnded);
        assert!(option::is_none(&story.current_voting), EVotingActive);
        let current_time = tx_context::epoch(ctx);
        let end_time = current_time + voting_duration;
        let mut paragraph_proposals = vector::empty<ParagraphProposal>();
        let mut i = 0;
        while (i < vector::length(&proposals_hash)) {
            assert!(vector::length(vector::borrow(&proposals_hash, i)) == 64, 102); // 102: 提案哈希格式错误
            let proposal = ParagraphProposal {
                content_hash: string::utf8(*vector::borrow(&proposals_hash, i)),
                walrus_id: string::utf8(*vector::borrow(&proposals_walrus_id, i)),
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
            end_time: end_time
        };
        option::fill(&mut story.current_voting, voting_session);
        event::emit(VotingStarted {
            story_id: object::uid_to_inner(&story.id),
            proposals_count: vector::length(&proposals_hash)
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
        assert!(option::is_some(&story.current_voting), EVotingNotStarted);
        
        let voting_ref = option::borrow_mut(&mut story.current_voting);
        
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
    
    // 完成故事，返回获胜提案作者，便于奖励发放
    /// 结束投票，链上记录获胜提案的哈希和Walrus ID
    public entry fun complete_story(
        story: &mut Story,
        ctx: &mut TxContext
    ): address {
        assert!(story.author == tx_context::sender(ctx), ENotAuthor);
        assert!(!story.completed, EVotingEnded);
        assert!(option::is_some(&story.current_voting), EVotingNotStarted);
        let session = option::borrow_mut(&mut story.current_voting);
        let proposals = &session.proposals;
        let mut mut_winning_index = 0;
        let mut mut_max_votes = 0;
        let mut mut_i = 0;
        while (mut_i < vector::length(proposals)) {
            let proposal = vector::borrow(proposals, mut_i);
            if (proposal.vote_count > mut_max_votes) {
                mut_max_votes = proposal.vote_count;
                mut_winning_index = mut_i;
            };
            mut_i = mut_i + 1;
        };
        let winning_author: address;
        if (mut_max_votes > 0) {
            let winning_proposal = vector::borrow(proposals, mut_winning_index);
            let paragraph = Paragraph {
                content_hash: winning_proposal.content_hash,
                walrus_id: winning_proposal.walrus_id,
                author: winning_proposal.author,
                timestamp: tx_context::epoch(ctx)
            };
            vector::push_back(&mut story.paragraphs, paragraph);
            event::emit(StoryCompleted {
                story_id: object::uid_to_inner(&story.id),
                winning_author: winning_proposal.author,
                content_hash: winning_proposal.content_hash,
                walrus_id: winning_proposal.walrus_id
            });
            winning_author = winning_proposal.author;
        } else {
            event::emit(StoryCompleted {
                story_id: object::uid_to_inner(&story.id),
                winning_author: @0x0,
                content_hash: string::utf8(b""),
                walrus_id: string::utf8(b"")
            });
            winning_author = @0x0;
        };
        // 用空 VotingSession 覆盖 current_voting
        let empty_voting = VotingSession {
            proposals: vector::empty<ParagraphProposal>(),
            votes: table::new(ctx),
            start_time: 0,
            end_time: 0
        };
        option::fill(&mut story.current_voting, empty_voting);
        story.completed = true;
        winning_author
    }
} 