-- Create jackpot rounds table
CREATE TABLE IF NOT EXISTS tg_jackpot_rounds (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','spinning','closed','paid')),
  prize_pool NUMERIC(20,8) NOT NULL DEFAULT 0,
  house_cut NUMERIC(20,8) NOT NULL DEFAULT 0,
  entry_count INT NOT NULL DEFAULT 0,
  winner_id BIGINT REFERENCES tg_users(id),
  winner_entry_amount NUMERIC(20,8),
  winner_payout NUMERIC(20,8),
  winning_ticket INT,
  result_hash TEXT,
  server_seed TEXT,
  client_seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Create jackpot entries table
CREATE TABLE IF NOT EXISTS tg_jackpot_entries (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES tg_jackpot_rounds(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES tg_users(id),
  amount NUMERIC(20,8) NOT NULL,
  ticket_number INT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'evm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jackpot_entries_round ON tg_jackpot_entries(round_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_entries_user ON tg_jackpot_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_rounds_status ON tg_jackpot_rounds(status);
