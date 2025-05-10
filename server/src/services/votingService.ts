import { VOTE_THRESHOLD, VOTING_COUNTDOWN_SECONDS } from '../index.js';
import { VotingSession, VotingSessionType, Proposal } from '../models/types.js';
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
  const currentBook = await getCurrentBook();

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

// 检查过期的投票会话并处理
export async function checkVotingSessions(): Promise<void> {
  console.log('Checking for expired voting sessions...');

  // 获取过期的投票会话
  const expiredSessions = await getExpiredVotingSessions();

  if (expiredSessions.length === 0) {
    console.log('No expired voting sessions found');
    return;
  }

  console.log(`Found ${expiredSessions.length} expired voting sessions`);

  // 处理每个过期的会话
  for (const session of expiredSessions) {
    await processVotingSession(session);
  }
}

// 处理投票会话
async function processVotingSession(session: VotingSession): Promise<void> {
  console.log(`Processing voting session ${session.id} of type ${session.type}`);

  try {
    // 获取该会话类型的所有提案
    const proposals = await getProposalsByType(session.type);

    if (proposals.length === 0) {
      console.log('No proposals found for this session');
      await updateVotingSessionStatus(session.id, 'completed', 'No proposals found');

      // 创建新的投票会话
      await startNewVotingSession(session.type);
      return;
    }

    // 获取得票最高的提案
    const winningProposal = proposals[0];

    if (winningProposal.votes < VOTE_THRESHOLD) {
      console.log(`Winning proposal has only ${winningProposal.votes} votes, below threshold of ${VOTE_THRESHOLD}`);
      await updateVotingSessionStatus(session.id, 'failed', 'Not enough votes');

      // 创建新的投票会话
      await startNewVotingSession(session.type);
      return;
    }

    console.log(`Winning proposal: ${winningProposal.id} by ${winningProposal.author} with ${winningProposal.votes} votes`);

    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook();
    console.log('Current book state:', currentBook);

    // 根据会话类型执行相应的交易
    let txResult;
    if (session.type === 'title') {
      console.log('Executing start_new_book transaction');
      txResult = await executeStartNewBook(winningProposal.content, winningProposal.author);
    } else if (session.type === 'paragraph') {
      // 检查是否需要归档书籍
      if (currentBook && currentBook.paragraphs && currentBook.paragraphs.length >= 9) {
        console.log('Book has 9 or more paragraphs, adding final paragraph and archiving');
        // 这将是第 10 段，所以添加后应该归档
        txResult = await executeAddParagraphAndArchive(winningProposal.content, winningProposal.author);
        txResult.archived = true; // 确保标记为已归档
      } else {
        console.log(`Adding paragraph to book (current paragraphs: ${currentBook?.paragraphs?.length || 0})`);
        txResult = await executeAddParagraph(winningProposal.content, winningProposal.author);
      }
    }

    if (txResult && txResult.digest) {
      console.log(`Transaction executed successfully: ${txResult.digest}`);
      await updateVotingSessionStatus(session.id, 'completed', `Transaction: ${txResult.digest}`);

      // 清理所有提案和投票
      console.log('Clearing all proposals and votes');
      await clearProposalsAndVotes();

      // 开始新的投票会话
      let nextSessionType: VotingSessionType;

      if (session.type === 'title') {
        // 如果当前是标题投票，下一个应该是段落投票
        console.log('Current session was for title, next will be for paragraph');
        nextSessionType = 'paragraph';
      } else {
        // 如果当前是段落投票
        if (txResult.archived) {
          // 如果书已归档，下一个应该是标题投票
          console.log('Book was archived, next session will be for title');
          nextSessionType = 'title';
        } else {
          // 否则继续段落投票
          console.log('Book was not archived, continuing with paragraph voting');
          nextSessionType = 'paragraph';
        }
      }

      await startNewVotingSession(nextSessionType);
    } else {
      console.error('Transaction failed');
      await updateVotingSessionStatus(session.id, 'failed', 'Transaction failed');

      // 创建新的投票会话
      await startNewVotingSession(session.type);
    }
  } catch (error) {
    console.error('Error processing voting session:', error);
    await updateVotingSessionStatus(session.id, 'failed', error instanceof Error ? error.message : 'Unknown error');

    // 创建新的投票会话
    await startNewVotingSession(session.type);
  }
}

// 开始新的投票会话
async function startNewVotingSession(sessionType: VotingSessionType): Promise<VotingSession> {
  console.log(`Starting new voting session of type: ${sessionType}`);

  // 强制从区块链获取最新状态
  const currentBook = await getCurrentBook();
  console.log('Current book state for new session:',
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
    console.log('No book found, forcing title voting session');
    actualType = 'title';
  }
  // 如果书籍已归档，强制使用标题投票
  else if (currentBook.status === 1) {
    console.log('Book is archived (status=1), forcing title voting session');
    actualType = 'title';
  }
  // 如果有活跃的书籍且请求的是标题投票，检查是否应该强制为段落投票
  else if (sessionType === 'title' && currentBook.status === 0 && currentBook.paragraphs.length < 10) {
    console.log(`Active book exists with ${currentBook.paragraphs.length} paragraphs (less than 10), forcing paragraph voting session`);
    actualType = 'paragraph';
  }
  // 如果书籍已经有10个或更多段落，强制使用标题投票（应该已经归档，但以防万一）
  else if (currentBook.paragraphs.length >= 10) {
    console.log(`Book has ${currentBook.paragraphs.length} paragraphs (>= 10), should be archived, forcing title voting session`);
    actualType = 'title';

    // 尝试归档书籍
    try {
      console.log('Attempting to archive book that has 10 or more paragraphs...');
      // 使用系统作者地址
      const systemAuthor = '0x0000000000000000000000000000000000000000000000000000000000000123';
      await executeAddParagraphAndArchive('System auto-archive', systemAuthor);
    } catch (error) {
      console.error('Failed to auto-archive book:', error);
      // 继续创建标题投票会话
    }
  }

  console.log(`Final session type: ${actualType}`);

  // 设置过期时间
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + VOTING_COUNTDOWN_SECONDS);

  // 创建新的投票会话
  const newSession = await createVotingSession(actualType, expiresAt);

  console.log(`Started new ${actualType} voting session, expires at ${expiresAt.toISOString()}`);

  return newSession;
}
