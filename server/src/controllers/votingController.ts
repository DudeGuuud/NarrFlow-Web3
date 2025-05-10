import { Request, Response } from 'express';
import { getOrCreateActiveVotingSession } from '../services/votingService.js';
import { getActiveVotingSession } from '../services/databaseService.js';

// 获取当前活跃的投票会话
export async function getCurrentVotingSession(req: Request, res: Response): Promise<void> {
  try {
    const session = await getOrCreateActiveVotingSession();
    res.json(session);
  } catch (error) {
    console.error('Error getting current voting session:', error);
    res.status(500).json({ 
      error: 'Failed to get current voting session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 获取所有活跃的投票会话
export async function getActiveVotingSessions(req: Request, res: Response): Promise<void> {
  try {
    const session = await getActiveVotingSession();
    res.json(session ? [session] : []);
  } catch (error) {
    console.error('Error getting active voting sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get active voting sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
