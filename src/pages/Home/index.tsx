import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SlideUp } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';
import { replaceParams } from '../../utils/langUtils';
import { isMobileDevice } from '../../utils/deviceUtils';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';

// 爱丽丝梦游仙境片段
const ALICE_STORY = {
  title: "爱丽丝梦游仙境",
  author: "刘易斯·卡罗尔",
  // 每段落不超过200字
  paragraphs: [
    {
      content: "爱丽丝开始感到非常疲倦，她坐在河岸上，百无聊赖地看着姐姐读的书。书里既没有插图也没有对话，'一本没有插图和对话的书有什么用呢？'爱丽丝想着。她正在考虑（尽管天气炎热、昏昏欲睡，这让思考变得很困难）摘雏菊来编花环是否值得站起来，就在这时，一只长着粉红眼睛的白兔跑过她身边。",
      author: "原著译者",
      votes: 245
    },
    {
      content: "这本身没什么特别的；爱丽丝也没觉得听到兔子自言自语'哎呀！哎呀！我要迟到了！'有多奇怪。（事后回想，她觉得她应该感到惊讶，但当时这似乎很自然。）但当兔子从马甲口袋里掏出一块怀表，看了一眼，然后匆匆忙忙地跑开时，爱丽丝才跳了起来。",
      author: "文学爱好者",
      votes: 184
    },
    {
      content: "突然意识到她从未见过一只兔子有马甲口袋，更别说能从里面掏出怀表了，好奇心促使她跟着兔子跑过草地，幸好及时看到它钻进了一个大兔子洞，就在树篱下。一瞬间，爱丽丝也跟着钻了进去，完全没想过自己该怎么出来。",
      author: "梦境记录者",
      votes: 217
    },
    {
      content: "兔子洞先是笔直向前，像隧道一样，然后突然向下倾斜，倾斜得如此突然，以至于爱丽丝甚至来不及考虑停下来，就发现自己正在坠入一口看似非常深的井中。井要么非常深，要么她下落得很慢，因为她在下降过程中有足够的时间环顾四周，想知道接下来会发生什么。",
      author: "幻想作家",
      votes: 176
    },
    {
      content: "首先，她试图向下看，想看清自己要去的地方，但那里太黑了，什么也看不见。然后，她看了看井壁，发现四周都是橱柜和书架；这里那里还挂着地图和图画。她经过时从一个架子上取下一罐果酱，上面标着'橘子酱'，但让她失望的是，罐子是空的。",
      author: "童话解析师",
      votes: 132
    },
    {
      content: "她不想把罐子扔下去，怕打到下面的人，所以在掉落时设法把它放在了经过的另一个橱柜里。'这真是不寻常，像这样在井里下降！'爱丽丝想，'那我今后从楼梯上摔下来一定会觉得稀松平常！大家会多么赞赏我的勇敢！即使从房顶上掉下来，我也不会说什么。'",
      author: "心理分析家",
      votes: 147
    },
    {
      content: "向下，向下，向下。这个下落永远不会结束吗？'我落下了多远呢？'她大声说，'我一定快要接近地球的中心了。让我看看：那应该是四千英里深。'（你瞧，爱丽丝学过不少课，虽然这不是展示知识的好机会，因为没有人听，但复习一下总是好的。）",
      author: "数学家",
      votes: 102
    }
  ],
  // 每页显示的段落数
  paragraphsPerPage: 2,
  // 总共最多显示10段
  maxParagraphs: 10,
  // 当前协作者数
  collaborators: 7
};

// 计算总页数
const totalPages = Math.ceil(ALICE_STORY.paragraphs.length / ALICE_STORY.paragraphsPerPage);

// 处理段落分页
const getParagraphsForPage = (pageIndex: number) => {
  const startIdx = pageIndex * ALICE_STORY.paragraphsPerPage;
  const endIdx = Math.min(startIdx + ALICE_STORY.paragraphsPerPage, ALICE_STORY.paragraphs.length);
  return ALICE_STORY.paragraphs.slice(startIdx, endIdx);
};

// 是否是最后一页
const isLastPage = (pageIndex: number) => {
  return pageIndex === totalPages - 1;
};

// VotingBook 组件：展示正在投票的书（链上集成预留接口）
const VotingBook: React.FC = () => {
  // TODO: 替换为链上查询逻辑
  // 示例数据
  const [book, setBook] = useState<any>({
    title: '区块链协作小说',
    author: 'Sui 用户',
    paragraph_count: 5,
    total_votes: 8,
    status: 0,
  });
  // 可根据链上 currentBookId 判断是否有正在投票的书
  if (!book) return null;
  return (
    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">正在投票的书：{book.title}</h2>
      <p>作者：{book.author}</p>
      <p>段落数：{book.paragraph_count}</p>
      <p>总投票：{book.total_votes}</p>
      <p>状态：{book.status === 0 ? '进行中' : '已归档'}</p>
    </div>
  );
};

