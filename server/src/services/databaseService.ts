import { supabase, logger } from '../index.js';
import { VotingSession, Proposal, Vote, VotingSessionType, VotingSessionStatus, ProposalStats } from '../models/types.js';

// 投票会话相关操作
export async function getActiveVotingSession(): Promise<VotingSession | null> {
  const { data, error } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data as VotingSession;
}

export async function createVotingSession(
  type: VotingSessionType,
  expiresAt: Date
): Promise<VotingSession> {
  const { data, error } = await supabase
    .from('voting_sessions')
    .insert({
      type,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as VotingSession;
}

export async function updateVotingSessionStatus(
  sessionId: string,
  status: VotingSessionStatus,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('voting_sessions')
    .update({
      status,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export async function getExpiredVotingSessions(): Promise<VotingSession[]> {
  const now = new Date();

  const { data, error } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', now.toISOString());

  if (error) {
    throw error;
  }

  return data as VotingSession[];
}

// 提案相关操作
export async function getProposalsByType(type: VotingSessionType): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('type', type)
    .order('votes', { ascending: false });

  if (error) {
    throw error;
  }

  return data as Proposal[];
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data as Proposal;
}

export async function createProposal(
  content: string,
  author: string,
  type: VotingSessionType
): Promise<Proposal> {
  logger('info', `Creating new proposal: type=${type}, author=${author}, content=${content.substring(0, 30)}...`);

  // 确保作者地址格式一致（统一使用小写）
  const normalizedAuthor = author.toLowerCase();

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      content,
      author: normalizedAuthor,
      type,
      votes: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    logger('error', 'Error creating proposal:', error);
    throw error;
  }

  logger('debug', `Proposal created successfully with ID: ${data.id}`);

  // 更新提案统计
  try {
    await updateProposalStats(normalizedAuthor, 'submitted');
    logger('debug', `Updated proposal stats for author: ${normalizedAuthor}`);
  } catch (statsError) {
    logger('error', 'Error updating proposal stats:', statsError);
    // 不阻止主流程
  }

  return data as Proposal;
}

export async function updateProposalVotes(id: string, votes: number): Promise<void> {
  const { error } = await supabase
    .from('proposals')
    .update({ votes })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// 投票相关操作
export async function getVoteByVoter(voter: string): Promise<Vote | null> {
  logger('debug', `Getting vote for voter: ${voter}`);

  // 规范化地址（统一使用小写）
  const normalizedVoter = voter.toLowerCase();

  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('voter', normalizedVoter);

  if (error) {
    logger('error', 'Error getting vote by voter:', error);
    throw error;
  }

  // 如果没有找到投票，返回null
  if (!data || data.length === 0) {
    logger('debug', `No vote found for voter: ${normalizedVoter}`);
    return null;
  }

  // 返回第一个投票（一个用户只能有一个有效投票）
  logger('debug', `Found vote for voter ${normalizedVoter}:`, data[0]);
  return data[0] as Vote;
}

export async function createVote(proposalId: string, voter: string): Promise<Vote> {
  logger('info', `Creating new vote: proposalId=${proposalId}, voter=${voter}`);

  // 确保投票者地址格式一致（统一使用小写）
  const normalizedVoter = voter.toLowerCase();

  const { data, error } = await supabase
    .from('votes')
    .insert({
      proposal_id: proposalId,
      voter: normalizedVoter,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    logger('error', 'Error creating vote:', error);
    throw error;
  }

  logger('debug', `Vote created successfully with ID: ${data.id}`);

  // 获取提案
  try {
    const proposal = await getProposalById(proposalId);
    if (proposal) {
      logger('debug', `Updating vote count for proposal: ${proposalId}`);

      // 更新提案的投票数
      await updateProposalVotes(proposalId, proposal.votes + 1);

      // 更新提案作者的统计
      await updateProposalStats(proposal.author, 'voted');
      logger('debug', `Updated proposal stats for author: ${proposal.author}`);
    }
  } catch (statsError) {
    logger('error', 'Error updating proposal stats after vote:', statsError);
    // 不阻止主流程
  }

  return data as Vote;
}

// 清理提案和投票
export async function clearProposalsAndVotes(): Promise<void> {
  logger('info', 'Clearing all votes and proposals from database');

  try {
    // 先获取当前投票数量
    const { data: votesData, error: votesCountError } = await supabase
      .from('votes')
      .select('id', { count: 'exact' });

    if (votesCountError) {
      logger('error', 'Error counting votes:', votesCountError);
    } else {
      logger('debug', `Found ${votesData.length} votes to delete`);
    }

    // 先删除投票（由于外键约束）
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .not('id', 'is', null);

    if (votesError) {
      logger('error', 'Error deleting votes:', votesError);
      throw votesError;
    }

    logger('debug', 'All votes deleted successfully');

    // 获取当前提案数量
    const { data: proposalsData, error: proposalsCountError } = await supabase
      .from('proposals')
      .select('id', { count: 'exact' });

    if (proposalsCountError) {
      logger('error', 'Error counting proposals:', proposalsCountError);
    } else {
      logger('debug', `Found ${proposalsData.length} proposals to delete`);
    }

    // 然后删除提案
    const { error: proposalsError } = await supabase
      .from('proposals')
      .delete()
      .not('id', 'is', null);

    if (proposalsError) {
      logger('error', 'Error deleting proposals:', proposalsError);
      throw proposalsError;
    }

    logger('debug', 'All proposals deleted successfully');
  } catch (error) {
    logger('error', 'Error in clearProposalsAndVotes:', error);
    throw error;
  }
}

// 提案统计相关操作
export async function getProposalStats(author: string): Promise<ProposalStats | null> {
  const { data, error } = await supabase
    .from('proposal_stats')
    .select('*')
    .eq('author', author)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data as ProposalStats;
}

export async function updateProposalStats(
  author: string,
  action: 'submitted' | 'voted' | 'won' | 'rewarded',
  tokenAmount?: number
): Promise<void> {
  // 获取现有统计或创建新的
  let stats = await getProposalStats(author);

  if (!stats) {
    // 创建新的统计记录
    const { data, error } = await supabase
      .from('proposal_stats')
      .insert({
        author,
        proposals_submitted: 0,
        proposals_won: 0,
        votes_received: 0,
        tokens_earned: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    stats = data as ProposalStats;
  }

  // 根据操作类型更新统计
  const updates: Partial<ProposalStats> = {
    updated_at: new Date().toISOString()
  };

  switch (action) {
    case 'submitted':
      updates.proposals_submitted = (stats.proposals_submitted || 0) + 1;
      break;
    case 'voted':
      updates.votes_received = (stats.votes_received || 0) + 1;
      break;
    case 'won':
      updates.proposals_won = (stats.proposals_won || 0) + 1;
      break;
    case 'rewarded':
      if (tokenAmount) {
        updates.tokens_earned = (stats.tokens_earned || 0) + tokenAmount;
      }
      break;
  }

  // 更新统计
  const { error } = await supabase
    .from('proposal_stats')
    .update(updates)
    .eq('author', author);

  if (error) {
    throw error;
  }
}
