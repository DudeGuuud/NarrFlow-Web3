import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 初始化 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // 我们将使用 Supabase 的 REST API 创建表
    // 由于我们无法直接执行 SQL，我们将使用 Supabase 的表创建功能

    // 创建投票会话表
    console.log('Creating voting_sessions table...');
    const { error: createVotingSessionsError } = await supabase
      .from('voting_sessions')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        type: 'title',
        status: 'active',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (createVotingSessionsError) {
      if (createVotingSessionsError.code === '23505') {
        console.log('voting_sessions table already exists');
      } else {
        console.error('Error creating voting_sessions table:', createVotingSessionsError);
      }
    } else {
      console.log('voting_sessions table created successfully');

      // 删除测试数据
      await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 创建提案表
    console.log('Creating proposals table...');
    const { error: createProposalsError } = await supabase
      .from('proposals')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        content: 'Test proposal',
        author: '0x0',
        type: 'title',
        votes: 0,
        created_at: new Date().toISOString()
      })
      .select();

    if (createProposalsError) {
      if (createProposalsError.code === '23505') {
        console.log('proposals table already exists');
      } else {
        console.error('Error creating proposals table:', createProposalsError);
      }
    } else {
      console.log('proposals table created successfully');

      // 删除测试数据
      await supabase
        .from('proposals')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 创建投票表
    console.log('Creating votes table...');
    const { error: createVotesError } = await supabase
      .from('votes')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        proposal_id: '00000000-0000-0000-0000-000000000000',
        voter: '0x0',
        created_at: new Date().toISOString()
      })
      .select();

    if (createVotesError) {
      if (createVotesError.code === '23505') {
        console.log('votes table already exists');
      } else {
        console.error('Error creating votes table:', createVotesError);
      }
    } else {
      console.log('votes table created successfully');

      // 删除测试数据
      await supabase
        .from('votes')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 创建提案统计表
    console.log('Creating proposal_stats table...');
    const { error: createStatsError } = await supabase
      .from('proposal_stats')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        author: '0x0',
        proposals_submitted: 0,
        proposals_won: 0,
        votes_received: 0,
        tokens_earned: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (createStatsError) {
      if (createStatsError.code === '23505') {
        console.log('proposal_stats table already exists');
      } else {
        console.error('Error creating proposal_stats table:', createStatsError);
      }
    } else {
      console.log('proposal_stats table created successfully');

      // 删除测试数据
      await supabase
        .from('proposal_stats')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// 执行数据库设置
setupDatabase();
