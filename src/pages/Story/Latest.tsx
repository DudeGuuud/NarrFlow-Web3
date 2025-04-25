import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { useLang } from '../../contexts/lang/LangContext';
import { shortenAddress } from '../../utils/langUtils';
import { motion, AnimatePresence } from 'framer-motion';

const LatestStory: React.FC = () => {
  const { getAllBooks, getAllParagraphContents } = useSuiStory();
  const { t } = useLang();
  const [latestBook, setLatestBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState(0);

  // 分页参数
  const paragraphsPerPage = 2;
  const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage) || 1;

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true);
      const books = await getAllBooks();
      const archived = books.filter((b: any) => b.status === 1);
      const latest = archived.length ? archived[archived.length - 1] : null;
      setLatestBook(latest);
      if (latest) {
        const paras = await getAllParagraphContents(latest);
        setParagraphs(paras);
      } else {
        setParagraphs([]);
      }
      setLoading(false);
    }
    fetchLatest();
  }, []);

  // 翻页逻辑
  const getParagraphsForPage = (pageIdx: number) => {
    const startIdx = pageIdx * paragraphsPerPage;
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

  // 动画参数
  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      zIndex: 10,
      boxShadow: '0 0 0 rgba(0,0,0,0)'
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 20,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? -90 : 90,
      opacity: 0,
      zIndex: 10,
      boxShadow: '0 0 0 rgba(0,0,0,0)'
    })
  };
  const pageTransition = {
    type: 'tween',
    duration: 0.5,
    ease: 'easeInOut'
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800"><span className="text-lg text-gray-500">{t('加载中...') || '加载中...'}</span></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        {!showBook && latestBook ? (
          <div
            className="flex flex-row max-w-2xl w-full rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-transform duration-300 cursor-pointer"
            onClick={() => setShowBook(true)}
            style={{ minHeight: 320 }}
          >
            {/* 封面区 */}
            <div className="w-1/3 min-w-[160px] bg-gradient-to-br from-orange-700 via-yellow-700 to-yellow-400 dark:from-gray-800 dark:via-gray-700 dark:to-gray-500 rounded-l-2xl flex flex-col justify-center items-center shadow-lg relative">
              <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300/60 to-orange-900/80 rounded-l-2xl" />
              <div className="text-2xl font-bold text-white text-center break-words mb-4 drop-shadow-lg" style={{ textShadow: '0 2px 8px #0006' }}>{latestBook.title}</div>
              <div className="text-yellow-100 text-sm mb-1">{t('作者')}：{shortenAddress(latestBook.author)}</div>
              <div className="text-yellow-100 text-sm mb-1">{t('段落数')}：{latestBook.paragraphs?.length || 0}</div>
              <div className="text-yellow-100 text-sm">{t('总投票')}：{latestBook.total_votes ?? 0}</div>
            </div>
            {/* 内容区 */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-r-2xl flex flex-col justify-center items-center p-8">
              <div className="text-lg font-semibold text-primary-700 dark:text-primary-200 mb-4">{t('click_to_read')}</div>
              <div className="text-gray-400 text-sm">{t('已归档的书')}</div>
            </div>
          </div>
        ) : null}
        {!latestBook && (
          <div className="text-gray-400 text-center text-xl mt-24">{t('暂无归档书')}</div>
        )}
        {showBook && latestBook && (
          <div className="w-full max-w-2xl mt-8 relative">
            <div className="flex justify-between mb-4">
              <button onClick={() => setShowBook(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">← {t('返回') || '返回'}</button>
              <div className="text-lg font-bold text-primary-700 dark:text-primary-200">{latestBook.title}</div>
              <div></div>
            </div>
            <div className="relative min-h-[220px]">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={pageIndex}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageTransition}
                  className="absolute w-full"
                  style={{ minHeight: 200 }}
                >
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col gap-6">
                    {getParagraphsForPage(pageIndex).map((para, idx) => (
                      <div key={idx}>
                        <div className="font-bold mb-2 text-primary-700 dark:text-primary-200">{t('第{number}段', { number: pageIndex * paragraphsPerPage + idx + 1 })}</div>
                        <div className="whitespace-pre-line text-gray-800 dark:text-gray-100">{para}</div>
                      </div>
                    ))}
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
            <div className="flex justify-between mt-6">
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
              <span className="text-gray-500 text-sm">{t('book_page', { current: pageIndex + 1, total: totalPages })}</span>
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
            {/* 书本阴影 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] h-6 bg-black/20 dark:bg-black/40 filter blur-md rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestStory; 