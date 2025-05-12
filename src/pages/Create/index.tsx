import React, { useEffect, useState } from 'react';
import { useSuiStory } from '../../hooks/useSuiStory';
import Navbar from '../../components/layout/Navbar';
import { useLang } from '../../contexts/lang/LangContext';
import { shortenAddress } from '../../utils/langUtils';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { supabase } from '../../lib/supabaseClient';
import CountdownTimer from '../../components/CountdownTimer';

const CreatePage: React.FC = () => {
  const {
    getCurrentBook,
  } = useSuiStory();
  const { t } = useLang();
  const account = useCurrentAccount();

  const [book, setBook] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputBytes, setInputBytes] = useState(0);
  const [showStartNewBook, setShowStartNewBook] = useState(false);

  // 提案和投票状态，全部从 Supabase 获取
  const [proposals, setProposals] = useState<any[]>([]);
  const [votedProposalId, setVotedProposalId] = useState<string | null>(null); // 当前钱包已投的提案id

  // 当前投票类型：没有书时为'title'，有进行中的书时为'paragraph'
  const [voteType, setVoteType] = useState<'title' | 'paragraph'>('paragraph');

  // 投票会话状态
  const [votingSession, setVotingSession] = useState<{
    id: string;
    type: 'title' | 'paragraph';
    status: 'active' | 'completed' | 'failed';
    expires_at: string;
  } | null>(null);

  // 刷新当前书本信息
  const refresh = async () => {
    const b = await getCurrentBook();
    console.log('链上book:', b);
    console.log('book.paragraphs:', b?.paragraphs, Array.isArray(b?.paragraphs) ? b.paragraphs.length : 'not array');
    setBook(b);
    if (!b || b.status === 1) {
      setVoteType('title');
    } else {
      setVoteType('paragraph');
    }
    // 归档后自动检测
    if (b && b.status === 1) {
      setShowStartNewBook(true);
    } else {
      setShowStartNewBook(false);
    }
  };

  useEffect(() => {
    // 页面加载时只刷新，不自动新建书
    refresh();
    // 可加定时刷新或事件监听
  }, []);

  // 实时统计字节数
  useEffect(() => {
    setInputBytes(new TextEncoder().encode(content).length);
  }, [content]);

  // 段落序号判断逻辑修正：
  // index为0时，显示为第1本
  const bookIndex = typeof book?.index === 'number' ? (book.index === 0 ? 1 : book.index) : 1;
  const currentParagraphIndex = Array.isArray(book?.paragraphs) ? book.paragraphs.length : 0;
  console.log('currentParagraphIndex:', currentParagraphIndex);
  // 只有没有书或已归档时才为 true，有进行中的书都为 false
  const isEditingTitle = !book || book.status === 1;
  console.log('isEditingTitle:', isEditingTitle);
  const maxBytes = isEditingTitle ? 100 : 2000;

  // 获取活跃的投票会话
  const fetchActiveVotingSession = async () => {
    try {
      // 从后端 API 获取
      const response = await fetch('http://localhost:3001/api/voting-sessions/current');
      const data = await response.json();

      if (data && !data.error) {
        setVotingSession(data);
        setVoteType(data.type);
      } else {
        console.error('获取投票会话失败:', data.error);

        // 如果后端 API 失败，创建一个模拟的投票会话
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 300); // 5分钟

        const mockSession = {
          id: 'mock-session',
          type: voteType as 'title' | 'paragraph',
          status: 'active' as 'active',
          expires_at: expiresAt.toISOString()
        };

        setVotingSession(mockSession);
      }
    } catch (error) {
      console.error('获取投票会话失败:', error);

      // 如果后端 API 失败，创建一个模拟的投票会话
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 300); // 5分钟

      const mockSession = {
        id: 'mock-session',
        type: voteType as 'title' | 'paragraph',
        status: 'active' as 'active',
        expires_at: expiresAt.toISOString()
      };

      setVotingSession(mockSession);
    }
  };

  // 获取所有提案（按type过滤）
  const fetchProposals = async () => {
    try {
      // 从后端 API 获取
      const type = votingSession ? votingSession.type : undefined;
      const url = type
        ? `http://localhost:3001/api/proposals?type=${type}`
        : 'http://localhost:3001/api/proposals';

      const response = await fetch(url);
      const data = await response.json();

      if (data && !data.error) {
        console.log('fetchProposals from API:', data);
        setProposals(data);
      } else {
        console.error('获取提案失败:', data.error);

        // 如果后端 API 失败，从 Supabase 获取
        try {
          const query = votingSession
            ? supabase.from('proposals').select('*').eq('type', votingSession.type)
            : supabase.from('proposals').select('*');

          const { data: supabaseData, error } = await query.order('created_at', { ascending: true });

          if (!error && supabaseData) {
            console.log('fetchProposals from Supabase:', supabaseData);
            setProposals(supabaseData);
          } else {
            setProposals([]);
          }
        } catch (supabaseError) {
          console.error('从 Supabase 获取提案失败:', supabaseError);
          setProposals([]);
        }
      }
    } catch (error) {
      console.error('获取提案失败:', error);

      // 如果后端 API 失败，从 Supabase 获取
      try {
        const query = votingSession
          ? supabase.from('proposals').select('*').eq('type', votingSession.type)
          : supabase.from('proposals').select('*');

        const { data: supabaseData, error } = await query.order('created_at', { ascending: true });

        if (!error && supabaseData) {
          console.log('fetchProposals from Supabase:', supabaseData);
          setProposals(supabaseData);
        } else {
          setProposals([]);
        }
      } catch (supabaseError) {
        console.error('从 Supabase 获取提案失败:', supabaseError);
        setProposals([]);
      }
    }
  };

  // 获取当前钱包已投的提案id
  const fetchVotedProposal = async (address: string) => {
    const { data, error } = await supabase
      .from('votes')
      .select('proposal_id')
      .eq('voter', address.toLowerCase());
    if (!error && data && data.length > 0) {
      setVotedProposalId(data[0].proposal_id);
    } else {
      setVotedProposalId(null);
    }
  };

  // 页面加载和钱包变更时拉取数据
  useEffect(() => {
    fetchActiveVotingSession();
  }, []);

  // 当投票会话变化时，重新获取提案
  useEffect(() => {
    fetchProposals();
    if (account?.address) {
      fetchVotedProposal(account.address);
    }
  }, [account?.address, votingSession]);

  // 判断当前用户是否已对该提案投票
  const hasVoted = (proposalId: string) => {
    return votedProposalId === proposalId;
  };

  // 判断当前用户是否已对其他提案投票
  const hasVotedOther = (proposalId: string) => {
    return !!votedProposalId && votedProposalId !== proposalId;
  };

  // 不再需要轮询链上段落，由后端自动处理

  // 定期刷新投票会话状态和提案
  useEffect(() => {
    // 每10秒刷新一次投票会话状态和提案
    const sessionInterval = setInterval(() => {
      fetchActiveVotingSession();
    }, 10000);

    // 每5秒刷新一次提案（更频繁地更新投票数据）
    const proposalsInterval = setInterval(() => {
      fetchProposals();
      if (account?.address) {
        fetchVotedProposal(account.address);
      }
    }, 5000);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(proposalsInterval);
    };
  }, [account?.address]);

  // 提交新提案
  const handleAddProposal = async () => {
    const address = account?.address?.toLowerCase() || '';
    if (!content.trim() || !address) return;

    // 如果没有活跃的投票会话，不允许提交提案
    if (!votingSession) {
      alert(t('no_active_voting_session'));
      return;
    }

    try {
      // 通过后端 API 提交
      const response = await fetch('http://localhost:3001/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          author: address,
          type: votingSession.type,
        }),
      });

      const data = await response.json();

      if (data && !data.error) {
        setContent('');
        fetchProposals();
      } else {
        console.error('Error adding proposal:', data.error);
        alert(t('error_adding_proposal'));
      }
    } catch (error) {
      console.error('Error adding proposal:', error);
      alert(t('error_adding_proposal'));
    }
  };

  // 渲染时log，辅助排查段落数同步问题
  console.log('渲染时的 book:', book);
  console.log('渲染时的 book.paragraphs:', book?.paragraphs);
  const editingText = !book || book.status === 1
    ? t('editing_title')
    : t('editing_paragraph', { number: (Array.isArray(book?.paragraphs) ? book.paragraphs.length : 0) + 1 });

  // 投票 - 简化版，只负责记录投票，不再自动执行链上操作
  const handleVote = async (proposalId: string) => {
    const address = account?.address?.toLowerCase() || '';
    if (!address) return;

    // 检查投票会话是否有效
    if (!votingSession || votingSession.status !== 'active') {
      alert(t('no_active_voting_session'));
      return;
    }

    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // 检查是否已投票
    if (votedProposalId && votedProposalId !== proposalId) {
      alert(t('already_voted_other'));
      return;
    }

    if (hasVoted(proposalId)) {
      alert(t('already_voted_this'));
      return;
    }

    try {
      setLoading(true);

      // 通过后端 API 投票
      const response = await fetch('http://localhost:3001/api/proposals/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          voter: address,
        }),
      });

      const data = await response.json();

      if (data && !data.error) {
        // 更新本地状态
        fetchProposals();
        setVotedProposalId(proposalId);
      } else {
        console.error('Error voting:', data.error);
        alert(t('error_voting'));
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(t('error_voting'));
    } finally {
      setLoading(false);
    }
  };

  // 这些功能现在由后端自动处理，前端不再需要管理员手动操作函数

  // 页面渲染逻辑重构
  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (voteType === 'title') {
    // 渲染书名提案与投票UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-2">
            {t('create_book_title')}
          </h2>

          {/* 投票信息和倒计时进度条 - 更醒目的位置 */}
          {votingSession && (
            <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-primary-200 dark:border-primary-700 overflow-hidden">
              <div className="p-4 bg-primary-50 dark:bg-primary-900 border-b border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-bold text-primary-800 dark:text-primary-200 mb-2">{t('voting_info_title')}</h3>
                <p className="text-primary-700 dark:text-primary-300 mb-2">{t('voting_info_description')}</p>
                <ul className="list-disc list-inside space-y-1 text-primary-600 dark:text-primary-400">
                  <li>{t('voting_info_point1')}</li>
                  <li>{t('voting_info_point2')}</li>
                  <li>{t('voting_info_point3')}</li>
                  <li>{t('voting_threshold_info', { threshold: 10 })}</li>
                </ul>
              </div>
              <div className="p-4">
                <CountdownTimer
                  expiresAt={votingSession.expires_at}
                  onExpire={fetchActiveVotingSession}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100 mb-4">{t('proposal_pool')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {proposals.length === 0 ? (
              <div className="text-gray-400 text-center col-span-2">{t('no_proposal')}</div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col gap-2 border border-primary-100 hover:shadow-lg transition">
                  <div className="font-semibold text-lg text-primary-700 dark:text-primary-200 mb-2">{p.content}</div>
                  <div className="text-sm text-gray-500">{t('author')}：{shortenAddress(p.author)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 dark:text-primary-300 font-bold">{t('vote_count')}：{p.votes}</span>
                    <button
                      className="px-3 py-1 rounded bg-primary-500 text-white disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 shadow hover:bg-primary-600 transition"
                      onClick={() => handleVote(p.id)}
                      disabled={!account?.address || hasVoted(p.id) || hasVotedOther(p.id)}
                    >
                      {p.author === (account?.address?.toLowerCase() || '') ? t('cannot_vote_self') : hasVoted(p.id) ? t('voted') : hasVotedOther(p.id) ? t('voted_other') : t('vote')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="mb-2 text-primary-700 dark:text-primary-200 font-semibold">
              {t('editing_title')}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${inputBytes > 100 ? 'border-red-500 focus:ring-red-500' : 'border-primary-200'}`}
              placeholder={t('title_placeholder')}
            />
            <button
              onClick={handleAddProposal}
              disabled={!content.trim() || !account?.address || inputBytes > 100}
              className="h-12 px-8 rounded-lg bg-primary-500 text-white font-bold shadow hover:bg-primary-600 transition disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 mt-2 md:mt-0"
            >
              {t('submit_proposal')}
            </button>
          </div>
          <div className={`mt-2 text-sm ${inputBytes > 100 ? 'text-red-500' : 'text-gray-500'}`}>{t('byte_count', { current: inputBytes, max: 100 })}</div>

          {/* 投票说明 */}
          <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700">
            <h4 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">{t('voting_info_title')}</h4>
            <p className="text-primary-600 dark:text-primary-400 mb-2">
              {t('voting_info_description')}
            </p>
            <ul className="list-disc list-inside text-primary-600 dark:text-primary-400 space-y-1">
              <li>{t('voting_info_point1')}</li>
              <li>{t('voting_info_point2')}</li>
              <li>{t('voting_info_point3')}</li>
              <li>{t('voting_threshold_info', { threshold: 10 })}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 正文投票模式
  if (voteType === 'paragraph' && book && Array.isArray(book.paragraphs)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-2">
            {book.title ? `${book.title}（${t('book_index', { index: bookIndex })}）` : t('create_book_title')}
          </h2>
          <div className="mb-4 text-primary-700 dark:text-primary-200">
            {t('paragraph_count')}：{Array.isArray(book?.paragraphs) ? book.paragraphs.length : 0}/10
          </div>

          {/* 投票信息和倒计时进度条 - 更醒目的位置 */}
          {votingSession && (
            <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-primary-200 dark:border-primary-700 overflow-hidden">
              <div className="p-4 bg-primary-50 dark:bg-primary-900 border-b border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-bold text-primary-800 dark:text-primary-200 mb-2">{t('voting_info_title')}</h3>
                <p className="text-primary-700 dark:text-primary-300 mb-2">{t('voting_info_description')}</p>
                <ul className="list-disc list-inside space-y-1 text-primary-600 dark:text-primary-400">
                  <li>{t('voting_info_point1')}</li>
                  <li>{t('voting_info_point2')}</li>
                  <li>{t('voting_info_point3')}</li>
                  <li>{t('voting_threshold_info', { threshold: 10 })}</li>
                </ul>
              </div>
              <div className="p-4">
                <CountdownTimer
                  expiresAt={votingSession.expires_at}
                  onExpire={fetchActiveVotingSession}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <h3 className="text-xl font-semibold text-primary-800 dark:text-primary-100 mb-4">{t('proposal_pool')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {proposals.length === 0 ? (
              <div className="text-gray-400 text-center col-span-2">{t('no_proposal')}</div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col gap-2 border border-primary-100 hover:shadow-lg transition">
                  <div className="font-semibold text-lg text-primary-700 dark:text-primary-200 mb-2">{p.content}</div>
                  <div className="text-sm text-gray-500">{t('author')}：{shortenAddress(p.author)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 dark:text-primary-300 font-bold">{t('vote_count')}：{p.votes}</span>
                    <button
                      className="px-3 py-1 rounded bg-primary-500 text-white disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 shadow hover:bg-primary-600 transition"
                      onClick={() => handleVote(p.id)}
                      disabled={!account?.address || hasVoted(p.id) || hasVotedOther(p.id)}
                    >
                      {p.author === (account?.address?.toLowerCase() || '') ? t('cannot_vote_self') : hasVoted(p.id) ? t('voted') : hasVotedOther(p.id) ? t('voted_other') : t('vote')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="mb-2 text-primary-700 dark:text-primary-200 font-semibold">
              {editingText}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className={`w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${inputBytes > maxBytes ? 'border-red-500 focus:ring-red-500' : 'border-primary-200'}`}
              placeholder={t('proposal_placeholder')}
            />
            <button
              onClick={handleAddProposal}
              disabled={!content.trim() || !account?.address || inputBytes > maxBytes}
              className="h-12 px-8 rounded-lg bg-primary-500 text-white font-bold shadow hover:bg-primary-600 transition disabled:bg-gray-300 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 mt-2 md:mt-0"
            >
              {t('submit_proposal')}
            </button>
          </div>
          <div className={`mt-2 text-sm ${inputBytes > maxBytes ? 'text-red-500' : 'text-gray-500'}`}>{t('byte_count', { current: inputBytes, max: maxBytes })}</div>
          {/* 归档后提示 */}
          {showStartNewBook && (
            <div style={{ marginTop: 24 }} className="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700">
              <p className="text-primary-700 dark:text-primary-300">
                {t('book_archived_message')}
              </p>
            </div>
          )}
      </div>
    </div>
  );
  }

  // 兜底
  return <div>{t('loading')}</div>;
};

export default CreatePage;