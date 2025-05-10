-- Create voting_sessions table
create table if not exists voting_sessions (
  id bigserial primary key,
  type text not null, -- 'title' or 'paragraph'
  status text not null, -- 'active', 'completed', 'failed'
  expires_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on status and expires_at for efficient queries
create index if not exists idx_voting_sessions_status on voting_sessions(status);
create index if not exists idx_voting_sessions_expires_at on voting_sessions(expires_at);

-- Add proposal_stats table to track statistics
create table if not exists proposal_stats (
  id bigserial primary key,
  author text not null,
  proposals_submitted integer not null default 0,
  proposals_won integer not null default 0,
  votes_received integer not null default 0,
  tokens_earned bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create unique index on author
create unique index if not exists idx_proposal_stats_author on proposal_stats(author);
