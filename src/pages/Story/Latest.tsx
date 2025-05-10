import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useSuiStory } from '../../hooks/useSuiStory';
import { useLang } from '../../contexts/lang/LangContext';
import { shortenAddress } from '../../utils/langUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { decompressFromBase64 } from 'lz-string';
import { FadeIn, SlideUp, BookAnimation } from '../../components/animations';
import { isMobileDevice } from '../../utils/deviceUtils';

const LatestStory: React.FC = () => {
  const { getAllBooks, getAllParagraphs } = useSuiStory();
  const { t } = useLang();
  const [archivedBooks, setArchivedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState(0); // -1: 向左翻, 1: 向右翻, 0: 不翻
  const [isMobile, setIsMobile] = useState(false);

  // 分页参数
  const paragraphsPerPage = 2;
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

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true);
      const books = await getAllBooks();
      const archived = books.filter((b: any) => b.status === 1);
      setArchivedBooks(archived);
      setLoading(false);
    }
    fetchLatest();
  }, []);

  // 分页逻辑
  const getParagraphsForPage = (pageIndex: number) => {
    const startIdx = pageIndex * paragraphsPerPage;
    const endIdx = Math.min(startIdx + paragraphsPerPage, paragraphs.length);
    return paragraphs.slice(startIdx, endIdx);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-lg text-gray-500">{t('loading')}</span>
        </div>
      </div>
    );
  }

  // 封面列表
  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-paper-texture">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <FadeIn direction="up" duration={0.7}>
            <h1 className="text-5xl font-title font-bold text-primary-800 dark:text-primary-100 mb-3 text-center tracking-wide">
              {t('browse_card_title')}
            </h1>
            <p className={`${isMobile ? 'text-lg mb-6' : 'text-xl mb-12'} font-serif text-gray-700 dark:text-gray-300 text-center max-w-3xl mx-auto leading-relaxed`}>
              {t('browse_card_desc')}
            </p>
          </FadeIn>

          {archivedBooks.length === 0 && (
            <div className="text-gray-400 text-center text-xl mt-24">{t('暂无归档书')}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mt-8">
            {archivedBooks.map((book, idx) => (
              <SlideUp key={book.id || idx} delay={0.2 + idx * 0.1} hover={true}>
                <div
                  className="flex flex-row rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-transform duration-300 cursor-pointer bg-white dark:bg-gray-900"
                  onClick={async () => {
                    setSelectedBook(book);
                    setLoading(true);
                    setPageIndex(0); // 重置页码
                    const paras = await getAllParagraphs(book);
                    setParagraphs(paras);
                    setLoading(false);
                  }}
                  style={{ minHeight: 220 }}
                >
                  {/* 封面区 */}
                  <div className="w-1/3 min-w-[120px] bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-700 rounded-l-2xl flex flex-col justify-center items-center shadow-lg relative p-4">
                    <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-amber-200/60 to-amber-900/80 rounded-l-2xl" />
                    <div className="text-xl font-bold text-white text-center break-words mb-2 drop-shadow-lg" style={{ textShadow: '0 2px 8px #0006' }}>{book.title}</div>
                    <div className="text-amber-100 text-sm mb-1 flex items-center">
                      <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">✍️</span>
                      {shortenAddress(book.author)}
                    </div>
                    <div className="text-amber-100 text-sm mb-1 flex items-center">
                      <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📝</span>
                      {t('paragraph_count')}：{book.paragraphs?.length || 0}
                    </div>
                    <div className="text-amber-100 text-sm flex items-center">
                      <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📊</span>
                      {t('create_status')}：{t('create_status_archived')}
                    </div>
                  </div>
                  {/* 内容区 */}
                  <div className="flex-1 rounded-r-2xl flex flex-col justify-center items-center p-6">
                    <div className="text-lg font-semibold text-primary-700 dark:text-primary-200 mb-2">{t('click_to_read')}</div>
                    <div className="text-gray-400 text-sm">{t('已归档的书')}</div>
                  </div>
                </div>
              </SlideUp>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 当前页段落
  const currentPageParagraphs = getParagraphsForPage(pageIndex);

  // 书详情页 - 使用与主页相同的书籍展示逻辑
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-paper-texture">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between mb-6">
          <button
            onClick={() => setSelectedBook(null)}
            className="px-4 py-2 bg-primary-100 dark:bg-gray-700 rounded-lg hover:bg-primary-200 dark:hover:bg-gray-600 text-primary-700 dark:text-primary-200 transition-colors duration-200 flex items-center shadow-sm"
          >
            <span className="mr-2">←</span> {t('返回')}
          </button>
        </div>

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
                  <h2 className="text-white dark:text-amber-100 text-xl font-title tracking-wide">{t('已归档的书')}</h2>
                </div>

                <h3 className="text-white dark:text-gray-200 text-2xl font-serif mb-4 border-b border-amber-200/20 pb-3">{selectedBook.title}</h3>

                <div className="space-y-2.5">
                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">✍️</span>
                    {t('create_author')}：{shortenAddress(selectedBook.author)}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📝</span>
                    {t('paragraph_count')}：{paragraphs.length}
                  </p>

                  <p className="text-white dark:text-gray-300 text-sm font-medium flex items-center">
                    <span className="w-5 h-5 inline-flex items-center justify-center mr-2 opacity-70">📊</span>
                    {t('create_status')}：
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {t('create_status_archived')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-amber-200/20">
                <span className="text-white dark:text-gray-300 text-sm font-medium">
                  {t('book_page', { current: pageIndex + 1, total: totalPages })}
                </span>
                <div className="text-white dark:text-gray-300 text-xs opacity-70">
                  NarrFlow © 2025
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
                    {currentPageParagraphs.length === 0 && (
                      <div className="text-gray-400 text-center mt-10">{t('暂无段落')}</div>
                    )}

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
                          {/* 尝试解压内容，如果失败则直接显示原始内容 */}
                          {(() => {
                            try {
                              if (paragraph.content && typeof paragraph.content === 'string' && paragraph.content.trim().length > 0) {
                                // 尝试解压
                                const decompressed = decompressFromBase64(paragraph.content);
                                if (decompressed) return decompressed;
                              }
                              // 如果解压失败或内容为空，直接显示原始内容
                              return paragraph.content || paragraph.walrus_id || '';
                            } catch (e) {
                              console.log('解压段落内容失败:', e);
                              return paragraph.content || paragraph.walrus_id || '';
                            }
                          })()}
                        </p>
                        <div className="flex justify-end items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-3 italic font-handwriting text-sm">—— {shortenAddress(paragraph.author)}</span>
                          <span className="flex items-center bg-amber-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="font-medium text-amber-700 dark:text-amber-300">{Number(paragraph.votes) || 0}</span>
                          </span>
                        </div>
                      </motion.div>
                    ))}
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
      </div>
    </div>
  );
};

export default LatestStory;