import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';
import { votingRoutes } from './routes/votingRoutes.js';
import { proposalRoutes } from './routes/proposalRoutes.js';
import { checkVotingSessions } from './services/votingService.js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 初始化 Express 应用
const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化 Sui 客户端
const networkType = process.env.VITE_SUI_NETWORK || 'testnet';
export const suiClient = new SuiClient({
  url: `https://fullnode.${networkType}.sui.io/`
});

// 从环境变量获取配置
export const PACKAGE_ID = process.env.VITE_PACKAGE_ID;
export const STORYBOOK_ID = process.env.VITE_STORYBOOK_ID;
export const TREASURY_ID = process.env.VITE_TREASURY_ID;
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

  console.log('Admin wallet initialized successfully');
  console.log('Admin address:', adminKeypair.toSuiAddress());
} catch (error) {
  console.error('Failed to initialize admin wallet:', error);
  process.exit(1);
}

// 创建必要的表
async function createTables() {
  try {
    console.log('Creating necessary tables...');

    // 创建一个活跃的投票会话
    console.log('Creating active voting session...');
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
      console.log('Voting session created successfully:', votingSession);
    }

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// 在启动服务器之前创建表
await createTables();

// 注册路由
app.use('/api/voting-sessions', votingRoutes);
app.use('/api/proposals', proposalRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
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
cron.schedule('* * * * *', async () => {
  try {
    await checkVotingSessions();
  } catch (error) {
    console.error('Error checking voting sessions:', error);
  }
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Network: ${networkType}`);
  console.log(`Admin address: ${adminKeypair.toSuiAddress()}`);
});
