// 投票会话类型
export type VotingSessionType = 'title' | 'paragraph';

// 投票会话状态
export type VotingSessionStatus = 'active' | 'completed' | 'failed';

// 投票会话
export interface VotingSession {
  id: string;
  type: VotingSessionType;
  status: VotingSessionStatus;
  expires_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 提案
export interface Proposal {
  id: string;
  content: string;
  author: string;
  type: VotingSessionType;
  votes: number;
  created_at: string;
}

// 投票
export interface Vote {
  id: string;
  proposal_id: string;
  voter: string;
  created_at: string;
}

// 书籍段落
export interface Paragraph {
  content: string;
  author: string;
  votes: number;
}

// 书籍
export interface Book {
  index: number;
  title: string;
  author: string;
  status: number;
  bookIndex: number;
  paragraphs: Paragraph[];
}

// 交易结果
export interface TransactionResult {
  digest: string;
  effects?: any;
  archived?: boolean;
  balanceChanges?: any;
  events?: any;
  transaction?: any;
}

// 提案统计
export interface ProposalStats {
  id: string;
  author: string;
  proposals_submitted: number;
  proposals_won: number;
  votes_received: number;
  tokens_earned: number;
  created_at: string;
  updated_at: string;
}
