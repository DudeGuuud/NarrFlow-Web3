import { VOTE_THRESHOLD, VOTING_COUNTDOWN_SECONDS, logger, supabase } from '../index.js';
import { VotingSession, VotingSessionType, Proposal, Book } from '../models/types.js';
import {
  getActiveVotingSession,
  createVotingSession,
  getExpiredVotingSessions,
  updateVotingSessionStatus,
  getProposalsByType,
  clearProposalsAndVotes
} from './databaseService.js';
import {
  getCurrentBook,
  executeStartNewBook,
  executeAddParagraph,
  executeAddParagraphAndArchive
} from './blockchainService.js';

// 获取或创建活跃的投票会话
export async function getOrCreateActiveVotingSession(): Promise<VotingSession> {
  // 检查是否有活跃的投票会话
  const activeSession = await getActiveVotingSession();

  if (activeSession) {
    return activeSession;
  }

  // 如果没有活跃的会话，创建一个新的
  // 首先检查当前书籍状态，决定创建什么类型的会话
  const currentBook = await getCurrentBook() as Book;

  let sessionType: VotingSessionType = 'title';

  if (currentBook && currentBook.status === 0) {
    // 如果有进行中的书籍，创建段落投票会话
    sessionType = 'paragraph';
  }

  // 设置过期时间
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + VOTING_COUNTDOWN_SECONDS);

  // 创建新的投票会话
  return await createVotingSession(sessionType, expiresAt);
}

// 跟踪上次检查时间，避免频繁检查
let lastCheckTime = 0;
const MIN_CHECK_INTERVAL = 60000; // 最小检查间隔为1分钟

// 检查过期的投票会话并处理
export async function checkVotingSessions(): Promise<void> {
  const now = Date.now();

  // 如果距离上次检查时间不足最小间隔，则跳过
  if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
    logger('debug', `Skipping check, last check was ${Math.floor((now - lastCheckTime) / 1000)} seconds ago`);
    return;
  }

  // 更新上次检查时间
  lastCheckTime = now;

  logger('debug', 'Checking for expired voting sessions...');

  try {
    // 获取过期的投票会话，限制数量为10个
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .limit(10);

    if (error) {
      logger('error', 'Error fetching expired voting sessions:', error);
      return;
    }

    const expiredSessions = data as VotingSession[];

    if (expiredSessions.length === 0) {
      logger('debug', 'No expired voting sessions found');

      // 检查是否有活跃的会话，如果没有则创建一个
      const activeSession = await getActiveVotingSession();
      if (!activeSession) {
        logger('info', 'No active voting session found, creating one');
        await startNewVotingSession('title', false);
      }

      return;
    }

    logger('info', `Found ${expiredSessions.length} expired voting sessions to process`);

    // 限制一次处理的会话数量，避免过多的API调用
    const MAX_SESSIONS_TO_PROCESS = 1;
    const sessionsToProcess = expiredSessions.slice(0, MAX_SESSIONS_TO_PROCESS);

    logger('info', `Processing ${sessionsToProcess.length} of ${expiredSessions.length} expired sessions`);

    // 处理选定的过期会话
    for (const session of sessionsToProcess) {
      await processVotingSession(session);

      // 处理完一个会话后稍微暂停一下，避免API调用过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    logger('error', 'Error checking voting sessions:', error);
  }
}

// 跟踪最近处理的会话，防止重复处理
const recentlyProcessedSessions = new Set<string>();
const MAX_RECENT_SESSIONS = 50; // 保留最近50个会话ID

