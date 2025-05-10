const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // 创建 voting_sessions 表
    console.log('Creating voting_sessions table...');
    const { error: createVotingSessionsError } = await supabase.from('voting_sessions').select('*').limit(1).maybeSingle();

    if (createVotingSessionsError && createVotingSessionsError.code === '42P01') {
      console.log('Table voting_sessions does not exist, creating it...');
      const { error } = await supabase.rpc('create_table', {
        table_name: 'voting_sessions',
        columns: [
          { name: 'id', type: 'bigserial primary key' },
          { name: 'type', type: 'text not null' },
          { name: 'status', type: 'text not null' },
          { name: 'expires_at', type: 'timestamptz not null' },
          { name: 'notes', type: 'text' },
          { name: 'created_at', type: 'timestamptz not null default now()' },
          { name: 'updated_at', type: 'timestamptz not null default now()' }
        ]
      });

      if (error) {
        console.error('Error creating voting_sessions table:', error);
      } else {
        console.log('voting_sessions table created successfully');
      }
    } else {
      console.log('voting_sessions table already exists');
    }

    // 创建 proposal_stats 表
    console.log('Creating proposal_stats table...');
    const { error: createProposalStatsError } = await supabase.from('proposal_stats').select('*').limit(1).maybeSingle();

    if (createProposalStatsError && createProposalStatsError.code === '42P01') {
      console.log('Table proposal_stats does not exist, creating it...');
      const { error } = await supabase.rpc('create_table', {
        table_name: 'proposal_stats',
        columns: [
          { name: 'id', type: 'bigserial primary key' },
          { name: 'author', type: 'text not null' },
          { name: 'proposals_submitted', type: 'integer not null default 0' },
          { name: 'proposals_won', type: 'integer not null default 0' },
          { name: 'votes_received', type: 'integer not null default 0' },
          { name: 'tokens_earned', type: 'bigint not null default 0' },
          { name: 'created_at', type: 'timestamptz not null default now()' },
          { name: 'updated_at', type: 'timestamptz not null default now()' }
        ]
      });

      if (error) {
        console.error('Error creating proposal_stats table:', error);
      } else {
        console.log('proposal_stats table created successfully');
      }
    } else {
      console.log('proposal_stats table already exists');
    }

    console.log('Database setup completed successfully');

    // Check if we need to create an initial voting session
    const { data: sessions, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    if (!sessions || sessions.length === 0) {
      console.log('Creating initial voting session...');

      // Set expiry time to 5 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const { data, error: insertError } = await supabase
        .from('voting_sessions')
        .insert({
          type: 'title',
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error(`Error creating initial voting session: ${insertError.message}`);
      } else {
        console.log(`Initial voting session created, expires at ${expiresAt.toISOString()}`);
      }
    } else {
      console.log(`Found ${sessions.length} active voting sessions, no need to create a new one`);
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
