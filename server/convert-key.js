import { Ed25519Keypair } from '@mysten/sui';
import { fromB64 } from '@mysten/bcs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 .env 文件
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// 获取 Bech32 编码的私钥
const bech32PrivateKey = envConfig.ADMIN_PRIVATE_KEY;

if (!bech32PrivateKey) {
  console.error('未在 .env 文件中找到 ADMIN_PRIVATE_KEY');
  process.exit(1);
}

try {
  // 从 Bech32 私钥创建密钥对
  const keypair = Ed25519Keypair.fromSecretKey(fromB64(bech32PrivateKey));

  // 获取地址
  const address = keypair.toSuiAddress();

  console.log('密钥对创建成功！');
  console.log('地址:', address);

  // 将私钥转换为 Base64 格式
  const base64PrivateKey = Buffer.from(keypair.export().privateKey).toString('base64');

  console.log('Base64 编码的私钥:', base64PrivateKey);

  // 更新 .env 文件
  const updatedEnv = { ...envConfig, ADMIN_PRIVATE_KEY: base64PrivateKey };

  // 将更新后的配置写回 .env 文件
  const updatedEnvContent = Object.entries(updatedEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, updatedEnvContent);

  console.log('.env 文件已更新，私钥已转换为 Base64 格式');
} catch (error) {
  console.error('转换私钥时出错:', error);
  process.exit(1);
}
