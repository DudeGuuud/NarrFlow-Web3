const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { SuiClient } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');

// 加载环境变量
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// 日志级别控制
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 日志工具函数
function logger(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[LOG_LEVEL] || 1;
    if (levels[level] >= currentLevel) {
        const timestamp = new Date().toISOString();
        console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
    }
}

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger('error', 'Supabase URL or key not found in environment variables');
    throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化 Sui 客户端
const networkType = process.env.SUI_NETWORK || 'testnet';
const suiClient = new SuiClient({
    url: `https://fullnode.${networkType}.sui.io/`
});

// 从环境变量获取配置
const PACKAGE_ID = process.env.PACKAGE_ID;
const STORYBOOK_ID = process.env.STORYBOOK_ID;
const TREASURY_ID = process.env.TREASURY_ID;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const VOTING_COUNTDOWN_SECONDS = parseInt(process.env.VOTING_COUNTDOWN_SECONDS || '300');
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || '2');

// 验证必要的环境变量
if (!PACKAGE_ID || !STORYBOOK_ID || !TREASURY_ID) {
    throw new Error('Missing required environment variables: PACKAGE_ID, STORYBOOK_ID, or TREASURY_ID');
}

// 初始化管理员密钥对
let adminKeypair;
try {
    if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not found in environment variables');
    }
    adminKeypair = Ed25519Keypair.fromSecretKey(ADMIN_PRIVATE_KEY);
    logger('debug', 'Admin wallet initialized successfully');
    logger('debug', `Admin address: ${adminKeypair.toSuiAddress()}`);
} catch (error) {
    logger('error', 'Failed to initialize admin wallet:', error);
    throw error;
}

// 导出配置供其他模块使用
module.exports.supabase = supabase;
module.exports.suiClient = suiClient;
module.exports.PACKAGE_ID = PACKAGE_ID;
module.exports.STORYBOOK_ID = STORYBOOK_ID;
module.exports.TREASURY_ID = TREASURY_ID;
module.exports.ADMIN_PRIVATE_KEY = ADMIN_PRIVATE_KEY;
module.exports.VOTING_COUNTDOWN_SECONDS = VOTING_COUNTDOWN_SECONDS;
module.exports.VOTE_THRESHOLD = VOTE_THRESHOLD;
module.exports.adminKeypair = adminKeypair;
module.exports.logger = logger;

// 主处理函数
module.exports.default = function handler(req, res) {
    res.status(200).json({
        message: 'NarrFlow API is running',
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
};
