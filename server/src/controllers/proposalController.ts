import { Request, Response } from 'express';
import {
  getProposalsByType,
  createProposal,
  getVoteByVoter,
  createVote,
  updateProposalVotes,
  getProposalById,
  getProposalStats
} from '../services/databaseService.js';
import { VotingSessionType } from '../models/types.js';

// 获取提案
export async function getProposals(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as VotingSessionType | undefined;

    if (type && type !== 'title' && type !== 'paragraph') {
      res.status(400).json({ error: 'Invalid proposal type' });
      return;
    }

    if (type) {
      const proposals = await getProposalsByType(type);
      res.json(proposals);
    } else {
      // 如果没有指定类型，返回所有提案
      const titleProposals = await getProposalsByType('title');
      const paragraphProposals = await getProposalsByType('paragraph');
      res.json([...titleProposals, ...paragraphProposals]);
    }
  } catch (error) {
    console.error('Error getting proposals:', error);
    res.status(500).json({
      error: 'Failed to get proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 创建提案
export async function addProposal(req: Request, res: Response): Promise<void> {
  try {
    const { content, author, type } = req.body;

    if (!content || !author || !type) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (type !== 'title' && type !== 'paragraph') {
      res.status(400).json({ error: 'Invalid proposal type' });
      return;
    }

    const proposal = await createProposal(content, author, type);
    res.status(201).json(proposal);
  } catch (error) {
    console.error('Error adding proposal:', error);
    res.status(500).json({
      error: 'Failed to add proposal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 投票
export async function vote(req: Request, res: Response): Promise<void> {
  try {
    const { proposal_id, voter } = req.body;

    if (!proposal_id || !voter) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // 检查提案是否存在
    const proposal = await getProposalById(proposal_id);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    // 检查用户是否已经投票
    const existingVote = await getVoteByVoter(voter);
    if (existingVote) {
      res.status(400).json({ error: 'User has already voted' });
      return;
    }

    // 创建投票
    await createVote(proposal_id, voter);

    // 更新提案票数
    const newVotes = proposal.votes + 1;
    await updateProposalVotes(proposal_id, newVotes);

    res.json({ success: true, votes: newVotes });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({
      error: 'Failed to vote',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 获取提案统计
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const { author } = req.params;

    if (!author) {
      res.status(400).json({ error: 'Missing author parameter' });
      return;
    }

    const stats = await getProposalStats(author);

    if (!stats) {
      res.status(404).json({ error: 'No statistics found for this author' });
      return;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting proposal stats:', error);
    res.status(500).json({
      error: 'Failed to get proposal statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 检查用户是否已投票
export async function checkVote(req: Request, res: Response): Promise<void> {
  try {
    const { voter } = req.params;

    if (!voter) {
      res.status(400).json({ error: 'Missing voter parameter' });
      return;
    }

    // 规范化地址（统一使用小写）
    const normalizedVoter = voter.toLowerCase();

    // 获取用户的投票
    const vote = await getVoteByVoter(normalizedVoter);

    if (vote) {
      // 如果找到投票，返回提案ID
      res.json({ proposal_id: vote.proposal_id });
    } else {
      // 如果没有找到投票，返回空对象
      res.json({});
    }
  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({
      error: 'Failed to check vote status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
