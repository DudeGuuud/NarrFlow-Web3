import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SlideUp, BookAnimation } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';
import { replaceParams } from '../../utils/langUtils';
import { isMobileDevice } from '../../utils/deviceUtils';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { shortenAddress } from '../../utils/langUtils';
import { decompressFromBase64 } from 'lz-string';

const MAX_BYTES = 2000;

// VotingBook 组件：展示正在投票的书（链上集成预留接口）
const VotingBook: React.FC = () => {
  const { t } = useLang();
  // TODO: 替换为链上查询逻辑
  // 示例数据
  const [book, setBook] = useState<any>({
    title: t('demo_book_title'),
    author: t('demo_book_author'),
    paragraph_count: 5,
    total_votes: 8,
    status: 0,
  });
  // 可根据链上 currentBookId 判断是否有正在投票的书
  if (!book) return null;
  return (
    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">{t('voting_book_title', { title: book.title })}</h2>
      <p>{t('voting_book_author', { author: book.author })}</p>
      <p>{t('voting_book_paragraph_count', { count: book.paragraph_count })}</p>
      <p>{t('voting_book_total_votes', { votes: book.total_votes })}</p>
      <p>{t('voting_book_status', { status: book.status === 0 ? t('create_status_ongoing') : t('create_status_archived') })}</p>
    </div>
  );
};

