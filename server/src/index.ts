import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { votingRoutes } from './routes/votingRoutes.js';
import { proposalRoutes } from './routes/proposalRoutes.js';
import { bookRoutes } from './routes/bookRoutes.js';
import { checkVotingSessions } from './services/votingService.js';

// 在文件顶部添加日志级别控制
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // 'debug', 'info', 'warn', 'error'

// 添加日志工具函数
export function logger(level: string, message: string, ...args: any[]): void {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL as keyof typeof levels] || 1;

  if (levels[level as keyof typeof levels] >= currentLevel) {
    const timestamp = new Date().toISOString();
    console[level as 'log' | 'info' | 'warn' | 'error'](`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
  }
}

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });
logger('info', `Environment variables loaded from: ${path.resolve(__dirname, '../.env')}`);

// 初始化 Express 应用
const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

logger('info', `Supabase URL: ${supabaseUrl ? 'Found' : 'Not found'}`);
logger('info', `Supabase Key: ${supabaseKey ? 'Found' : 'Not found'}`);

if (!supabaseUrl || !supabaseKey) {
  logger('error', 'Supabase URL or key not found in environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化 Sui 客户端
const networkType = process.env.SUI_NETWORK || 'testnet';
export const suiClient = new SuiClient({
  url: `https://fullnode.${networkType}.sui.io/`
});

// 从环境变量获取配置
export const PACKAGE_ID = process.env.PACKAGE_ID;
export const STORYBOOK_ID = process.env.STORYBOOK_ID;
export const TREASURY_ID = process.env.TREASURY_ID;
export const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
export const VOTING_COUNTDOWN_SECONDS = parseInt(process.env.VOTING_COUNTDOWN_SECONDS || '300'); // 默认 5 分钟
export const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || '2'); // 默认 2 票

// 验证必要的环境变量
if (!PACKAGE_ID || !STORYBOOK_ID || !TREASURY_ID) {
  console.error('Missing required environment variables: PACKAGE_ID, STORYBOOK_ID, or TREASURY_ID');
  process.exit(1);
}

// 初始化管理员密钥对
export let adminKeypair: Ed25519Keypair;
try {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('Admin private key not found in environment variables');
  }

  // 直接使用 Bech32 编码的私钥创建密钥对
  adminKeypair = Ed25519Keypair.fromSecretKey(ADMIN_PRIVATE_KEY);

  logger('debug', 'Admin wallet initialized successfully');
  logger('debug', `Admin address: ${adminKeypair.toSuiAddress()}`);
} catch (error) {
  console.error('Failed to initialize admin wallet:', error);
  process.exit(1);
}

// 创建必要的表
async function createTables() {
  try {
    logger('info', 'Creating necessary tables...');

    // 创建一个活跃的投票会话
    logger('info', 'Creating active voting session...');
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + VOTING_COUNTDOWN_SECONDS);

    const { data: votingSession, error: votingSessionError } = await supabase
      .from('voting_sessions')
      .insert({
        type: 'title',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (votingSessionError) {
      console.error('Error creating voting session:', votingSessionError);
    } else {
      logger('info', `Voting session created successfully: ${JSON.stringify(votingSession)}`);
    }

    logger('info', 'Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// 在启动服务器之前创建表
await createTables();



// 注册路由
app.use('/api/voting-sessions', votingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/books', bookRoutes);

// 健康检查端点
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      packageId: PACKAGE_ID,
      storyBookId: STORYBOOK_ID,
      treasuryId: TREASURY_ID,
      votingCountdown: VOTING_COUNTDOWN_SECONDS,
      voteThreshold: VOTE_THRESHOLD,
      adminAddress: adminKeypair.toSuiAddress(),
      network: networkType
    }
  });
});

// 设置定时任务，每分钟检查一次过期的投票会话
// 但内部有限制，实际上不会每次都执行完整检查
cron.schedule('* * * * *', async () => {
  try {
    logger('debug', 'Running scheduled check for expired voting sessions');
    await checkVotingSessions();
  } catch (error) {
    logger('error', 'Error checking voting sessions:', error);
  }
});

// 设置另一个定时任务，每小时清理一次数据库中的过期会话
cron.schedule('0 * * * *', async () => {
  try {
    logger('info', 'Running scheduled cleanup of old voting sessions');

    // 获取所有非活跃的会话
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('id')
      .not('status', 'eq', 'active')
      .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24小时前过期的

    if (error) {
      logger('error', 'Error fetching old voting sessions:', error);
      return;
    }

    if (data && data.length > 0) {
      logger('info', `Found ${data.length} old voting sessions to clean up`);

      // 删除这些会话
      const { error: deleteError } = await supabase
        .from('voting_sessions')
        .delete()
        .in('id', data.map(session => session.id));

      if (deleteError) {
        logger('error', 'Error deleting old voting sessions:', deleteError);
      } else {
        logger('info', `Successfully cleaned up ${data.length} old voting sessions`);
      }
    } else {
      logger('debug', 'No old voting sessions to clean up');
    }
  } catch (error) {
    logger('error', 'Error cleaning up old voting sessions:', error);
  }
});

// 立即清理所有过期的投票会话
(async () => {
  try {
    logger('info', 'Running immediate cleanup of all expired voting sessions');

    // 获取所有过期的会话
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('id')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      logger('error', 'Error fetching expired voting sessions:', error);
      return;
    }

    if (data && data.length > 0) {
      logger('info', `Found ${data.length} expired voting sessions to clean up immediately`);

      // 分批删除会话，每批最多100个
      const BATCH_SIZE = 100;
      const batches = Math.ceil(data.length / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min((i + 1) * BATCH_SIZE, data.length);
        const batchIds = data.slice(start, end).map(session => session.id);

        logger('info', `Deleting batch ${i+1}/${batches} (${batchIds.length} sessions)`);

        const { error: deleteError } = await supabase
          .from('voting_sessions')
          .delete()
          .in('id', batchIds);

        if (deleteError) {
          logger('error', `Error deleting batch ${i+1}/${batches}:`, deleteError);
        } else {
          logger('info', `Successfully cleaned up batch ${i+1}/${batches}`);
        }

        // 添加短暂延迟，避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger('info', `Completed cleanup of ${data.length} expired voting sessions`);
    } else {
      logger('debug', 'No expired voting sessions to clean up');
    }
  } catch (error) {
    logger('error', 'Error cleaning up expired voting sessions:', error);
  }
})();

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger('info', `Server running on port ${PORT}`);
  logger('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
  logger('info', `Network: ${networkType}`);
  logger('info', `Admin address: ${adminKeypair.toSuiAddress()}`);
});
