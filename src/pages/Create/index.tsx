import React, { useEffect, useState } from 'react';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { FadeIn } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';

const VoteStory: React.FC = () => {
  const { getAllBooks, getAllParagraphs, voteParagraph } = useSuiStory();
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      const allBooks = await getAllBooks();
      const ongoing = allBooks.find((b: any) => b.status === 0);
      setCurrentBook(ongoing || null);
      if (ongoing) {
        const paras = await getAllParagraphs(ongoing);
        setParagraphs(paras);
      }
    }
    fetch();
  }, []);

  const handleVote = async (idx: number) => {
    setLoading(true);
    try {
      await voteParagraph(idx);
      // 刷新
      if (currentBook) {
        const paras = await getAllParagraphs(currentBook);
        setParagraphs(paras);
      }
    } catch (e) {
      alert('投票失败: ' + (e as any).message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-6">
            创作页面
          </h1>
        </FadeIn>
        <h2>当前协作书投票</h2>
        {paragraphs.map((p: any, idx: number) => (
          <div key={idx} className="proposal-card">
            <p>{p.content || p.walrus_id}</p>
            <span>得票数: {p.votes}</span>
            <button onClick={() => handleVote(idx)} disabled={loading}>投票</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteStory;