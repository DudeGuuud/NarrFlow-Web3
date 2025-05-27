// API 客户端配置
// 统一管理所有 API 调用

// 类型定义
export interface VotingSession {
  id: string;
  type: 'title' | 'paragraph';
  status: 'active' | 'completed' | 'failed';
  expires_at: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

export interface Proposal {
  id: string;
  content: string;
  author: string;
  type: 'title' | 'paragraph';
  votes: number;
  created_at: string;
}

export interface Book {
  id?: string;
  index: number;
  title: string;
  author: string;
  status: number;
  paragraphs: Paragraph[];
  bookIndex?: number;
}

export interface Paragraph {
  content: string;
  author: string;
  votes: number;
}

export interface VoteCheckResponse {
  proposal_id?: string;
}

export interface ProposalStats {
  author: string;
  proposals_submitted: number;
  proposals_won: number;
  votes_received: number;
  tokens_earned: number;
  created_at: string;
  updated_at: string;
}

// 获取 API 基础 URL
function getApiBaseUrl(): string {
  // 在生产环境中，如果没有设置 VITE_API_BASE_URL，使用当前域名
  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    return window.location.origin;
  }

  // 开发环境使用环境变量或默认的本地开发地址
  const devUrl = import.meta.env.VITE_API_BASE_URL;
  if (devUrl && devUrl !== 'http://localhost') {
    return devUrl;
  }

  return 'http://localhost:3001';
}

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

// 通用的 fetch 包装器
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  console.log(`API Request: ${finalOptions.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
}

// 投票会话相关 API
export const votingSessionsApi = {
  // 获取当前活跃的投票会话
  getCurrent: (): Promise<VotingSession> => apiRequest('/api/v1/voting-sessions/current'),

  // 获取所有活跃的投票会话
  getAll: (): Promise<VotingSession[]> => apiRequest('/api/v1/voting-sessions'),
};

// 提案相关 API
export const proposalsApi = {
  // 获取提案
  getAll: (type?: 'title' | 'paragraph'): Promise<Proposal[]> => {
    const query = type ? `?type=${type}` : '';
    return apiRequest(`/api/v1/proposals${query}`);
  },

  // 创建提案
  create: (data: { content: string; author: string; type: 'title' | 'paragraph' }): Promise<Proposal> =>
    apiRequest('/api/v1/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 投票
  vote: (data: { proposal_id: string; voter: string }): Promise<{ success: boolean; votes: number }> =>
    apiRequest('/api/v1/proposals/vote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 检查用户投票状态
  checkVote: (voter: string): Promise<VoteCheckResponse> =>
    apiRequest(`/api/v1/proposals/vote/check/${voter.toLowerCase()}`),

  // 获取作者统计
  getStats: (author: string): Promise<ProposalStats> =>
    apiRequest(`/api/v1/proposals/stats/${author}`),
};

// 书籍相关 API
export const booksApi = {
  // 获取所有书籍
  getAll: (): Promise<Book[]> => apiRequest('/api/v1/books'),

  // 获取当前书籍
  getCurrent: (): Promise<Book> => apiRequest('/api/v1/books/current'),

  // 根据索引获取书籍
  getByIndex: (index: number): Promise<Book> => apiRequest(`/api/v1/books/${index}`),
};

// 健康检查 API
export const healthApi = {
  check: () => apiRequest('/api/v1/health'),
};

// 导出 API 基础 URL 供其他地方使用
export { API_BASE_URL };
