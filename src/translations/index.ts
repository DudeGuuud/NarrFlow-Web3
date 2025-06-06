// 支持的语言
export const SupportedLanguages = {
  en: 'English',
  zh: '中文'
};

// 定义翻译类型
type TranslationType = {
  [key: string]: string;
};

// 定义翻译
export const translations: { [key: string]: TranslationType } = {
  en: {
    // 通用
    app_name: 'NarrFlow',
    app_description: 'Decentralized Collaborative Creation Platform',

    // 导航
    nav_home: 'Home',
    nav_create: 'Create Story',
    nav_browse: 'Browse Stories',
    nav_profile: 'Profile',

    // 书本组件
    book_title: 'Current Collaborative Story',
    book_authors: 'Created by %count% authors',
    book_progress: 'Current progress: {current}/{max} paragraphs',
    book_page: 'Page {current} / {total}',

    // 按钮
    btn_prev_page: 'Previous',
    btn_next_page: 'Next',
    btn_submit: 'Submit',
    btn_connect_wallet: 'CONNECT WALLET',

    // 创作表单
    form_title: 'Add your creation',
    form_placeholder: 'Type your paragraph here (max 200 characters)...',
    form_char_count: '%current%/200 characters',
    form_success: 'Success! Your paragraph will be added to the story after review.',
    form_error_length: 'Paragraph cannot exceed 200 characters!',

    // 创建故事卡片
    create_card_title: 'Create Story',
    create_card_desc: 'Start your creative journey and collaborate with other authors on amazing stories',

    // 浏览故事卡片
    browse_card_title: 'Browse Stories',
    browse_card_desc: 'Explore creations by other authors and vote to decide story directions',

    // 卡片操作
    card_action_start: 'Start Creating',
    card_action_browse: 'Browse Now',

    // 页脚
    footer_tagline: 'Collaborative Storytelling on Sui',

    create_book_title: 'Collaborative Book Title',
    create_book_index: 'Book #{index}',
    create_status: 'Status',
    create_status_ongoing: 'Ongoing',
    create_status_archived: 'Archived',
    create_archive_threshold: 'Archive Vote Threshold',
    create_total_votes: 'Total Votes',
    create_paragraph_list: 'Paragraph List',
    create_add_paragraph: 'Add New Paragraph',
    create_paragraph_number: 'Paragraph #{number}',
    create_content: 'Content',
    create_author: 'Author',
    create_votes: 'Votes',
    create_submit: 'Submit Paragraph',
    create_archiving: 'Archive Book',
    create_edit_title: 'Editing Book Title',
    create_edit_paragraph: 'Editing Paragraph',
    create_title_placeholder: 'Enter book title (max 100 bytes)',
    create_paragraph_placeholder: 'Enter paragraph (max 2000 bytes)',
    create_title_byte_count: 'Input: {current}/100 bytes',
    create_paragraph_byte_count: 'Input: {current}/2000 bytes',
    create_title_too_long: 'Book title cannot exceed 100 bytes!',
    create_paragraph_too_long: 'Paragraph cannot exceed 2000 bytes!',
    editing_title: 'Currently editing the title',
    editing_paragraph: 'Currently editing paragraph #{number}',
    title_placeholder: 'Enter book title (max 100 bytes)',
    proposal_placeholder: 'Enter your proposal (max 2000 bytes)',
    submit_proposal: 'Submit Proposal',
    byte_count: '{current}/{max} bytes',
    start_new_book: 'Start New Book',
    close: 'Close',
    title: 'Title',
    paragraph: 'Paragraph',
    book_index: 'Book #{index}',
    no_proposal: 'No proposal yet',
    no_book: 'No book yet',
    no_paragraph: 'No paragraph yet',
    loading: 'Loading...',
    editing: 'Editing',
    proposal: 'Proposal',
    vote: 'Vote',
    voted: 'Voted',
    already_voted: 'Already voted',
    cannot_vote_self: 'Cannot vote for yourself',
    voted_other: 'Already voted for another proposal',
    archive: 'Archive',
    archiving: 'Archiving',
    archived: 'Archived',
    ongoing: 'Ongoing',
    paragraph_count: 'Paragraphs',
    total_votes: 'Total Votes',
    author: 'Author',
    content: 'Content',
    proposal_pool: 'Proposal Pool',
    vote_count: 'Votes',
    click_to_read: 'Click the cover to read this book',
    demo_book_title: 'Blockchain Collaborative Novel',
    demo_book_author: 'Sui User',
    voting_book_title: 'Voting Book: {title}',
    voting_book_author: 'Author: {author}',
    voting_book_paragraph_count: 'Paragraphs: {count}',
    voting_book_total_votes: 'Total Votes: {votes}',
    voting_book_status: 'Status: {status}',
    form_input_title: 'Please enter the new book title',
    form_input_paragraph: 'Please enter the new paragraph',
    form_input_title_placeholder: 'Enter new book title...',
    form_input_paragraph_placeholder: 'Enter new paragraph...',
    form_submitting: 'Submitting...',
    form_submit_title: 'Submit Title',
    form_submit_paragraph: 'Submit Paragraph',
    已归档的书: 'Archived Book',
    暂无归档书: 'No archived books yet',
    暂无段落: 'No paragraphs yet',
    返回: 'Back',

    // 投票信息
    voting_info_title: 'Voting Information',
    voting_info_description: 'How the voting system works:',
    voting_info_point1: 'Proposals with the most votes will be automatically added to the book when the timer expires.',
    voting_info_point2: 'Each wallet can only vote once per voting session.',
    voting_info_point3: 'Winning proposals earn tokens as rewards.',
    voting_threshold_info: 'A minimum of {threshold} votes is required for a proposal to win.',

    // 倒计时
    voting_ends_in: 'Voting ends in',
    voting_expired: 'Voting has ended',

    // 错误信息
    error_voting: 'Error occurred while voting',
    error_adding_proposal: 'Error occurred while adding proposal',
    no_active_voting_session: 'No active voting session',
    already_voted_other: 'You have already voted for another proposal',
    already_voted_this: 'You have already voted for this proposal',

    // 管理员功能
    admin_only_function: 'This function is only available to administrators'
  },

  zh: {
    // 通用
    app_name: 'NarrFlow',
    app_description: '去中心化协作创作平台',

    // 导航
    nav_home: '首页',
    nav_create: '创建故事',
    nav_browse: '浏览故事',
    nav_profile: '个人资料',
    nav_connect_wallet: '连接钱包',
    // 书本组件
    book_title: '当前协作故事',
    book_authors: '由 %count% 位作者共同创作',
    book_progress: '当前进度: {current}/{max} 段',
    book_page: '第 {current} 页 / 共 {total} 页',

    // 按钮
    btn_prev_page: '← 上一页',
    btn_next_page: '下一页 →',
    btn_submit: '提交',
    btn_connect_wallet: '连接钱包',

    // 创作表单
    form_title: '添加你的创意',
    form_placeholder: '在这里输入你的段落（不超过200字）...',
    form_char_count: '%current%/200字',
    form_success: '提交成功！您的段落将在审核后添加到故事中。',
    form_error_length: '段落内容不能超过200字！',

    // 创建故事卡片
    create_card_title: '创建故事',
    create_card_desc: '开启你的创作之旅，与其他作者共同创作精彩故事',

    // 浏览故事卡片
    browse_card_title: '浏览故事',
    browse_card_desc: '探索其他作者的创作，参与投票决定故事走向',

    // 卡片操作
    card_action_start: '开始创作',
    card_action_browse: '立即浏览',

    // 页脚
    footer_tagline: '区块链上的协作叙事平台',

    create_book_title: '协作书名',
    create_book_index: '第{index}本',
    create_status: '状态',
    create_status_ongoing: '进行中',
    create_status_archived: '已归档',
    create_archive_threshold: '归档票数阈值',
    create_total_votes: '当前总票数',
    create_paragraph_list: '段落列表',
    create_add_paragraph: '添加新段落',
    create_paragraph_number: '第{number}段',
    create_content: '内容',
    create_author: '作者',
    create_votes: '投票数',
    create_submit: '提交段落',
    create_archiving: '归档本书',
    create_edit_title: '正在编辑书名',
    create_edit_paragraph: '正在编辑段落',
    create_title_placeholder: '请输入书名（不超过100字节）',
    create_paragraph_placeholder: '请输入段落内容（不超过2000字节）',
    create_title_byte_count: '已输入：{current}/100 字节',
    create_paragraph_byte_count: '已输入：{current}/2000 字节',
    create_title_too_long: '书名不能超过100字节！',
    create_paragraph_too_long: '段落内容不能超过2000字节！',
    editing_title: '当前编辑的是标题',
    editing_paragraph: '当前编辑第{number}段',
    title_placeholder: '请输入书名（不超过100字节）',
    proposal_placeholder: '请输入你的提案（不超过2000字节）',
    submit_proposal: '提交提案',
    byte_count: '{current}/{max} 字节',
    start_new_book: '开启新书',
    close: '关闭',
    title: '标题',
    paragraph: '段落',
    book_index: '第{index}本',
    no_proposal: '暂无提案',
    no_book: '暂无书本',
    no_paragraph: '暂无段落',
    loading: '加载中...',
    editing: '编辑',
    proposal: '提案',
    vote: '投票',
    voted: '已投票',
    already_voted: '已投票',
    cannot_vote_self: '不能投自己',
    voted_other: '已投其他提案',
    archive: '归档',
    archiving: '归档中',
    archived: '已归档',
    ongoing: '进行中',
    paragraph_count: '段落数',
    total_votes: '总投票',
    author: '作者',
    content: '内容',
    proposal_pool: '候选提案池',
    vote_count: '投票数',
    click_to_read: '点击封面翻阅此书',
    demo_book_title: '区块链协作小说',
    demo_book_author: 'Sui 用户',
    voting_book_title: '正在投票的书：{title}',
    voting_book_author: '作者：{author}',
    voting_book_paragraph_count: '段落数：{count}',
    voting_book_total_votes: '总投票：{votes}',
    voting_book_status: '状态：{status}',
    form_input_title: '请输入新书标题',
    form_input_paragraph: '请输入新段落内容',
    form_input_title_placeholder: '输入新书标题...',
    form_input_paragraph_placeholder: '输入新段落内容...',
    form_submitting: '提交中...',
    form_submit_title: '提交书名',
    form_submit_paragraph: '提交段落',
    已归档的书: '已归档的书',
    暂无归档书: '暂无归档书',
    暂无段落: '暂无段落',
    返回: '返回',

    // 投票信息
    voting_info_title: '投票信息',
    voting_info_description: '投票系统说明：',
    voting_info_point1: '当倒计时结束时，得票最多的提案将自动添加到书中。',
    voting_info_point2: '每个钱包在每个投票会话中只能投一次票。',
    voting_info_point3: '获胜的提案将获得代币奖励。',
    voting_threshold_info: '提案需要至少获得{threshold}票才能胜出。',

    // 倒计时
    voting_ends_in: '投票剩余时间',
    voting_expired: '投票已结束',

    // 错误信息
    error_voting: '投票时发生错误',
    error_adding_proposal: '添加提案时发生错误',
    no_active_voting_session: '没有活跃的投票会话',
    already_voted_other: '您已经为其他提案投过票了',
    already_voted_this: '您已经为此提案投过票了',

    // 管理员功能
    admin_only_function: '此功能仅管理员可用'
  }
};