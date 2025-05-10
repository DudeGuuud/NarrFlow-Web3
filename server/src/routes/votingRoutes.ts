import express from 'express';
import { getCurrentVotingSession, getActiveVotingSessions } from '../controllers/votingController.js';

export const votingRoutes: express.Router = express.Router();

// 获取当前活跃的投票会话
votingRoutes.get('/current', getCurrentVotingSession);

// 获取所有活跃的投票会话
votingRoutes.get('/', getActiveVotingSessions);