// 处理投票会话
async function processVotingSession(session: VotingSession): Promise<void> {
  // 检查是否已经处理过这个会话
  if (recentlyProcessedSessions.has(session.id)) {
    logger('debug', `Session ${session.id} was recently processed, skipping`);
    return;
  }

  // 添加到最近处理的会话集合
  recentlyProcessedSessions.add(session.id);
  // 如果集合太大，删除最早的条目
  if (recentlyProcessedSessions.size > MAX_RECENT_SESSIONS) {
    const firstItem = recentlyProcessedSessions.values().next().value;
    if (firstItem) {
      recentlyProcessedSessions.delete(firstItem);
    }
  }

  logger('info', `Processing voting session ${session.id} of type ${session.type}`);

  try {
    // 获取该会话类型的所有提案
    const proposals = await getProposalsByType(session.type);

    if (proposals.length === 0) {
      logger('info', 'No proposals found for this session');
      await updateVotingSessionStatus(session.id, 'completed', 'No proposals found');

      // 创建新的投票会话，但不立即处理
      await startNewVotingSession(session.type, false);
      return;
    }

    // 获取得票最高的提案
    const winningProposal = proposals[0];

    if (winningProposal.votes < VOTE_THRESHOLD) {
      logger('info', `Winning proposal has only ${winningProposal.votes} votes, below threshold of ${VOTE_THRESHOLD}`);
      await updateVotingSessionStatus(session.id, 'failed', 'Not enough votes');

      // 创建新的投票会话，但不立即处理
      await startNewVotingSession(session.type, false);
      return;
    }

    logger('debug', `Winning proposal: ${winningProposal.id} by ${winningProposal.author} with ${winningProposal.votes} votes`);

    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook() as Book;
    logger('debug', 'Current book state:', currentBook ? {
      title: currentBook.title,
      status: currentBook.status,
      paragraphs: currentBook.paragraphs.length,
      bookIndex: currentBook.bookIndex
    } : 'No active book');

    // 根据会话类型执行相应的交易
    let txResult;
    if (session.type === 'title') {
      logger('info', 'Executing start_new_book transaction');
      txResult = await executeStartNewBook(winningProposal.content, winningProposal.author);
    } else if (session.type === 'paragraph') {
      // 检查是否需要归档书籍
      if (currentBook && currentBook.paragraphs && currentBook.paragraphs.length >= 9) {
        logger('info', 'Book has 9 or more paragraphs, adding final paragraph and archiving');
        // 这将是第 10 段，所以添加后应该归档
        txResult = await executeAddParagraphAndArchive(winningProposal.content, winningProposal.author);
        txResult.archived = true; // 确保标记为已归档
      } else {
        logger('info', `Adding paragraph to book (current paragraphs: ${currentBook?.paragraphs?.length || 0})`);
        txResult = await executeAddParagraph(winningProposal.content, winningProposal.author);
      }
    }

    if (txResult && txResult.digest) {
      logger('info', `Transaction executed successfully: ${txResult.digest}`);
      await updateVotingSessionStatus(session.id, 'completed', `Transaction: ${txResult.digest}`);

      // 清理所有提案和投票
      logger('debug', 'Clearing all proposals and votes');
      await clearProposalsAndVotes();

      // 开始新的投票会话
      let nextSessionType: VotingSessionType;

      if (session.type === 'title') {
        // 如果当前是标题投票，下一个应该是段落投票
        logger('debug', 'Current session was for title, next will be for paragraph');
        nextSessionType = 'paragraph';
      } else {
        // 如果当前是段落投票
        if (txResult.archived) {
          // 如果书已归档，下一个应该是标题投票
          logger('debug', 'Book was archived, next session will be for title');
          nextSessionType = 'title';
        } else {
          // 否则继续段落投票
          logger('debug', 'Book was not archived, continuing with paragraph voting');
          nextSessionType = 'paragraph';
        }
      }

      // 创建新的投票会话，但不立即处理
      await startNewVotingSession(nextSessionType, false);
    } else {
      logger('error', 'Transaction failed');
      await updateVotingSessionStatus(session.id, 'failed', 'Transaction failed');

      // 创建新的投票会话，但不立即处理
      await startNewVotingSession(session.type, false);
    }
  } catch (error) {
    logger('error', 'Error processing voting session:', error);
    await updateVotingSessionStatus(session.id, 'failed', error instanceof Error ? error.message : 'Unknown error');

    // 创建新的投票会话，但不立即处理
    await startNewVotingSession(session.type, false);
  }
}

// 开始新的投票会话
async function startNewVotingSession(sessionType: VotingSessionType, processImmediately: boolean = false): Promise<VotingSession> {
  logger('info', `Starting new voting session of type: ${sessionType}`);

  try {
    // 强制从区块链获取最新状态
    const currentBook = await getCurrentBook() as Book;
    logger('debug', 'Current book state for new session:',
      currentBook ? {
        title: currentBook.title,
        status: currentBook.status,
        paragraphs: currentBook.paragraphs.length,
        bookIndex: currentBook.bookIndex
      } : 'No active book');

    // 根据区块链状态和请求的会话类型决定实际的会话类型
    let actualType: VotingSessionType = sessionType;

    // 如果没有书籍，强制使用标题投票
    if (!currentBook) {
      logger('debug', 'No book found, forcing title voting session');
      actualType = 'title';
    }
    // 如果书籍已归档，强制使用标题投票
    else if (currentBook.status === 1) {
      logger('debug', 'Book is archived (status=1), forcing title voting session');
      actualType = 'title';
    }
    // 如果有活跃的书籍且请求的是标题投票，检查是否应该强制为段落投票
    else if (sessionType === 'title' && currentBook.status === 0 && currentBook.paragraphs.length < 10) {
      logger('debug', `Active book exists with ${currentBook.paragraphs.length} paragraphs (less than 10), forcing paragraph voting session`);
      actualType = 'paragraph';
    }
    // 如果书籍已经有10个或更多段落，强制使用标题投票（应该已经归档，但以防万一）
    else if (currentBook.paragraphs.length >= 10) {
      logger('debug', `Book has ${currentBook.paragraphs.length} paragraphs (>= 10), should be archived, forcing title voting session`);
      actualType = 'title';

      // 尝试归档书籍，但不要在这里重试太多次
      try {
        logger('info', 'Attempting to archive book that has 10 or more paragraphs...');
        // 使用系统作者地址
        const systemAuthor = '0x0000000000000000000000000000000000000000000000000000000000000123';
        await executeAddParagraphAndArchive('System auto-archive', systemAuthor);
      } catch (error) {
        logger('error', 'Failed to auto-archive book:', error);
        // 继续创建标题投票会话
      }
    }

    logger('debug', `Final session type: ${actualType}`);

    // 设置过期时间
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + VOTING_COUNTDOWN_SECONDS);

    // 创建新的投票会话
    const newSession = await createVotingSession(actualType, expiresAt);

    logger('info', `Started new ${actualType} voting session, expires at ${expiresAt.toISOString()}`);

    // 如果需要立即处理，则处理这个新会话
    if (processImmediately) {
      await processVotingSession(newSession);
    }

    return newSession;
  } catch (error) {
    logger('error', 'Error starting new voting session:', error);
    // 如果出错，等待一段时间再重试，避免无限循环
    await new Promise(resolve => setTimeout(resolve, 5000));
    throw error;
  }
}