const Home: React.FC = () => {
  const { t } = useLang();
  const [pageIndex, setPageIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState(0); // -1: 向左翻, 1: 向右翻, 0: 不翻
  const [newParagraph, setNewParagraph] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const {
    startNewBook,
    addParagraph,
    getAllBooks,
    getAllParagraphs,
    uploadToWalrus,
    calcContentHash,
  } = useSuiStory();

  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);
  
  // 获取所有书，找到进行中的书
  useEffect(() => {
    async function fetchBooks() {
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      const ongoing = allBooks.find((b: any) => b.status === 0);
      setCurrentBook(ongoing || null);
      if (ongoing) {
        const paras = await getAllParagraphs(ongoing);
        setParagraphs(paras);
      } else {
        setParagraphs([]);
      }
    }
    fetchBooks();
  }, []);
  
  const goToNextPage = () => {
    if (pageIndex < totalPages - 1 && !flipping) {
      setDirection(1); // 从右向左翻
      setFlipping(true);
      setTimeout(() => {
        setPageIndex(pageIndex + 1);
        setTimeout(() => {
          setFlipping(false);
          setDirection(0);
        }, 50);
      }, 250);
    }
  };
  
  const goToPrevPage = () => {
    if (pageIndex > 0 && !flipping) {
      setDirection(-1); // 从左向右翻
      setFlipping(true);
      setTimeout(() => {
        setPageIndex(pageIndex - 1);
        setTimeout(() => {
          setFlipping(false);
          setDirection(0);
        }, 50);
      }, 250);
    }
  };

  // 提交新书 or 段落
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!currentBook) {
        // 提交新书
        await startNewBook(input);
      } else {
        // 提交段落
        // 先上传到 Walrus，拿到 walrus_id
        const walrusId = await uploadToWalrus(input);
        // 可选：计算内容哈希
        // const contentHash = await calcContentHash(input);
        await addParagraph(walrusId); // 这里假设 addParagraph 只存 walrus_id
      }
      setInput('');
      // 刷新
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      const ongoing = allBooks.find((b: any) => b.status === 0);
      setCurrentBook(ongoing || null);
      if (ongoing) {
        const paras = await getAllParagraphs(ongoing);
        setParagraphs(paras);
      } else {
        setParagraphs([]);
      }
    } catch (e) {
      alert('提交失败: ' + (e as any).message);
    }
    setLoading(false);
  };

  // 页面变体 - 修正翻页方向
  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90, // 修正方向：下一页从右边进入，上一页从左边进入
      opacity: 0,
      zIndex: 10,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 20,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? -90 : 90, // 修正方向：下一页时当前页从左边退出，上一页时当前页从右边退出
      opacity: 0,
      zIndex: 10,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    })
  };
  
  // 页面过渡
  const pageTransition = {
    type: "tween",
    duration: 0.5,
    ease: "easeInOut"
  };

  // 获取当前页的段落
  const currentPageParagraphs = getParagraphsForPage(pageIndex);
  const showSubmissionForm = isLastPage(pageIndex) && ALICE_STORY.paragraphs.length < ALICE_STORY.maxParagraphs;

  // "正在投票的书" 示例数据
  const votingBook = {
    title: '爱丽丝梦游仙境',
    author: 'Sui 用户',
    paragraph_count: 8,
    total_votes: 8,
    status: 0,
    maxParagraphs: 10,
    collaborators: 7,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-2 text-center">
            {t('app_name')}
          </h1>
          <p className={`${isMobile ? 'text-lg mb-4' : 'text-xl mb-10'} text-gray-700 dark:text-gray-300 text-center`}>
            {t('app_description')}
          </p>
        </FadeIn>
        
        {/* 书本组件 */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <div className={`w-full rounded-lg shadow-2xl overflow-hidden ${isMobile ? 'flex flex-col' : 'flex aspect-[2/1.2]'}`}>
            {/* 书本封面 - 左侧或顶部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full py-4' : 'w-1/2 h-full'} 
              bg-gradient-to-r from-amber-900 to-amber-700 dark:from-gray-700 dark:to-gray-600 
              p-4 flex flex-col justify-between
            `}>
              <div>
                <h2 className="text-white text-xl font-bold mb-2">当前协作故事</h2>
                <h3 className="text-amber-100 dark:text-gray-300 text-2xl font-serif mb-3">{votingBook.title}</h3>
                <p className="text-amber-200 dark:text-gray-400 text-sm">
                  由 {votingBook.collaborators} 位作者共同创作
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  当前进度: {votingBook.paragraph_count}/{votingBook.maxParagraphs} 段
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  作者：{votingBook.author}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  总投票：{votingBook.total_votes}
                </p>
                <p className="text-amber-200 dark:text-gray-400 mt-1 text-sm">
                  状态：{votingBook.status === 0 ? '进行中' : '已归档'}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-200 dark:text-gray-400 text-sm">
                  {replaceParams(t('book_page'), { current: pageIndex + 1, total: totalPages })}
                </span>
              </div>
            </div>
            
            {/* 书页内容 - 右侧或底部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full' : 'w-1/2'} 
              ${isMobile ? 'h-[calc(100vh-300px)]' : 'h-full'} 
              bg-white dark:bg-gray-900 p-0 relative perspective-[1500px] overflow-hidden
            `}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={pageIndex}
                  className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-900 p-5 flex flex-col justify-between origin-[left_center]"
                  style={{ transformStyle: "preserve-3d" }}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageTransition}
                >
                  <div className="prose dark:prose-invert max-w-none overflow-y-auto h-[calc(100%-50px)] pb-4">
                    {/* 无分隔线的段落 */}
                    {currentPageParagraphs.map((paragraph, idx) => (
                      <div 
                        key={idx} 
                        className={`${isMobile ? 'mb-5' : 'mb-8'} last:mb-4`}
                      >
                        <p className={`
                          ${isMobile ? 'text-base' : 'text-lg'} 
                          leading-relaxed font-serif mb-1 pl-6 first-letter:text-xl first-letter:font-bold
                        `}>
                          {paragraph.content}
                        </p>
                        <div className="flex justify-end items-center mt-0.5 text-xs text-gray-400 dark:text-gray-500 opacity-70">
                          <span className="mr-3 italic">—— {paragraph.author}</span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {paragraph.votes}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* 如果是最后一页且段落未满10段，显示提交表单 */}
                    {showSubmissionForm && (
                      <div className="mt-6 p-4 bg-amber-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-lg font-medium text-amber-900 dark:text-amber-200 mb-2">
                          {t('form_title')}
                        </h4>
                        <textarea
                          className="w-full p-2 border border-amber-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          rows={3}
                          placeholder={t('form_placeholder')}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          maxLength={200}
                        ></textarea>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            {replaceParams(t('form_char_count'), { current: input.length })}
                          </span>
                          <button
                            onClick={handleSubmit}
                            className="px-4 py-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-800 dark:hover:bg-amber-700 text-white rounded"
                            disabled={loading || !input.trim()}
                          >
                            {loading ? '提交中...' : t('btn_submit')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={goToPrevPage}
                      disabled={pageIndex === 0 || flipping}
                      className={`p-2 rounded-full ${
                        pageIndex === 0 || flipping
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('btn_prev_page')}
                    </button>
                    <button 
                      onClick={goToNextPage}
                      disabled={pageIndex === totalPages - 1 || flipping}
                      className={`p-2 rounded-full ${
                        pageIndex === totalPages - 1 || flipping
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('btn_next_page')}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* 翻页时的阴影效果 */}
              {flipping && (
                <div 
                  className={`absolute inset-0 pointer-events-none ${
                    direction > 0 
                      ? 'bg-gradient-to-l from-black/10 to-transparent' 
                      : 'bg-gradient-to-r from-black/10 to-transparent'
                  }`}
                />
              )}
            </div>
          </div>
          
          {/* 书本阴影 */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] h-6 bg-black/20 dark:bg-black/40 filter blur-md rounded-full"></div>
        </div>
        
        {/* 操作卡片 */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'} max-w-4xl mx-auto`}>
          <SlideUp delay={0.2}>
            <Link 
              to="/create" 
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xl text-primary-600 dark:text-primary-300">
                  ✍️
                </div>
                <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200 ml-4">
                  {t('create_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('create_card_desc')}
              </p>
            </Link>
          </SlideUp>

          <SlideUp delay={0.4}>
            <Link 
              to="/story/latest" 
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center text-xl text-secondary-600 dark:text-secondary-300">
                  📚
                </div>
                <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200 ml-4">
                  {t('browse_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('browse_card_desc')}
              </p>
            </Link>
          </SlideUp>
        </div>
      </div>
    </div>
  );
};

export default Home;