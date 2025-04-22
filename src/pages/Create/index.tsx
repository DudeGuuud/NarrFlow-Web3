import React, { useEffect, useState } from 'react';
import { useSuiStory } from '../../hooks/useSuiStoryWithWalrus';
import { FaThumbsUp } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';

const MAX_BYTES = 2000;

const CreatePage: React.FC = () => {
  const {
    getCurrentBook,
    addParagraph,
    voteParagraph,
    archiveBook,
    startNewBook,
  } = useSuiStory();
  const { lang, t } = useLang();

  const [book, setBook] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputBytes, setInputBytes] = useState(0);

  // 刷新当前书本信息
  const refresh = async () => {
    const b = await getCurrentBook();
    setBook(b);
  };

  useEffect(() => {
    refresh();
    // 可加定时刷新或事件监听
  }, []);

  // 实时统计字节数
  useEffect(() => {
    setInputBytes(new TextEncoder().encode(content).length);
  }, [content]);

  const isEditingTitle = book && Array.isArray(book.paragraphs) && book.paragraphs.length === 0;
  const maxBytes = isEditingTitle ? 100 : 2000;

  // 提交新段落
  const handleSubmit = async () => {
    if (inputBytes > maxBytes) {
      alert(isEditingTitle ? t('create_title_too_long') : t('create_paragraph_too_long'));
      return;
    }
    setLoading(true);
    try {
      await addParagraph(content);
      setContent('');
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  // 投票
  const handleVote = async (idx: number) => {
    setLoading(true);
    try {
      await voteParagraph(idx);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  // 归档
  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveBook();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  if (!book || !Array.isArray(book.paragraphs)) return <div>加载中...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h2>
          {t('create_book_title')}：{t('create_book_index', { index: book.index })}
        </h2>
        <div>
          {t('create_status')}：{book.status === 0 ? t('create_status_ongoing') : t('create_status_archived')}
        </div>
        <div>
          {t('create_archive_threshold')}：{book.archive_votes_threshold}
        </div>
        <div>
          {t('create_total_votes')}：{book.total_votes}
        </div>
        <h3>{t('create_paragraph_list')}</h3>
        <ol>
          {book.paragraphs.map((p: any, i: number) => (
            <li key={i} style={{ border: '1px solid #eee', margin: 8, padding: 8 }}>
              <div>{t('create_paragraph_number', { number: i + 1 })}</div>
              <div>{t('create_content')}：{p.content}</div>
              <div>{t('create_author')}：{p.author}</div>
              <div>{t('create_votes')}：{p.votes}</div>
              {/* 这里假设没有时间戳，后续合约可加 */}
              <button
                disabled={book.status !== 0}
                onClick={() => handleVote(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1890ff' }}
                title="投票/点赞"
              >
                <FaThumbsUp size={20} />
              </button>
            </li>
          ))}
        </ol>
        {/* 只允许在进行中且当前段落未提交时添加新段落 */}
        {book.status === 0 && (
          <div style={{ marginTop: 24 }}>
            <h4>
              {isEditingTitle ? t('create_edit_title') : t('create_edit_paragraph')}
            </h4>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              style={{ width: '100%' }}
              placeholder={isEditingTitle ? t('create_title_placeholder') : t('create_paragraph_placeholder')}
            />
            <div style={{ color: inputBytes > maxBytes ? 'red' : undefined }}>
              {isEditingTitle
                ? t('create_title_byte_count', { current: inputBytes })
                : t('create_paragraph_byte_count', { current: inputBytes })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={inputBytes === 0 || inputBytes > maxBytes}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('create_submit')}
            </button>
          </div>
        )}
        {/* 归档按钮 */}
        {book.status === 0 && book.total_votes >= book.archive_votes_threshold && (
          <div style={{ marginTop: 24 }}>
            <button onClick={handleArchive} disabled={loading}>
              {t('create_archiving')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePage;