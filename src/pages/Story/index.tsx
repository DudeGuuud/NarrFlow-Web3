import React, { useEffect, useState } from 'react';
import { FadeIn } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';

// ArchivedBooks 组件：展示所有已归档的书（链上集成预留接口）
const ArchivedBooks: React.FC = () => {
  // TODO: 替换为链上查询逻辑
  // 示例数据
  const [books] = React.useState([
    { title: '第一本书', author: 'Alice', paragraph_count: 10, total_votes: 15, index: 1 },
    { title: '第二本书', author: 'Bob', paragraph_count: 9, total_votes: 12, index: 2 },
  ]);
  if (!books.length) return <div>暂无归档书</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">已归档的书</h2>
      {books.map((book, idx) => (
        <div key={idx} className="p-4 border rounded mb-2">
          <h3 className="font-bold">{book.title}（第{book.index}本书）</h3>
          <p>作者: {book.author}</p>
          <p>段落数: {book.paragraph_count}</p>
          <p>总投票: {book.total_votes}</p>
        </div>
      ))}
    </div>
  );
};

const BrowseStories: React.FC = () => {
  const { getAllBooks, getAllParagraphs } = useSuiStory();
  const [archivedBooks, setArchivedBooks] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const allBooks = await getAllBooks();
      setArchivedBooks(allBooks.filter((b: any) => b.status === 1));
    }
    fetch();
  }, []);

  return (
    <div>
      <h2>已归档故事</h2>
      {archivedBooks.map((book, idx) => (
        <div key={idx} className="archived-book-card">
          <h3>{book.title}</h3>
          <p>作者: {book.author}</p>
          <p>段落数: {book.paragraphs?.length || 0}</p>
        </div>
      ))}
    </div>
  );
};

const Story: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-6">
            故事页面
          </h1>
        </FadeIn>
        {/* 插入归档书展示区 */}
        <ArchivedBooks />
        <BrowseStories />
      </div>
    </div>
  );
};

export default Story;