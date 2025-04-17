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
    book_progress: 'Current progress: %current%/%max% paragraphs',
    book_page: 'Page %current% / %total%',
    
    // 按钮
    btn_prev_page: '← Previous',
    btn_next_page: 'Next →',
    btn_submit: 'Submit',
    
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
    browse_card_desc: 'Explore creations by other authors and vote to decide story directions'
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
    
    // 书本组件
    book_title: '当前协作故事',
    book_authors: '由 %count% 位作者共同创作',
    book_progress: '当前进度: %current%/%max% 段',
    book_page: '第 %current% 页 / 共 %total% 页',
    
    // 按钮
    btn_prev_page: '← 上一页',
    btn_next_page: '下一页 →',
    btn_submit: '提交',
    
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
    browse_card_desc: '探索其他作者的创作，参与投票决定故事走向'
  }
}; 