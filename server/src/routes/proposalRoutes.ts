import express from 'express';
import { getProposals, addProposal, vote, getStats } from '../controllers/proposalController.js';

export const proposalRoutes: express.Router = express.Router();

// 获取提案
proposalRoutes.get('/', getProposals);

// 创建提案
proposalRoutes.post('/', addProposal);

// 投票
proposalRoutes.post('/vote', vote);

// 获取提案统计
proposalRoutes.get('/stats/:author', getStats);