const Home: React.FC = () => {
  const { t } = useLang();
  const [pageIndex, setPageIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState(0); // -1: 向左翻, 1: 向右翻, 0: 不翻
  const [isMobile, setIsMobile] = useState(false);
  const {
    startNewBook,
    addParagraph,
    getAllBooks,
    getAllParagraphs,
    calcContentHash,
  } = useSuiStory();

  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [inputBytes, setInputBytes] = useState(0);
  const [loading, setLoading] = useState(false);

  // 分页参数
  const paragraphsPerPage = 2;
  const maxParagraphs = 10;
  const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage) || 1;

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

  // 监听input变化，统计字节数
  useEffect(() => {
    setInputBytes(new TextEncoder().encode(input).length);
  }, [input]);

  // 分页逻辑
  const getParagraphsForPage = (pageIndex: number) => {
    const startIdx = pageIndex * paragraphsPerPage;
    const endIdx = Math.min(startIdx + paragraphsPerPage, paragraphs.length);
    return paragraphs.slice(startIdx, endIdx);
  };
  const isLastPage = (pageIndex: number) => {
    return pageIndex === totalPages - 1;
  };

  const goToNextPage = () => {
    if (pageIndex < totalPages - 1 && !flipping) {
      setDirection(1);
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
      setDirection(-1);
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

  // 输入框onChange处理，禁止超出MAX_BYTES
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const bytes = new TextEncoder().encode(value).length;
    if (bytes <= MAX_BYTES) {
      setInput(value);
    } else {
      // 超出字节数时不更新input
    }
  };

  // 判断当前是提交书名还是段落
  const isEditingTitle = !currentBook || currentBook.status === 1;

  // 提交新书 or 段落
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!currentBook) {
        await startNewBook(input);
      } else {
        await addParagraph(input);
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
      rotateY: direction > 0 ? -90 : 90,
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
      rotateY: direction < 0 ? -90 : 90,
      opacity: 0,
      zIndex: 10,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    })
  };
  const pageTransition = {
    type: "tween",
    duration: 0.5,
    ease: "easeInOut"
  };

  // 当前页段落
  const currentPageParagraphs = getParagraphsForPage(pageIndex);
  const showSubmissionForm = isLastPage(pageIndex) && paragraphs.length < maxParagraphs;

  // 书本信息（链上数据）
  const votingBook = currentBook || {
    title: t('暂无书本'),
    author: '',
    paragraph_count: 0,
    total_votes: 0,
    status: 0,
    maxParagraphs,
    collaborators: 0,
  };

  // 由段落去重 author 得到作者数
  const authorSet = new Set((paragraphs || []).map((p: any) => p.author));
  const collaborators = authorSet.size;
  // 总投票数
  const totalVotes = (paragraphs || []).reduce((sum: number, p: any) => sum + (p.votes || 0), 0);
  // 作者地址缩略
  const authorShort = votingBook.author ? shortenAddress(votingBook.author) : '';

  // 在Home组件内添加调试输出
  useEffect(() => {
    console.log('paragraphs:', paragraphs, 'totalPages:', totalPages, 'maxParagraphs:', maxParagraphs);
  }, [paragraphs, totalPages, maxParagraphs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-paper-texture">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <FadeIn direction="up" duration={0.7}>
          <h1 className="text-5xl font-title font-bold text-primary-800 dark:text-primary-100 mb-3 text-center tracking-wide">
            {t('app_name')}
          </h1>
          <p className={`${isMobile ? 'text-lg mb-6' : 'text-xl mb-12'} font-serif text-gray-700 dark:text-gray-300 text-center max-w-3xl mx-auto leading-relaxed`}>
            {t('app_description')}
          </p>
        </FadeIn>
        {/* 书本组件（增强样式） */}
        <BookAnimation className="relative max-w-4xl mx-auto mb-12">
          <div className={`w-full rounded-xl shadow-book hover:shadow-book-hover transition-all duration-500 overflow-hidden ${isMobile ? 'flex flex-col' : 'flex aspect-[2/1.2]'}`}>
            {/* 书本封面 - 左侧或顶部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full py-4' : 'w-1/2 h-full'}
              bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-700
              p-6 flex flex-col justify-between
              border-r border-amber-700/30 dark:border-gray-900/50
              shadow-inner
            `}>
              <div>
                <div className="mb-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mr-3">
                    <span className="text-amber-500 dark:text-amber-300 text-xl font-serif">📖</span>
                  </div>
                  <h2 className="text-white dark:text-amber-100 text-xl font-title tracking-wide">{t('book_title')}</h2>
                </div>

                <h3 className="text-white dark:text-gray-200 text-2xl font-serif mb-4 border-b border-amber-200/20 pb-3">{votingBook.title}</h3>

                <div className="space-y-2.5">
                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">👥</span>
                    {t('book_authors', { count: collaborators })}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📝</span>
                    {t('book_progress', { current: Array.isArray(paragraphs) ? paragraphs.length : 0, max: maxParagraphs })}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">✍️</span>
                    {t('create_author')}：{authorShort}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">👍</span>
                    {t('create_total_votes')}：{totalVotes}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📊</span>
                    {t('create_status')}：
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      votingBook.status === 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {votingBook.status === 0 ? t('create_status_ongoing') : t('create_status_archived')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-amber-200/20">
                <span className="text-white dark:text-gray-300 text-sm font-medium">
                  {t('book_page', { current: pageIndex + 1, total: totalPages })}
                </span>
                <div className="text-white dark:text-gray-300 text-xs opacity-70">
                  NarrFlow © 2024
                </div>
              </div>
            </div>
            {/* 书页内容 - 右侧或底部（移动设备） */}
            <div className={`
              ${isMobile ? 'w-full' : 'w-1/2'}
              ${isMobile ? 'h-[calc(100vh-300px)]' : 'h-full'}
              bg-amber-50 dark:bg-gray-900 p-0 relative perspective-[1500px] overflow-hidden
            `}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={pageIndex}
                  className="absolute top-0 left-0 w-full h-full bg-amber-50 dark:bg-gray-900 p-6 flex flex-col justify-between origin-[left_center]"
                  style={{
                    transformStyle: "preserve-3d",
                    background: "#FFF8E7",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.05)"
                  }}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageTransition}
                >
                  <div className="prose dark:prose-invert max-w-none overflow-y-auto h-[calc(100%-50px)] pb-4 scrollbar-hide">
                    {/* 页码装饰 */}
                    <div className="absolute top-3 right-4 text-xs font-serif text-gray-400 dark:text-gray-500">
                      {pageIndex + 1}
                    </div>

                    {/* 段落内容（链上数据） */}
                    {currentPageParagraphs.map((paragraph, idx) => (
                      <motion.div
                        key={idx}
                        className={`${isMobile ? 'mb-6' : 'mb-10'} last:mb-4`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                      >
                        <p className={
                          `${isMobile ? 'text-base' : 'text-lg'}
                          leading-relaxed font-serif mb-2 pl-6 first-letter:text-2xl first-letter:font-bold
                          first-letter:text-primary-700 dark:first-letter:text-primary-400
                          text-gray-900 dark:text-gray-200`
                        }>
                          {paragraph.content ? decompressFromBase64(paragraph.content) : paragraph.walrus_id}
                        </p>
                        <div className="flex justify-end items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-3 italic font-handwriting text-sm">—— {paragraph.author}</span>
                          <span className="flex items-center bg-amber-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="font-medium text-amber-700 dark:text-amber-300">{paragraph.votes}</span>
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {/* 如果是最后一页且段落未满10段，显示提交表单 */}
                    {showSubmissionForm && (
                      <motion.div
                        className="mt-8 p-5 bg-white/80 dark:bg-gray-800/90 rounded-lg border border-amber-200 dark:border-gray-700 shadow-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h4 className="text-lg font-serif font-medium text-amber-900 dark:text-amber-200 mb-3 flex items-center">
                          <span className="w-6 h-6 inline-flex items-center justify-center mr-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-700 dark:text-amber-300">
                            ✍️
                          </span>
                          {isEditingTitle ? t('form_input_title') : t('form_input_paragraph')}
                        </h4>
                        <textarea
                          className="w-full p-3 border border-amber-200 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700 focus:border-transparent transition-all duration-200"
                          rows={3}
                          placeholder={isEditingTitle ? t('form_input_title_placeholder') : t('form_input_paragraph_placeholder')}
                          value={input}
                          onChange={handleInputChange}
                        ></textarea>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                            {t('byte_count', { current: inputBytes, max: MAX_BYTES })}
                          </span>
                          <button
                            onClick={handleSubmit}
                            className={`px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-amber-700 dark:to-amber-800 dark:hover:from-amber-600 dark:hover:to-amber-700 text-white rounded-md shadow-sm transition-all duration-200 flex items-center ${
                              loading || !input.trim() || inputBytes > MAX_BYTES ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                            }`}
                            disabled={loading || !input.trim() || inputBytes > MAX_BYTES}
                          >
                            <span className="mr-1">{loading ? '⏳' : '✨'}</span>
                            {loading ? t('form_submitting') : isEditingTitle ? t('form_submit_title') : t('form_submit_paragraph')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-between mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <button
                      onClick={goToPrevPage}
                      disabled={pageIndex === 0 || flipping}
                      className={`px-4 py-1.5 rounded-md flex items-center transition-all duration-200 ${
                        pageIndex === 0 || flipping
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-primary-600 hover:bg-primary-50 hover:shadow-sm dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="mr-1">←</span> {t('btn_prev_page')}
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={pageIndex === totalPages - 1 || flipping}
                      className={`px-4 py-1.5 rounded-md flex items-center transition-all duration-200 ${
                        pageIndex === totalPages - 1 || flipping
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-primary-600 hover:bg-primary-50 hover:shadow-sm dark:text-primary-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('btn_next_page')} <span className="ml-1">→</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 翻页时的阴影效果 */}
              {flipping && (
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    direction > 0
                      ? 'bg-gradient-to-l from-black/15 to-transparent'
                      : 'bg-gradient-to-r from-black/15 to-transparent'
                  }`}
                />
              )}

              {/* 书页卷曲效果 - 使用CSS渐变代替图片 */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-amber-200/30 to-transparent rounded-tl-full pointer-events-none"></div>
            </div>
          </div>

          {/* 书本阴影 */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-[85%] h-8 bg-black/20 dark:bg-black/40 filter blur-lg rounded-full animate-pulse-soft"></div>
        </BookAnimation>
        {/* 操作卡片 - 增强版 */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-8'} max-w-4xl mx-auto mt-8`}>
          <SlideUp delay={0.3} hover={true}>
            <Link
              to="/create"
              className="group block p-7 bg-white dark:bg-gray-800 rounded-xl shadow-card-elegant hover:shadow-book-hover border border-primary-100 dark:border-gray-700 transition-all duration-500 overflow-hidden relative"
            >
              {/* 闪光效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1500 ease-in-out"></div>

              <div className="flex items-center mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center text-xl text-white shadow-md group-hover:scale-110 transition-transform duration-500">
                  <span className="animate-float">✍️</span>
                </div>
                <h2 className="text-2xl font-title font-semibold text-primary-800 dark:text-primary-200 ml-4 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">
                  {t('create_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-serif leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors duration-300">
                {t('create_card_desc')}
              </p>

              {/* 卡片底部装饰 */}
              <div className="mt-4 pt-3 border-t border-primary-100 dark:border-gray-700 flex justify-end">
                <span className="text-primary-500 dark:text-primary-400 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {t('card_action_start')} <span className="ml-1">→</span>
                </span>
              </div>
            </Link>
          </SlideUp>

          <SlideUp delay={0.5} hover={true}>
            <Link
              to="/story/latest"
              className="group block p-7 bg-white dark:bg-gray-800 rounded-xl shadow-card-elegant hover:shadow-book-hover border border-secondary-100 dark:border-gray-700 transition-all duration-500 overflow-hidden relative"
            >
              {/* 闪光效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1500 ease-in-out"></div>

              <div className="flex items-center mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 dark:from-secondary-600 dark:to-secondary-800 flex items-center justify-center text-xl text-white shadow-md group-hover:scale-110 transition-transform duration-500">
                  <span className="animate-float">📚</span>
                </div>
                <h2 className="text-2xl font-title font-semibold text-secondary-800 dark:text-secondary-200 ml-4 group-hover:text-secondary-600 dark:group-hover:text-secondary-300 transition-colors duration-300">
                  {t('browse_card_title')}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-serif leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors duration-300">
                {t('browse_card_desc')}
              </p>

              {/* 卡片底部装饰 */}
              <div className="mt-4 pt-3 border-t border-secondary-100 dark:border-gray-700 flex justify-end">
                <span className="text-secondary-500 dark:text-secondary-400 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {t('card_action_browse')} <span className="ml-1">→</span>
                </span>
              </div>
            </Link>
          </SlideUp>
        </div>

        {/* 页脚装饰 */}
        <div className="text-center mt-12 mb-6 text-gray-500 dark:text-gray-400 text-sm font-serif">
          <p>NarrFlow — {t('footer_tagline')}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;